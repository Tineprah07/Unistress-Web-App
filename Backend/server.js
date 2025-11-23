// -------------------------
// UniStress Backend Server
// -------------------------
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import dotenv from "dotenv";
import cors from "cors";
import pool, { testDbConnection } from "./db/pool.js";

// Load environment variables
dotenv.config();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// -------------------------
// Core Middleware
// -------------------------
// Enable CORS (allows frontend to call backend API safely)
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Parse form data
app.use(express.urlencoded({ extended: true }));

// Session handling
app.use(
  session({
    secret: process.env.SESSION_SECRET || "change_this_secret",
    resave: false,
    saveUninitialized: false,
  })
);

// Make logged-in user available everywhere if needed
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// -------------------------
// Static Frontend
// -------------------------
// Path to frontend public folder
const publicPath = path.join(__dirname, "../src/public");

// Serve static files
app.use(express.static(publicPath));

// Landing page (shows index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// -------------------------
// API Routes
// -------------------------
// Test route to confirm backend is running
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "UniStress backend is live" });
});

// Test route to confirm database connection
app.get("/api/db-test", async (req, res) => {
  try {
    const nowRow = await testDbConnection();
    res.json({
      status: "ok",
      message: "Database connection successful",
      server_time: nowRow.now,
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
    });
  }
});


// -------------------------
// Start Server
// -------------------------
// app.listen(PORT, () => {
//   console.log(`UniStress running at http://localhost:${PORT}`);
// });

app.listen(PORT, () => {
  console.log(`---------------------------------------------------`);
  console.log(` UniStress Backend Running`);
  console.log(`---------------------------------------------------`);
  console.log(` Server:   http://localhost:${PORT}`);
  console.log(` Health:   http://localhost:${PORT}/api/health`);
  console.log(` DB Test:  http://localhost:${PORT}/api/db-test`);
  console.log(`---------------------------------------------------`);
});


// Run commands to start the server:
// node server.js or npm run dev

