import express from 'express';
const router = express.Router();
const reviewController = require('../controllers/reviewController');

router.get('/', reviewController.getReviews);
router.post('/', reviewController.createReview);

export default router;
