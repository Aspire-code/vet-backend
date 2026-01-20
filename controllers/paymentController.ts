import { Request, Response } from 'express';
import * as paymentModel from '../models/paymentModel';

export const processDeposit = async (req: Request, res: Response) => {
    const { 
        client_id, 
        vet_id, 
        amount, 
        appointment_time 
    } = req.body;

    if (!client_id || !vet_id || !appointment_time) {
        return res.status(400).json({ message: "Missing required booking details." });
    }

    try {
    
        const transactionResult = {
            transaction_id: `TXN-${Date.now()}-${vet_id.substring(0, 4)}`,
            status: 'completed',
            message: 'Deposit processed successfully and booking is confirmed.'
        };

        const appointmentData = {
            client_id, 
            vet_id, 
            scheduled_time: new Date(appointment_time), 
            service_id: 'S1', 
            status: 'confirmed'
        };

        await paymentModel.createAppointmentAndRecordPayment(appointmentData);
        res.status(200).json(transactionResult);

    } catch (error) {
        console.error("Error processing deposit:", error);
        res.status(500).json({ message: "Failed to process payment and book appointment.", error: error });
    }
};