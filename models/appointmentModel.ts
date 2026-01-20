import { sql, poolPromise } from '../config/db';
import { IAppointment } from './interfaces';

/**
 * Fetches appointments for the Vet Dashboard.
 */
export const getAppointmentsByVetId = async (vet_id: string): Promise<any[]> => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('vet_id', sql.VarChar(100), vet_id)
            .query(`
                SELECT 
                    a.appointment_id, 
                    a.status, 
                    a.scheduled_time AS appointment_date, 
                    c.name AS client_name,
                    s.name AS service_name
                FROM Appointments a
                LEFT JOIN Users c ON a.client_id = c.user_id
                LEFT JOIN Services s ON a.service_id = s.service_id
                WHERE a.vet_id = @vet_id
                ORDER BY a.scheduled_time ASC
            `);
        return result.recordset;
    } catch (error) {
        console.error("Database Error in getAppointmentsByVetId:", error);
        throw error;
    }
};

/**
 * Create a new appointment.
 * FIXED: Added validation to prevent Foreign Key conflicts with VetProfiles.
 */
export const createAppointment = async (appointmentData: any): Promise<string> => {
    const { 
        vet_id, 
        client_id, 
        service_id, 
        scheduled_time, 
        status = 'pending' 
    } = appointmentData;

    // Ensure we have an appointment_id (generate one if frontend didn't)
    const appointment_id = appointmentData.appointment_id || `APP-${Date.now()}`;

    try {
        const pool = await poolPromise;
        
        // --- STEP 1: VALIDATION ---
        // Check if the vet_id exists in VetProfiles to avoid the FK constraint error
        const checkVet = await pool.request()
            .input('vet_id', sql.VarChar(100), vet_id)
            .query('SELECT vet_id FROM VetProfiles WHERE vet_id = @vet_id');

        if (checkVet.recordset.length === 0) {
            throw new Error(`Foreign Key Violation: Vet ID "${vet_id}" does not exist in VetProfiles.`);
        }

        // --- STEP 2: INSERTION ---
        const request = pool.request();
        const dateValue = new Date(scheduled_time);

        // Basic date validation
        if (isNaN(dateValue.getTime())) {
            throw new Error("Invalid scheduled_time format.");
        }

        request
            .input('appointment_id', sql.VarChar(100), appointment_id)
            .input('vet_id', sql.VarChar(100), vet_id)
            .input('client_id', sql.VarChar(100), client_id)
            .input('service_id', sql.VarChar(100), service_id || 'S1')
            .input('scheduled_time', sql.DateTime, dateValue)
            .input('status', sql.VarChar(20), status);

        await request.query(`
            INSERT INTO Appointments 
                (appointment_id, vet_id, client_id, service_id, scheduled_time, status)
            VALUES 
                (@appointment_id, @vet_id, @client_id, @service_id, @scheduled_time, @status)
        `);

        return appointment_id; 
    } catch (error) {
        console.error("Database Error in createAppointment:", error);
        throw error; 
    }
};

/**
 * Get appointments for a specific user (Client or Vet).
 */
export const getAppointmentsByUserId = async (user_id: string): Promise<any[]> => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('user_id', sql.VarChar(100), user_id)
            .query(`
                SELECT a.appointment_id, a.status, a.scheduled_time, 
                       s.name AS service_name, v.name AS vet_name, c.name AS client_name
                FROM Appointments a
                LEFT JOIN Users v ON a.vet_id = v.user_id
                LEFT JOIN Users c ON a.client_id = c.user_id
                LEFT JOIN Services s ON a.service_id = s.service_id
                WHERE a.client_id = @user_id OR a.vet_id = @user_id
                ORDER BY a.scheduled_time DESC
            `);
        return result.recordset;
    } catch (error) {
        console.error("Error retrieving user appointments:", error);
        throw error;
    }
};

/**
 * Updates the status of an appointment.
 */
export const updateAppointmentStatus = async (appointmentId: string, status: string): Promise<boolean> => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('appointment_id', sql.VarChar(100), appointmentId)
            .input('status', sql.VarChar(20), status)
            .query(`
                UPDATE Appointments 
                SET status = @status 
                WHERE appointment_id = @appointment_id
            `);
        
        return (result.rowsAffected[0] > 0);
    } catch (error) {
        console.error("Database Error in updateAppointmentStatus:", error);
        throw error;
    }
};

/**
 * Deletes an appointment from the database.
 */
export const deleteAppointmentById = async (appointmentId: string): Promise<boolean> => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('appointment_id', sql.VarChar(100), appointmentId)
            .query(`
                DELETE FROM Appointments 
                WHERE appointment_id = @appointment_id
            `);
        
        return (result.rowsAffected[0] > 0);
    } catch (error) {
        console.error("Database Error in deleteAppointmentById:", error);
        throw error;
    }
};