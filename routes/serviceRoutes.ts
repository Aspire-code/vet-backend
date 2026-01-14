import express from 'express';
const router = express.Router();
const serviceController = require('../controllers/serviceController');

router.get('/', serviceController.getServices);
router.post('/', serviceController.createService);

export default router;
