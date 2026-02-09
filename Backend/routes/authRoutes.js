// -------------------------
// UniStress Auth Routes
// -------------------------
// Defines all the API endpoints for registration,
// login, logout, and fetching the current user.
// These routes call the auth controller.

import express from "express";
import passport from "passport";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  requestPasswordReset,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

// --- Google Auth Routes ---

// 1. Kick off the Google login flow
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// 2. The callback URL Google sends the user back to
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/views/auth.html" }),
  (req, res) => {
    // On success, redirect to the homepage or dashboard
    res.redirect("/views/homepage.html?login=success");
  }
);


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
