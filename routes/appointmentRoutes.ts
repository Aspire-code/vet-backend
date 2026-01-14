import express from 'express';
const router = express.Router();

import appointmentController from '../controllers/appointmentController';
import { auth } from '../middleware/auth'; 
console.log("Controller Check:", typeof appointmentController.getMyAppointments);
console.log("Middleware Check:", typeof auth);
router.get('/my', auth, appointmentController.getMyAppointments);
router.post('/', auth, appointmentController.createAppointment);
router.get('/', auth, appointmentController.getAppointments);

export default router;