import express from 'express';
const router = express.Router();
import * as paymentController from '../controllers/paymentController';
router.post('/deposit', paymentController.processDeposit);

export default router;