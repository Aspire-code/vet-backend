import express from 'express';
const router = express.Router();
import appointmentController from '../controllers/appointmentController';
import { auth } from '../middleware/auth'; 

// Fix: Use getMyAppointments for the client view
router.get('/my-appointments', auth, appointmentController.getMyAppointments);

// Fix: Use getVetAppointments for the vet view (Resolves your 404/Undefined error)
router.get('/vet/:vetId', auth, appointmentController.getVetAppointments);

// Rest of your routes...
router.post('/', auth, appointmentController.createAppointment);
router.patch('/:appointmentId', auth, appointmentController.updateStatus);
router.delete('/:appointmentId', auth, appointmentController.deleteAppointment);

export default router;