// src/models/userModel.ts

import { sql, poolPromise } from '../config/db'; // Assuming '../config/db' exports sql and poolPromise
import { IUser, IUserDB, UserRole } from './interfaces';

/**
 * Retrieves a user by their unique email address.
 * Used for login authentication.
 */
export const getUserByEmail = async (email: string): Promise<IUserDB | undefined> => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('email', sql.VarChar(100), email)
            .query('SELECT user_id, name, email, password_hash, role, phone FROM Users WHERE email = @email');
        
        // SQL Server driver returns an array in recordset. We return the first element.
        return result.recordset[0] as IUserDB | undefined;
    } catch (error) {
        console.error("Error retrieving user by email:", error);
        throw new Error("Database error during user retrieval.");
    }
};

/**
 * Creates a new user entry in the Users table.
 * (This function assumes password hashing and ID generation are done in the controller/service layer)
 */
export const createUser = async (user: Omit<IUserDB, 'password_hash'> & { passwordHash: string }): Promise<void> => {
    try {
        const pool = await poolPromise;
        const { user_id, name, email, passwordHash, role, phone } = user;
        
        // Handle optional phone field for clients (insert NULL if undefined)
        const userPhone = phone || null; 

        await pool.request()
            .input('user_id', sql.VarChar(100), user_id)
            .input('name', sql.VarChar(100), name)
            .input('email', sql.VarChar(100), email)
            .input('password_hash', sql.VarChar(255), passwordHash)
            .input('role', sql.VarChar(10), role)
            .input('phone', sql.VarChar(20), userPhone)
            .query(`INSERT INTO Users (user_id, name, email, password_hash, role, phone)
                    VALUES (@user_id, @name, @email, @password_hash, @role, @phone)`);
        
    } catch (error: any) {
        console.error("Error creating user:", error);
        // Check for unique constraint violation (Error code for SQL Server might differ)
        if (error.message.includes('Violation of UNIQUE KEY constraint')) { 
            throw new Error("Email already registered.");
        }
        throw new Error("Failed to create user account.");
    }
};

/**
 * Creates an empty VetProfile after a successful 'vet' registration.
 */
export const createInitialVetProfile = async (vetId: string): Promise<void> => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('vet_id', sql.VarChar(100), vetId)
            .query(`INSERT INTO VetProfiles (vet_id, bio, clinic_name, address, city, state, zip_code, latitude, longitude)
                    VALUES (@vet_id, 'Please update your professional biography.', 'Unspecified Clinic', 'N/A', 'N/A', 'N/A', 'N/A', 0, 0)`);
    } catch (error) {
        console.error("Error creating initial vet profile:", error);
        throw new Error("Failed to create initial profile.");
    }
};