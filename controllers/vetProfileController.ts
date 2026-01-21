import * as VetProfile from '../models/vetProfileModel';
import { Request, Response } from 'express';

/**
 * Fetch all vet profiles (Client Dashboard)
 */
const getVetProfiles = async (req: Request, res: Response): Promise<void> => {
    try {
        const vets = await VetProfile.getAllVetProfiles();
        res.json(vets);
    } catch (err) {
        console.error("Error in getVetProfiles:", err);
        res.status(500).json({ 
            message: 'Failed to fetch profiles.',
            error: (err as Error).message 
        });
    }
};

/**
 * Fetch a single vet profile (Vet Dashboard / Admin)
 */
const getVetProfileById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const vet = await VetProfile.getVetProfileById(id);

        if (!vet) {
            res.status(404).json({ message: `Vet profile with ID ${id} not found.` });
            return;
        }

        res.json(vet);
    } catch (err) {
        console.error(`Error in getVetProfileById for ID ${req.params.id}:`, err);
        res.status(500).json({ message: (err as Error).message });
    }
};

/**
 * Create a new vet profile
 */
const createVetProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log("POST /api/vetprofile - Incoming Body:", JSON.stringify(req.body, null, 2));
        
        // Basic validation check
        if (!req.body.user_id) {
            res.status(400).json({ message: "User ID is required to create a profile." });
            return;
        }

        await VetProfile.createVetProfile(req.body);
        res.status(201).json({ message: 'Vet profile created successfully' });
    } catch (err) {
        console.error("Error in createVetProfile:", err);
        res.status(500).json({ 
            message: 'Failed to create profile.',
            detail: (err as Error).message 
        });
    }
};

/**
 * Update vet profile and services
 * Added logging to debug 500 errors.
 */
const updateVetProfile = async (req: Request, res: Response): Promise<void> => {
    const vet_id = req.params.id;

    // 1. Log the attempt
    console.log(`PUT /api/vetprofile/${vet_id} - Update initiated.`);
    console.log("Payload:", JSON.stringify(req.body, null, 2));

    if (!vet_id) {
        res.status(400).json({ message: 'Vet ID is required.' });
        return;
    }
    
    try {
        // 2. Pass data to model
        await VetProfile.updateVetProfile(vet_id, req.body);
        
        console.log(`Successfully updated profile for Vet ID: ${vet_id}`);
        res.status(200).json({ message: 'Vet profile and services updated successfully' });

    } catch (err) {
        // 3. Log full error stack on server to catch DB errors
        console.error(`UPDATE ERROR for Vet ID ${vet_id}:`, err);
        
        res.status(500).json({ 
            message: 'Internal Server Error: Failed to update vet profile.',
            error: (err as Error).message,
            // Only send detail in development
            detail: process.env.NODE_ENV === 'development' ? (err as Error).stack : undefined
        });
    }
};

export { getVetProfiles, getVetProfileById, createVetProfile, updateVetProfile };