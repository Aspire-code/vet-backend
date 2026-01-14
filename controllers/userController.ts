const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

/**
 * POST /api/auth/login
 * Fixed with 24h expiration to prevent 401 Unauthorized loops
 */
const login = async (req: { body: { email: any; password: any; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: string; }): void; new(): any; }; }; json: (arg0: { message: string; token: any; user: { user_id: any; name: any; role: any; }; }) => void; }) => {
  try {
    const { email, password } = req.body;
    const user = await User.getUserByEmail(email);
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const payload = { user_id: user.user_id, role: user.role };

    // ✅ EXTENDED SESSION: Valid for 24 hours
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: "Login successful",
      token,
      user: { user_id: user.user_id, name: user.name, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error during login" });
  }
};

/**
 * GET /api/users/me
 */
const getMyProfile = async (req: { user: { user_id: any; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: string; }): void; new(): any; }; }; json: (arg0: any) => void; }) => {
  try {
    const userId = req.user?.user_id; 
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.getUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile" });
  }
};

// --- RESTORED MISSING FUNCTIONS TO PREVENT TYPEERROR ---

const updateMyProfile = async (req: { user: { user_id: any; }; body: { name: any; phone: any; }; }, res: { json: (arg0: { message: string; }) => void; status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: string; }): void; new(): any; }; }; }) => {
  try {
    const userId = req.user?.user_id;
    const { name, phone } = req.body;
    await User.updateUser(userId, { name, phone });
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error updating profile" });
  }
};

const deleteMyAccount = async (req: { user: { user_id: any; }; }, res: { json: (arg0: { message: string; }) => void; status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: string; }): void; new(): any; }; }; }) => {
  try {
    const userId = req.user?.user_id;
    await User.deleteUser(userId);
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting account" });
  }
};

const getUsers = async (_req: any, res: { json: (arg0: any) => void; status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: string; }): void; new(): any; }; }; }) => {
  try {
    const users = await User.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

const getUserById = async (req: { params: { id: any; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: string; }): void; new(): any; }; }; json: (arg0: any) => void; }) => {
  try {
    const user = await User.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user" });
  }
};

const createUser = async (req: { body: any; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: string; }): void; new(): any; }; }; }) => {
  try {
    await User.createUser(req.body);
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error creating user" });
  }
};

// ✅ ALL FUNCTIONS MUST BE EXPORTED
module.exports = {
  login,
  getMyProfile,
  updateMyProfile,
  deleteMyAccount,
  getUsers,
  getUserById,
  createUser,
};