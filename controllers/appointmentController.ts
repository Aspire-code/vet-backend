import * as Appointment from "../models/appointmentModel";
import { Request, Response } from 'express';

// 1. Get appointments for a specific Vet (Dashboard)
export const getVetAppointments = async (req: any, res: any) => {
    try {
        const { vetId } = req.params;
        const appointments = await Appointment.getAppointmentsByVetId(vetId);
        // Returns 200 with an empty array if no data exists to keep dashboard clean
        res.json({ success: true, data: appointments || [] });
    } catch (err) {
        console.error("getVetAppointments error:", err);
        res.status(500).json({ message: "Error fetching vet appointments" });
    }
};

// 2. Get appointments for the logged-in client
export const getMyAppointments = async (req: any, res: any) => {
    try {
        // Robust ID extraction for both UUID and ShortID formats
        const userId = req.user?.id || req.user?.user_id || req.user?.sub;
        
        if (!userId) {
            return res.status(400).json({ message: "User ID not found in token" });
        }

        const appointments = await Appointment.getAppointmentsByUserId(userId);
        res.json({ success: true, data: appointments });
    } catch (err) {
        console.error("getMyAppointments error:", err);
        res.status(500).json({ message: "Error fetching appointments" });
    }
};

// 3. Create a new appointment
export const createAppointment = async (req: any, res: any) => {
    try {
        const userId = req.user?.id || req.user?.user_id || req.user?.sub;
        const { vet_id, service_id, scheduled_time } = req.body;

        if (!vet_id || !scheduled_time) {
            return res.status(400).json({ message: "Missing required booking fields" });
        }

        const appointmentData = {
            appointment_id: `A-${Date.now()}`,
            vet_id,
            client_id: userId,
            service_id: service_id || "S1",
            scheduled_time,
            status: "pending"
        };

        const newId = await Appointment.createAppointment(appointmentData);
        res.status(201).json({ success: true, appointment_id: newId });
    } catch (err) {
        console.error("createAppointment error:", err);
        res.status(500).json({ message: "Internal server error during booking" });
    }
};

// 4. Update status (Fixes crash in router.patch)
export const updateStatus = async (req: any, res: any) => {
    try {
        const { appointmentId } = req.params;
        const { status } = req.body;
        const success = await Appointment.updateAppointmentStatus(appointmentId, status);
        if (!success) return res.status(404).json({ message: "Appointment not found" });
        res.json({ success: true, message: `Status updated to ${status}` });
    } catch (err) {
        res.status(500).json({ message: "Error updating status" });
    }
};

// 5. Delete appointment (Fixes crash in router.delete)
export const deleteAppointment = async (req: any, res: any) => {
    try {
        const { appointmentId } = req.params;
        const success = await Appointment.deleteAppointmentById(appointmentId);
        if (!success) return res.status(404).json({ message: "Appointment not found" });
        res.json({ success: true, message: "Appointment deleted" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting appointment" });
    }
};

// CRITICAL: Ensure the keys here match exactly what your appointmentRoutes.ts calls
export default {
    getMyAppointments,
    getVetAppointments, 
    createAppointment,
    updateStatus,
    deleteAppointment
};