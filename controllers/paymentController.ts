// src/controllers/paymentController.ts

import { Request, Response } from 'express';
import * as paymentModel from '../models/paymentModel';

export const processDeposit = async (req: Request, res: Response) => {
    const { 
        client_id, 
        vet_id, 
        amount, 
        currency, // Currency is not used in the DB insert but useful for payment processor
        description, 
        client_phone,
        appointment_time 
    } = req.body;

    // 1. Basic Validation (Ensuring core fields from frontend are present)
    if (!client_id || !vet_id || !amount || !appointment_time || !client_phone) {
        return res.status(400).json({ message: "Missing required booking details." });
    }

    try {
        // 2. Process Payment Simulation (This is where a real payment gateway API call would go)
        // For now, we simulate a successful transaction result:
        const transactionResult = {
            transaction_id: `TXN-${Date.now()}-${vet_id.substring(0, 4)}`,
            status: 'completed', // Assuming the deposit was instantly successful
            message: 'Deposit processed successfully and booking is confirmed.'
        };

        // 3. Prepare Appointment Data for DB insertion
        const appointmentData = {
            client_id, 
            vet_id, 
            appointment_time: new Date(appointment_time), // Convert string to Date object
            deposit_amount: amount,
            description,
            transaction_id: transactionResult.transaction_id,
            client_phone: client_phone, // New field added to the model
            status: 'confirmed' // Set status to confirmed since deposit was paid
        };

        // 4. Record Appointment and Payment in DB
        await paymentModel.createAppointmentAndRecordPayment(appointmentData);

        // 5. Send Confirmation to Frontend
        res.status(200).json(transactionResult);

    } catch (error) {
        console.error("Error processing deposit:", error);
        // Handle specific errors (e.g., payment failure, DB error)
        res.status(500).json({ message: "Failed to process payment and book appointment.", error: error });
    }
};