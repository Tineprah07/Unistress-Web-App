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
// Backend/controllers/authController.js

export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await findUserByEmail(email);

    // Specific check for point #1: "email doesnt exist"
    if (!user) {
      return res.status(404).json({ error: "Email doesn't exist" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    // Specific check for point #2: "incorrect password"
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
  req.session.destroy((err) => {
    if (err) {
      console.error("Error in logoutUser:", err);
      return res.status(500).json({ error: "Could not log out." });
    }

    // Optionally clear cookie on client later
    return res.json({ message: "Logged out successfully." });
  });
}

// -------------------------
// Get current logged-in user
// -------------------------
export async function getCurrentUser(req, res) {
  if (!req.session.user) {
    return res.status(401).json({ user: null, error: "Not logged in." });
  }

  // If you ever want to fetch fresh data from DB:
  // const userFromDb = await findUserById(req.session.user.id);

  return res.json({
    user: req.session.user,
  });
}
