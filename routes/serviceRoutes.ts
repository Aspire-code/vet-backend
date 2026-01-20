import express from 'express';
const router = express.Router();
const serviceController = require('../controllers/serviceController');
router.get('/', serviceController.getServices);
router.post('/', serviceController.createService);
router.post('/sync', serviceController.syncVetServices);

export default router;