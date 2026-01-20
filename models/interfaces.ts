// src/models/interfaces.ts

// Global Types
export enum UserRole {
    VET = 'vet',
    CLIENT = 'client'
}

// ----------------------------------------------------------------------
// USER INTERFACES (Used for authentication and user data transfer)
// ----------------------------------------------------------------------

// The data shape of a User (for transfer, excluding hash)
export interface IUser {
    user_id: string;
    email: string;
    name: string;
    role: UserRole;
    phone?: string | null; // Optional phone number
}

// User data retrieved from the DB (includes the password hash)
export interface IUserDB extends IUser {
    password_hash: string;
}

// Data structure stored inside the JWT token payload
export interface IUserTokenPayload {
    id: string; // user_id
    email: string;
    role: UserRole;
    iat: number; // issued at
    exp: number; // expiration time
}

// ----------------------------------------------------------------------
// VET PROFILE INTERFACES (Used for profile management and search)
// ----------------------------------------------------------------------

// The data shape for a Vet Profile stored in the database
export interface IVetProfile {
    vet_id: string; // Foreign key linking to Users table
    bio: string;
    clinic_name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    latitude: number; 
    longitude: number;
    profile_pic_url?: string;
}

// Interface for client search parameters passed to the model
export interface ISearchParams {
    clientLat: number;
    clientLon: number;
    maxDistance: number;
    serviceName?: string;
    specialization?: string;
}

// ----------------------------------------------------------------------
// APPOINTMENT INTERFACES (Used for appointment management)
// ----------------------------------------------------------------------

export interface IAppointment {
    appointment_id: string;
    vet_id: string;
    client_id: string;
    service_id: string;
    scheduled_time: Date;
    status: string;
}

// Interface for search results (extends profile data with calculated fields)
export interface ISearchResult extends IVetProfile {
    distance_km: number;
    avg_rating: number;
}