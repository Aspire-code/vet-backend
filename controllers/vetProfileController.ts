import * as VetProfile from '../models/vetProfileModel';
import { Request, Response } from 'express';

/**
 * Fetch all vet profiles (Client Dashboard)
 * The model now returns an array where services are already nested objects.
 */
const getVetProfiles = async (req: Request, res: Response): Promise<void> => {
    try {
        const vets = await VetProfile.getAllVetProfiles();
        // The aggregation is now handled in the model via JSON.parse
        res.json(vets);
    } catch (err) {
        console.error("Error in getVetProfiles:", err);
        res.status(500).json({ message: (err as Error).message });
    }
};

/**
 * Fetch a single vet profile (Vet Dashboard / Admin)
 * The model now returns a single clean object with a services array.
 */
const getVetProfileById = async (req: Request, res: Response): Promise<void> => {
    try {
        const vet = await VetProfile.getVetProfileById(req.params.id);

        if (!vet) {
            res.status(404).json({ message: 'Vet profile not found' });
            return;
        }

        res.json(vet);
    } catch (err) {
        console.error("Error in getVetProfileById:", err);
        res.status(500).json({ message: (err as Error).message });
    }
};

/**
 * Create a new vet profile
 */
const createVetProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        // req.body should contain { user_id, bio, services: ["Service Name"], ... }
        await VetProfile.createVetProfile(req.body);
        res.status(201).json({ message: 'Vet profile created successfully' });
    } catch (err) {
        console.error("Error in createVetProfile:", err);
        res.status(500).json({ message: (err as Error).message });
    }
};

/**
 * Update vet profile and services
 */
const updateVetProfile = async (req: Request, res: Response): Promise<void> => {
    const vet_id = req.params.id;

    if (!vet_id) {
        res.status(400).json({ message: 'Vet ID is required.' });
        return;
    }
    
    try {
        // The model expects an object containing both profile fields and the services array
        // req.body should look like: { bio: "...", services: ["Vaccination", "Checkup"], ... }
        await VetProfile.updateVetProfile(vet_id, req.body);
        
        res.status(200).json({ message: 'Vet profile and services updated successfully' });

    } catch (err) {
        console.error("Error in updateVetProfile:", err);
        res.status(500).json({ 
            message: 'Failed to update vet profile and services.',
            detail: (err as Error).message
        });
    }
};

export { getVetProfiles, getVetProfileById, createVetProfile, updateVetProfile };