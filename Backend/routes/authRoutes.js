// -------------------------
// UniStress Auth Routes
// -------------------------
// Defines all the API endpoints for registration,
// login, logout, and fetching the current user.
// These routes call the auth controller.

import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  requestPasswordReset,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Logout
router.post("/logout", logoutUser);

// Get current logged-in user
router.get("/me", getCurrentUser);

// Forgot + reset
router.post("/forgot", requestPasswordReset);
router.post("/reset", resetPassword);

export default router;
