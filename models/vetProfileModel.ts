import { sql, poolPromise } from '../config/db';
import { ISearchResult, IVetProfile } from './interfaces'; 
import * as crypto from 'crypto'; 

// --- REUSABLE SERVICE SYNCHRONIZATION FUNCTION ---
export const syncVetServices = async (vet_id: string, serviceNames: string[], transaction: sql.Transaction): Promise<void> => {
    await transaction.request()
        .input('vet_id', sql.VarChar(100), vet_id)
        .query(`DELETE FROM VetServices WHERE vet_id = @vet_id;`);

    for (const serviceName of serviceNames) {
        let serviceId: string;
        
        const findResult = await transaction.request()
            .input('service_name', sql.VarChar(100), serviceName)
            .query(`SELECT service_id FROM Services WHERE name = @service_name;`);

        if (findResult.recordset.length > 0) {
            serviceId = findResult.recordset[0].service_id;
        } else {
            serviceId = crypto.randomUUID();
            await transaction.request()
                .input('new_service_id', sql.VarChar(100), serviceId)
                .input('service_name', sql.VarChar(100), serviceName)
                .query(`
                    INSERT INTO Services (service_id, name, description)
                    VALUES (@new_service_id, @service_name, 'Service provided by a vet');
                `);
        }

        await transaction.request()
            .input('vet_id', sql.VarChar(100), vet_id)
            .input('service_id_to_link', sql.VarChar(100), serviceId)
            .query(`
                INSERT INTO VetServices (vet_id, service_id)
                VALUES (@vet_id, @service_id_to_link);
            `);
    }
};

// --- GET ALL PROFILES (Updated with JSON aggregation for Services) ---
export const getAllVetProfiles = async (): Promise<any[]> => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
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
        `);

        // Parse JSON strings from SQL Server
        return result.recordset.map(row => ({
            ...row,
            services: row.services ? JSON.parse(row.services) : []
        }));
    } catch (error) {
        console.error("Error retrieving all vet profiles:", error);
        throw new Error("Failed to load vet profiles.");
    }
};

// --- GET PROFILE BY ID (Updated with JSON aggregation) ---
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
        console.error("Error retrieving vet profile by ID:", error);
        throw new Error("Database error during profile retrieval.");
    }
};

// --- CREATE PROFILE (Syncs services correctly) ---
export const createVetProfile = async (vetProfile: any): Promise<void> => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    const { user_id: vet_id, services = [] } = vetProfile;

    try {
        await transaction.begin();
        const request = transaction.request();

        await request
            .input('vet_id', sql.VarChar(100), vet_id)
            .input('bio', sql.Text, vetProfile.bio)
            .input('clinic_name', sql.VarChar(100), vetProfile.clinic_name)
            .input('address', sql.VarChar(255), vetProfile.address)
            .input('city', sql.VarChar(50), vetProfile.city)
            .input('state', sql.VarChar(50), vetProfile.state)
            .input('zip_code', sql.VarChar(20), vetProfile.zip_code)
            .input('latitude', sql.Decimal(9, 6), vetProfile.latitude)
            .input('longitude', sql.Decimal(9, 6), vetProfile.longitude)
            .input('profile_pic_url', sql.VarChar(255), vetProfile.profile_pic_url)
            .query(`
                INSERT INTO VetProfiles 
                    (vet_id, bio, clinic_name, address, city, state, zip_code, latitude, longitude, profile_pic_url)
                VALUES 
                    (@vet_id, @bio, @clinic_name, @address, @city, @state, @zip_code, @latitude, @longitude, @profile_pic_url);
            `);

        if (services.length > 0) {
            await syncVetServices(vet_id, services, transaction);
        }
        await transaction.commit();
    } catch (error) {
        await transaction.rollback(); 
        throw error;
    }
};

// --- UPDATE PROFILE (Syncs services correctly) ---
export const updateVetProfile = async (vet_id: string, vetProfile: any): Promise<void> => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    const { services = [] } = vetProfile;

    try {
        await transaction.begin();
        const request = transaction.request();
        
        await request
            .input('vet_id', sql.VarChar(100), vet_id)
            .input('bio', sql.Text, vetProfile.bio)
            .input('clinic_name', sql.VarChar(100), vetProfile.clinic_name)
            .input('address', sql.VarChar(255), vetProfile.address)
            .input('city', sql.VarChar(50), vetProfile.city)
            .input('state', sql.VarChar(50), vetProfile.state)
            .input('zip_code', sql.VarChar(20), vetProfile.zip_code)
            .input('latitude', sql.Decimal(9, 6), vetProfile.latitude)
            .input('longitude', sql.Decimal(9, 6), vetProfile.longitude)
            .input('profile_pic_url', sql.VarChar(255), vetProfile.profile_pic_url)
            .query(`
                UPDATE VetProfiles SET
                    bio = @bio, clinic_name = @clinic_name, address = @address,
                    city = @city, state = @state, zip_code = @zip_code,
                    latitude = @latitude, longitude = @longitude, profile_pic_url = @profile_pic_url
                WHERE vet_id = @vet_id;
            `);

        if (services && Array.isArray(services)) {
            await syncVetServices(vet_id, services, transaction);
        }
        await transaction.commit();
    } catch (error) {
        await transaction.rollback(); 
        throw error;
    }
};