const { sql, poolPromise } = require('../config/db');
const crypto = require('crypto');

interface Appointment {
    appointment_id: string;
    status: string;
    date: string;
    time: string;
    service: string;
    vet_name: string;
    service_name: string;
}

interface AppointmentInput {
    vet_id: string;
    user_id: string;
    service_id: string;
    scheduled_time: string;
    status?: 'pending' | 'completed' | 'cancelled';
}

interface AllAppointmentRecord {
    appointment_id: string;
    vet_id: string;
    user_id: string;
    service_id: string;
    date: string;
    time: string;
    status: string;
    vet_name: string;
    client_name: string;
}

/**
 * Fetches appointments for a specific user.
 * SYNCED: Uses 'user_id' and 'date/time' columns from your DB.
 */
const getAppointmentsByUserId = async (user_id: string): Promise<Appointment[]> => {
    try {
        const pool = await poolPromise;
        
        const result = await pool.request()
            .input('user_id', sql.VarChar(100), user_id)
            .query(`
                SELECT 
                    a.appointment_id,
                    a.status,
                    a.date,          -- From your actual table
                    a.time,          -- From your actual table
                    a.service,       -- From your actual table
                    v.name AS vet_name,
                    s.name AS service_name
                FROM appointments a
                LEFT JOIN Users v ON a.vet_id = v.user_id
                LEFT JOIN Services s ON a.service_id = s.service_id
                WHERE a.user_id = @user_id  -- Corrected from client_id
                ORDER BY a.date DESC, a.time DESC
            `);
        
        return result.recordset;
    } catch (error) {
        console.error("Error retrieving appointments for user:", error);
        throw new Error("Failed to load user appointments.");
    }
};

/**
 * Creates a new appointment.
 * SYNCED: Maps 'scheduled_time' into separate 'date' and 'time' columns.
 */
const createAppointment = async (appointment: { vet_id: any; user_id: any; service_id: any; scheduled_time: any; status?: "pending" | undefined; }) => {
    const { 
        vet_id, 
        user_id, // Ensure we pass user_id here
        service_id, 
        scheduled_time, 
        status = 'pending' 
    } = appointment;

    const pool = await poolPromise;
    const appointment_id = crypto.randomUUID(); 

    // Split 'YYYY-MM-DD HH:mm:ss' into two parts for your DB columns
    const [datePart, timePart] = scheduled_time.split(' ');

    try {
        const request = pool.request();
        request
            .input('appointment_id', sql.VarChar(100), appointment_id)
            .input('vet_id', sql.VarChar(100), vet_id)
            .input('user_id', sql.VarChar(100), user_id)
            .input('service_id', sql.VarChar(100), service_id)
            .input('date', sql.VarChar(20), datePart)
            .input('time', sql.VarChar(20), timePart)
            .input('status', sql.VarChar(20), status);

        await request.query(`
            INSERT INTO appointments 
                (appointment_id, vet_id, user_id, service_id, date, time, status)
            VALUES 
                (@appointment_id, @vet_id, @user_id, @service_id, @date, @time, @status)
        `);

        return appointment_id; 
    } catch (error) {
        console.error("Error creating appointment:", error);
        throw error;
    }
};

/**
 * Admin view: Fetch all
 */
const getAllAppointments = async () => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT a.*, v.name AS vet_name, u.name AS client_name
            FROM appointments a
            LEFT JOIN Users v ON a.vet_id = v.user_id
            LEFT JOIN Users u ON a.user_id = u.user_id
        `);
        return result.recordset;
    } catch (error) {
        throw error;
    }
};

module.exports = { 
    getAllAppointments, 
    createAppointment, 
    getAppointmentsByUserId 
};