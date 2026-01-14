// src/models/paymentModel.ts

import sql from 'mssql';

interface AppointmentRecord {
    client_id: string;
    vet_id: string;
    appointment_time: Date;
    deposit_amount: number;
    description: string;
    transaction_id: string;
    client_phone: string; // New field
    status: string;
}

// Function to create an appointment and record the associated payment/deposit
export const createAppointmentAndRecordPayment = async (data: AppointmentRecord) => {
    if (!global.db) {
        throw new Error("Database connection not established.");
    }

    const request = global.db.request();

    // Input parameters matching the database schema and controller data
    request.input('client_id', sql.VarChar(100), data.client_id);
    request.input('vet_id', sql.VarChar(100), data.vet_id);
    request.input('appointment_time', sql.DateTime, data.appointment_time);
    request.input('deposit_amount', sql.Decimal(10, 2), data.deposit_amount);
    request.input('description', sql.Text, data.description);
    request.input('transaction_id', sql.VarChar(255), data.transaction_id);
    request.input('client_phone', sql.VarChar(20), data.client_phone); // Input for new field
    request.input('status', sql.VarChar(20), data.status);

    // Generate a unique ID for the new appointment
    const appointment_id = `A${Date.now()}`;
    request.input('appointment_id', sql.VarChar(100), appointment_id);

    // The SQL query inserts all required booking and payment fields.
    const query = `
        INSERT INTO Appointments (
            appointment_id, 
            client_id, 
            vet_id, 
            appointment_time, 
            deposit_amount, 
            description, 
            transaction_id,
            client_phone, 
            status,
            service_id -- service_id is NULLable now, so we omit it or set explicitly to NULL if no service is chosen
        )
        VALUES (
            @appointment_id, 
            @client_id, 
            @vet_id, 
            @appointment_time, 
            @deposit_amount, 
            @description, 
            @transaction_id,
            @client_phone, 
            @status,
            NULL 
        );
    `;

    await request.query(query);
    console.log(`Appointment created and payment recorded for transaction ID: ${data.transaction_id}`);
};