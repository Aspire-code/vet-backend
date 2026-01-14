const Review = require('../models/reviewModel');

const getReviews = async (req: any, res: { json: (arg0: any) => void; status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: any; }): void; new(): any; }; }; }) => {
    try {
        const reviews = await Review.getAllReviews();
        res.json(reviews);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        res.status(500).json({ message: errorMessage });
    }
};

const createReview = async (req: { body: any; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: any; }): void; new(): any; }; }; }) => {
    try {
        await Review.createReview(req.body);
        res.status(201).json({ message: 'Review created successfully' });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        res.status(500).json({ message: errorMessage });
    }
};

module.exports = { getReviews, createReview };
