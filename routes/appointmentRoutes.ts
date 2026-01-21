import express from 'express';
const router = express.Router();
import appointmentController from '../controllers/appointmentController';
import { auth } from '../middleware/auth'; 

// Fetch appointments for the logged-in client
router.get('/my-appointments', auth, appointmentController.getMyAppointments);

// Fetch appointments for a specific veterinarian dashboard
router.get('/vet/:vetId', auth, appointmentController.getVetAppointments);

// Create a new appointment booking
router.post('/', auth, appointmentController.createAppointment);

router.put('/:appointmentId/status', auth, appointmentController.updateStatus);

// Remove an appointment record
router.delete('/:appointmentId', auth, appointmentController.deleteAppointment);

export default router;