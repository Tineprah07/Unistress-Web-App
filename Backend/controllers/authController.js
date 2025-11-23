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
export async function registerUser(req, res) {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email and password are required." });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long." });
    }

    // Check if email already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "Email is already registered." });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user in the database
    const newUser = await createUser(name, email, passwordHash);

    // Save user in session (log them in)
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

    // Basic validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Compare password with stored hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Store minimal user info in the session
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
