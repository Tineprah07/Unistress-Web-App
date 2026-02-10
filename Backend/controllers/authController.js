// -------------------------
// UniStress Auth Controller
// -------------------------
// Handles registration, login, logout and returning
// the current logged-in user. Uses the user model
// for database access and sessions for auth state.

import bcrypt from "bcrypt";
import {
  createUser,
  findUserByEmail,
  findUserById,
} from "../models/userModel.js";

import crypto from "crypto";
import pool from "../db/pool.js";
import {
  createResetToken,
  findValidResetToken,
  markTokenUsed,
  invalidateActiveTokensForUser,
} from "../models/passwordResetModel.js";


// -------------------------
// Register new user
// -------------------------
// Backend/controllers/authController.js

export async function registerUser(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Updated to 8 characters as per your modern app requirement
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long." });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      // Specific message for your banner: "account already exist"
      return res.status(409).json({ error: "This email is already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await createUser(name, email, passwordHash);

    req.session.user = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
    };

    return res.status(201).json({
      message: "User registered successfully.",
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error in registerUser:", error);
    return res.status(500).json({ error: "Something went wrong." });
  }
}

// -------------------------
// Login user
// -------------------------
export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(404).json({ error: "Email doesn't exist" });
    }

    // Check if the user has a password. Google users will have a null password_hash.
    if (!user.password_hash) {
      return res.status(409).json({
        error: "This account was created using Google. To sign in with email and password, create a password using ‘Forgot password?’, or continue with Google.",
        next: "SET_PASSWORD"
      });
    }

    // --- CRITICAL FIX END ---

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    return res.json({
      message: "Login successful.",
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error in loginUser:", error);
    return res.status(500).json({ error: "Something went wrong." });
  }
}

// -------------------------
// Logout user
// -------------------------
export function logoutUser(req, res) {
  // 1. Passport Logout
  if (req.logout) {
    req.logout((err) => {
      if (err) console.error("Passport logout error:", err);
    });
  }

  // 2. Manual Session Logout
  req.session.destroy((err) => {
    if (err) {
      console.error("Error in logoutUser session destroy:", err);
      return res.status(500).json({ error: "Could not log out." });
    }
    res.clearCookie("connect.sid"); // Recommended: Clear the session cookie
    return res.json({ message: "Logged out successfully." });
  });
}

// -------------------------
// Get current logged-in user
// -------------------------
export async function getCurrentUser(req, res) {
  // Passport puts user in req.user; manual login uses req.session.user
  const user = req.user || req.session.user;

  if (!user) {
    return res.status(401).json({ user: null, error: "Not logged in." });
  }

  // To keep the frontend consistent, return a standard object
  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
}

// -------------------------
// Forgot password (Request reset link)
// POST /api/auth/forgot
// -------------------------
export async function requestPasswordReset(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const user = await findUserByEmail(email);

    // Always return a generic success message (prevents email enumeration)
    if (!user) {
      return res.json({ message: "If the email exists, a reset link will be sent." });
    }

    // Ensure we don't violate your "one active token per user" index
    await invalidateActiveTokensForUser(user.id);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes

    await createResetToken(user.id, tokenHash, expiresAt);

    // For now: return token in development so you can test without email
    return res.json({
      message: "If the email exists, a reset link will be sent.",
      devToken: process.env.NODE_ENV !== "production" ? rawToken : undefined,
      expiresAt,
    });
  } catch (error) {
    console.error("Error in requestPasswordReset:", error);
    return res.status(500).json({ error: "Something went wrong." });
  }
}

// -------------------------
// Reset password
// POST /api/auth/reset
// -------------------------
export async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long." });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const record = await findValidResetToken(tokenHash); 

    if (!record) return res.status(400).json({ error: "Invalid or expired token." });
    if (record.used) return res.status(400).json({ error: "This reset link has already been used." });
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: "Reset link expired." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Transaction: update password + mark token used
    await pool.query("BEGIN");
    await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2;`, [
      passwordHash,
      record.user_id,
    ]);
    await markTokenUsed(record.id);
    await pool.query("COMMIT");

    return res.json({ message: "Password reset successful." });
  } catch (error) {
    await pool.query("ROLLBACK").catch(() => {});
    console.error("Error in resetPassword:", error);
    return res.status(500).json({ error: "Something went wrong." });
  }
}
