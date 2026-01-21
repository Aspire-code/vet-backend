import { sql, poolPromise } from '../config/db';
import { ISearchResult, IVetProfile } from './interfaces'; 
import * as crypto from 'crypto'; 

// --- REUSABLE SERVICE SYNCHRONIZATION FUNCTION ---
export const syncVetServices = async (vet_id: string, serviceNames: string[], transaction: sql.Transaction): Promise<void> => {
    // Delete existing links to refresh services
    await transaction.request()
        .input('vet_id', sql.VarChar(100), vet_id)
        .query(`DELETE FROM VetServices WHERE vet_id = @vet_id;`);

    if (!serviceNames || serviceNames.length === 0) return;

    for (const serviceName of serviceNames) {
        let serviceId: string;
        
        // 1. Check if service exists in global table
        const findResult = await transaction.request()
            .input('service_name', sql.VarChar(100), serviceName.trim())
            .query(`SELECT service_id FROM Services WHERE name = @service_name;`);

        if (findResult.recordset.length > 0) {
            serviceId = findResult.recordset[0].service_id;
        } else {
            // 2. Create service if it doesn't exist
            serviceId = crypto.randomUUID();
            await transaction.request()
                .input('new_service_id', sql.VarChar(100), serviceId)
                .input('service_name', sql.VarChar(100), serviceName.trim())
                .query(`
                    INSERT INTO Services (service_id, name, description)
                    VALUES (@new_service_id, @service_name, 'Service provided by a vet');
                `);
        }

        // 3. Link vet to service
        await transaction.request()
            .input('vet_id', sql.VarChar(100), vet_id)
            .input('service_id_to_link', sql.VarChar(100), serviceId)
            .query(`
                INSERT INTO VetServices (vet_id, service_id)
                VALUES (@vet_id, @service_id_to_link);
            `);
    }
};

// --- GET ALL PROFILES ---
export const getAllVetProfiles = async (filters?: { location?: string, service?: string }): Promise<any[]> => {
    try {
        const pool = await poolPromise;
        const request = pool.request();

        const locationTerm = filters?.location ? `%${filters.location}%` : '%';
        const serviceTerm = filters?.service ? `%${filters.service}%` : '%';

        request.input('location', sql.VarChar(100), locationTerm);
        request.input('serviceName', sql.VarChar(100), serviceTerm);

        const result = await request.query(`
            SELECT 
                u.user_id AS vet_id, u.name, u.email, u.phone,
                vp.bio, vp.clinic_name, vp.address, vp.city, vp.state, vp.zip_code, vp.latitude, vp.longitude, vp.profile_pic_url,
                ISNULL(r.avg_rating, 0) AS avg_rating,
                (
                    SELECT s.service_id, s.name 
                    FROM Services s
                    JOIN VetServices vs ON s.service_id = vs.service_id
                    WHERE vs.vet_id = u.user_id
                    FOR JSON PATH
                ) AS services
            FROM Users u
            LEFT JOIN VetProfiles vp ON u.user_id = vp.vet_id 
            LEFT JOIN (
                SELECT vet_id, AVG(CAST(rating AS FLOAT)) AS avg_rating
                FROM Reviews
                GROUP BY vet_id
            ) r ON r.vet_id = u.user_id
            WHERE u.role = 'vet'
            AND (vp.city LIKE @location OR vp.state LIKE @location OR vp.clinic_name LIKE @location)
            AND (
                EXISTS (
                    SELECT 1 FROM VetServices vs
                    JOIN Services s ON vs.service_id = s.service_id
                    WHERE vs.vet_id = u.user_id AND s.name LIKE @serviceName
                )
            )
        `);

        return result.recordset.map(row => ({
            ...row,
            services: row.services ? JSON.parse(row.services) : []
        }));
    } catch (error) {
        console.error("Error retrieving vet profiles:", error);
        throw error;
    }
};

// --- GET PROFILE BY ID ---
export const getVetProfileById = async (vet_id: string): Promise<any | undefined> => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('vet_id', sql.VarChar(100), vet_id)
            .query(`
                SELECT 
                    u.user_id AS vet_id, u.name, u.email, u.phone,
                    vp.bio, vp.clinic_name, vp.address, vp.city, vp.state, vp.zip_code, vp.latitude, vp.longitude, vp.profile_pic_url,
                    (
                        SELECT s.service_id, s.name 
                        FROM Services s
                        JOIN VetServices vs ON s.service_id = vs.service_id
                        WHERE vs.vet_id = u.user_id
                        FOR JSON PATH
                    ) AS services
                FROM Users u
                JOIN VetProfiles vp ON u.user_id = vp.vet_id
                WHERE u.user_id = @vet_id
            `);
        
        if (!result.recordset.length) return undefined;

        const profile = result.recordset[0];
        return {
            ...profile,
            services: profile.services ? JSON.parse(profile.services) : []
        };
    } catch (error) {
        throw error;
    }
};

// --- CREATE VET PROFILE ---
export const createVetProfile = async (data: any): Promise<void> => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 1. Insert Profile Info
        await transaction.request()
            .input('vet_id', sql.VarChar(100), data.user_id)
            .input('bio', sql.Text, data.bio || '')
            .input('clinic_name', sql.VarChar(255), data.clinic_name || '')
            .input('address', sql.VarChar(255), data.address || '')
            .input('city', sql.VarChar(100), data.city || '')
            .input('state', sql.VarChar(100), data.state || '')
            .input('zip_code', sql.VarChar(20), data.zip_code || '')
            .query(`
                INSERT INTO VetProfiles (vet_id, bio, clinic_name, address, city, state, zip_code)
                VALUES (@vet_id, @bio, @clinic_name, @address, @city, @state, @zip_code)
            `);

        // 2. Sync Services
        if (data.services) {
            await syncVetServices(data.user_id, data.services, transaction);
        }

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        console.error("Rollback in createVetProfile:", error);
        throw error;
    }
};

// --- UPDATE VET PROFILE ---
export const updateVetProfile = async (vet_id: string, data: any): Promise<void> => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 1. Update Profile Fields
        await transaction.request()
            .input('vet_id', sql.VarChar(100), vet_id)
            .input('bio', sql.Text, data.bio || '')
            .input('clinic_name', sql.VarChar(255), data.clinic_name || '')
            .input('address', sql.VarChar(255), data.address || '')
            .input('city', sql.VarChar(100), data.city || '')
            .input('state', sql.VarChar(100), data.state || '')
            .input('zip_code', sql.VarChar(20), data.zip_code || '')
            .query(`
                UPDATE VetProfiles 
                SET bio = @bio, 
                    clinic_name = @clinic_name, 
                    address = @address, 
                    city = @city, 
                    state = @state, 
                    zip_code = @zip_code
                WHERE vet_id = @vet_id
            `);

        // 2. Refresh Services
        if (data.services) {
            // Handle both string arrays and comma-separated strings if bio contained them
            const servicesToSync = Array.isArray(data.services) 
                ? data.services 
                : data.services.split(',').map((s: string) => s.trim());
                
            await syncVetServices(vet_id, servicesToSync, transaction);
        }

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        console.error("Rollback in updateVetProfile:", error);
        throw error;
    }
};