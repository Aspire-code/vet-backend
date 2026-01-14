import express from "express";
const router = express.Router();
const userController = require("../controllers/userController");

// 🔑 Authentication Route
// This route will now return a token valid for 24 hours
router.post("/login", userController.login);

// 👤 Logged-in user routes
router.get("/me", userController.getMyProfile);
router.put("/me", userController.updateMyProfile);
router.delete("/me", userController.deleteMyAccount);

// 👥 General routes
router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);
router.post("/", userController.createUser);

export default router;