const Service = require('../models/serviceModel');

/**
 * GET ALL SERVICES
 * Used for populating dropdowns or lists of available services.
 */
const getServices = async (req: any, res: any) => {
    try {
        const services = await Service.getAllServices();
        res.json(services);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred';
        res.status(500).json({ message });
    }
};

/**
 * CREATE SERVICE (System Level)
 * Adds a new master service to the 'Services' table.
 */
const createService = async (req: any, res: any) => {
    try {
        await Service.createService(req.body);
        res.status(201).json({ message: 'Service created successfully' });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred';
        res.status(500).json({ message });
    }
};

/**
 * SYNC VET SERVICES
 * This is the crucial part! It takes the [ "Vaccination", "Grooming" ] array 
 * from the Vet Dashboard and links them to the specific vet.
 */
const syncVetServices = async (req: any, res: any) => {
    try {
        const { vet_id, services } = req.body; 

        if (!vet_id || !Array.isArray(services)) {
            return res.status(400).json({ message: "vet_id and services array are required." });
        }

        // We call a sync method in the model that handles deleting old links
        // and inserting new ones based on the names provided.
        await Service.syncVetServices(vet_id, services);

        res.status(200).json({ 
            message: 'Vet profile services updated successfully. They will now appear on the client dashboard.' 
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to sync services';
        res.status(500).json({ message });
    }
};

module.exports = { getServices, createService, syncVetServices };