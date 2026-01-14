const { sql, poolPromise } = require('../config/db');
import crypto from 'crypto';

interface Service {
    service_id: string;
    name: string;
    description?: string;
}

/* -----------------------------
   Fetch all services
----------------------------- */
const getAllServices = async (): Promise<any[]> => {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Services');
    return result.recordset;
};

/* -----------------------------
   Create a service
----------------------------- */
const createService = async (service: Service): Promise<void> => {
    const pool = await poolPromise;
    const { service_id, name, description } = service;
    await pool.request()
        .input('service_id', sql.VarChar(100), service_id)
        .input('name', sql.VarChar(100), name)
        .input('description', sql.Text, description || null)
        .query(`INSERT INTO Services (service_id, name, description) VALUES (@service_id, @name, @description)`);
};

/* -----------------------------
   Replace services for a vet
   (Delete old services + add new)
----------------------------- */
const replaceVetServices = async (vetId: string, services: string[]): Promise<void> => {
    const pool = await poolPromise;

    // Delete old services for this vet
    await pool.request()
        .input('vetId', sql.VarChar(100), vetId)
        .query('DELETE FROM VetServices WHERE vet_id = @vetId');

    // Insert new services
    for (const name of services) {
        // Check if service exists
        const existing = await pool.request()
            .input('name', sql.VarChar(100), name)
            .query('SELECT service_id FROM Services WHERE name = @name');

        let serviceId: string;
        if (existing.recordset.length) {
            serviceId = existing.recordset[0].service_id;
        } else {
            serviceId = crypto.randomUUID();
            await createService({ service_id: serviceId, name });
        }

        // Link service to vet
        await pool.request()
            .input('vetId', sql.VarChar(100), vetId)
            .input('serviceId', sql.VarChar(100), serviceId)
            .query('INSERT INTO VetServices (vet_id, service_id) VALUES (@vetId, @serviceId)');
    }
};

/* -----------------------------
   Fetch all vets with services
----------------------------- */
const getAllVetsWithServices = async (): Promise<any[]> => {
    const pool = await poolPromise;

    const result = await pool.request().query(`
        SELECT 
            u.user_id,
            u.name,
            u.email,
            u.role,
            u.phone,
            vp.clinic_name,
            vp.address,
            vp.city,
            vp.state,
            STRING_AGG(s.name, ',') AS services
        FROM Users u
        LEFT JOIN VetProfiles vp ON vp.vet_id = u.user_id
        LEFT JOIN VetServices vs ON vs.vet_id = u.user_id
        LEFT JOIN Services s ON s.service_id = vs.service_id
        WHERE u.role = 'vet'
        GROUP BY u.user_id, u.name, u.email, u.role, u.phone, vp.clinic_name, vp.address, vp.city, vp.state
    `);

    // Convert services string to array
    return result.recordset.map((v: any) => ({
        ...v,
        services: v.services ? v.services.split(',') : []
    }));
};

module.exports = { 
    getAllServices, 
    createService, 
    replaceVetServices, 
    getAllVetsWithServices 
};
