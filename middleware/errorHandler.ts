// middleware/errorHandler.ts
// Combined middleware for Vet Backend

import { Request, Response, NextFunction } from 'express';

// -------------------- Logger Middleware --------------------
const logger = (req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} | ${req.method} ${req.originalUrl}`);
    next();
};

// -------------------- Error Handler Middleware --------------------
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({ success: false, error: message });
};

// -------------------- Validation Middleware --------------------

// Users
const validateUser = (req: Request, res: Response, next: NextFunction) => {
    const { user_id, name, email, password_hash, role } = req.body;
    if (!user_id || !name || !email || !password_hash || !role) {
        return res.status(400).json({ message: 'Missing required user fields' });
    }
    if (!['vet', 'client'].includes(role)) {
        return res.status(400).json({ message: 'Role must be either "vet" or "client"' });
    }
    next();
};

// VetProfiles
const validateVetProfile = (req: Request, res: Response, next: NextFunction) => {
    const { vet_id, clinic_name, address, city, state, zip_code } = req.body;
    if (!vet_id || !clinic_name || !address || !city || !state || !zip_code) {
        return res.status(400).json({ message: 'Missing required vet profile fields' });
    }
    next();
};

// Services
const validateService = (req: Request, res: Response, next: NextFunction) => {
    const { service_id, name } = req.body;
    if (!service_id || !name) {
        return res.status(400).json({ message: 'Missing required service fields' });
    }
    next();
};

// VetServices
const validateVetService = (req: Request, res: Response, next: NextFunction) => {
    const { vet_id, service_id } = req.body;
    if (!vet_id || !service_id) {
        return res.status(400).json({ message: 'vet_id and service_id are required' });
    }
    next();
};

// Reviews
const validateReview = (req: Request, res: Response, next: NextFunction) => {
    const { review_id, vet_id, client_id, rating } = req.body;
    if (!review_id || !vet_id || !client_id || rating === undefined) {
        return res.status(400).json({ message: 'Missing required review fields' });
    }
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    next();
};

// Appointments
const validateAppointment = (req: Request, res: Response, next: NextFunction) => {
    const { appointment_id, vet_id, client_id, service_id, scheduled_time, status } = req.body;
    if (!appointment_id || !vet_id || !client_id || !service_id || !scheduled_time) {
        return res.status(400).json({ message: 'Missing required appointment fields' });
    }
    const validStatuses = ['pending', 'confirmed', 'completed', 'canceled'];
    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(', ')}` });
    }
    next();
};

// -------------------- Export All Middleware --------------------
export {
    logger,
    errorHandler,
    validateUser,
    validateVetProfile,
    validateService,
    validateVetService,
    validateReview,
    validateAppointment
};
