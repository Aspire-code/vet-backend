const Appointment = require("../models/appointmentModel");

/**
 * Get all appointments in the system (Admin view)
 */
export const getAppointments = async (req: any, res: any) => {
    try {
        const appointments = await Appointment.getAllAppointments();
        res.json({ success: true, data: appointments });
    } catch (err) {
        console.error("getAppointments error:", err);
        res.status(500).json({ message: "Error fetching appointments" });
    }
};

/**
 * Get appointments for the logged-in user
 */
export const getMyAppointments = async (req: any, res: any) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: No user found" });
        }

        // Extract the ID from the JWT payload
        const userId = req.user.user_id || req.user.id || req.user.sub;

        if (!userId) {
            return res.status(401).json({ message: "Invalid token payload: User ID missing" });
        }

        // ✅ Calls the updated model using the correct user_id
        const appointments = await Appointment.getAppointmentsByUserId(userId);
        
        res.json({ 
            success: true,
            data: appointments 
        });
    } catch (err) {
        console.error("getMyAppointments error:", err);
        res.status(500).json({ message: "Error fetching user appointments" });
    }
};

/**
 * Create a new appointment (Client only)
 */
export const createAppointment = async (req: any, res: any) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const userId = req.user.user_id || req.user.id;
        const { vet_id, service_id, scheduled_time } = req.body;

        if (!vet_id || !scheduled_time) {
            return res.status(400).json({ message: "Missing required booking details" });
        }

        // ✅ SYNC: Changed 'client_id' to 'user_id' to match the updated Model & Database
        const appointmentData = {
            vet_id: vet_id,
            user_id: userId, 
            service_id: service_id || "S1", 
            scheduled_time: scheduled_time, 
            status: "pending"
        };

        const newId = await Appointment.createAppointment(appointmentData);

        res.status(201).json({
            message: "Appointment created successfully",
            appointment_id: newId,
            data: appointmentData
        });
    } catch (err: any) {
        console.error("createAppointment error:", err);
        if (err.message?.includes('REFERENCE constraint')) {
            return res.status(400).json({ message: "Invalid Vet ID or User ID." });
        }
        res.status(500).json({ message: "Error saving appointment to database" });
    }
};

export default {
    getAppointments,
    getMyAppointments,
    createAppointment
};