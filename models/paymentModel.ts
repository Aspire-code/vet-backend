import sql from 'mssql';

// Updated interface to match your ACTUAL database columns
interface AppointmentRecord {
    client_id: string;
    vet_id: string;
    scheduled_time: Date; // Renamed from appointment_time to match DB
    status: string;
    service_id?: string;  // Included since it exists in your table
}

export const createAppointmentAndRecordPayment = async (data: AppointmentRecord) => {
    // Note: Using the pool/global connection method you provided
    if (!global.db) {
        throw new Error("Database connection not established.");
    }

    const request = global.db.request();

    // 1. Generate a unique ID (Matching your VARCHAR format)
    const appointment_id = `A-${Date.now()}`;

    // 2. Map inputs ONLY to existing columns shown in your SSMS screenshot
    request.input('appointment_id', sql.VarChar(100), appointment_id);
    request.input('client_id', sql.VarChar(100), data.client_id);
    request.input('vet_id', sql.VarChar(100), data.vet_id);
    request.input('scheduled_time', sql.DateTime, data.scheduled_time); // Correct DB name
    request.input('status', sql.VarChar(20), data.status);
    request.input('service_id', sql.VarChar(100), data.service_id || 'S1'); // Defaulting to S1

    // 3. Updated SQL query containing ONLY valid columns
    const query = `
        INSERT INTO Appointments (
            appointment_id, 
            client_id, 
            vet_id, 
            scheduled_time, 
            status,
            service_id
        )
        VALUES (
            @appointment_id, 
            @client_id, 
            @vet_id, 
            @scheduled_time, 
            @status,
            @service_id
        );
    `;

    try {
        await request.query(query);
        console.log(`Appointment ${appointment_id} created successfully.`);
    } catch (error) {
        console.error("Database Error:", error);
        throw error;
    }
};