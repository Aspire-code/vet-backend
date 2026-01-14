// src/routes/authRoutes.ts

import express, { Router } from "express"; // Import Router from express
// Use named import to pull the specific functions
import { registerUser, loginUser } from "../controllers/authController"; 

const router: Router = express.Router(); // Explicitly type router

// POST /api/auth/register
// The imported function is named registerUser, not register
router.post("/register", registerUser); 

// POST /api/auth/login
// The imported function is named loginUser, not login
router.post("/login", loginUser);

export default router;