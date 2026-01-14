const Service = require('../models/serviceModel');

const getServices = async (req: any, res: { json: (arg0: any) => void; status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: any; }): void; new(): any; }; }; }) => {
    try {
        const services = await Service.getAllServices();
        res.json(services);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred';
        res.status(500).json({ message });
    }
};

const createService = async (req: { body: any; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: any; }): void; new(): any; }; }; }) => {
    try {
        await Service.createService(req.body);
        res.status(201).json({ message: 'Service created successfully' });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred';
        res.status(500).json({ message });
    }
};

module.exports = { getServices, createService };
