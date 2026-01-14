import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

import {
  getUserByEmail,
  createUser,
  createInitialVetProfile,
} from "../models/userModel";

import { UserRole } from "../models/interfaces";

/**
 * POST /api/auth/register
 */
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await createUser({
      user_id: userId,
      name,
      email,
      passwordHash,
      role,
      phone,
    });

    if (role === UserRole.VET) {
      await createInitialVetProfile(userId);
    }

    return res.status(201).json({ message: "User registered successfully" });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/auth/login
 */
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.json({
      message: "Login successful",
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Login failed" });
  }
};
