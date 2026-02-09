// -------------------------
// UniStress Backend Server
// -------------------------
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import dotenv from "dotenv";
import cors from "cors";
import { testDbConnection } from "./db/pool.js";
import authRoutes from "./routes/authRoutes.js";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { findUserByEmail, createUser, findUserByGoogleId, findUserById } from "./models/userModel.js";

// Load environment variables
dotenv.config();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

// -------------------------
// Core Middleware
// -------------------------
// Enable CORS (allows frontend to call backend API safely)
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

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
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// Initialize Passport and Session Support
app.use(passport.initialize());
app.use(passport.session());

// Configure Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const googleId = profile.id;

        // 1. Check if user exists by Google ID
        let user = await findUserByGoogleId(googleId);

        if (!user) {
          // 2. If not, check if email is already registered locally
          user = await findUserByEmail(email);
          
          if (!user) {
            // 3. Brand new user: Create them
            user = await createUser(profile.displayName, email, null, googleId);
          } else {
            // Optional: Link existing email account to Google ID if not already linked
            // (Requires an update query in userModel, but this works for now)
          }
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Tell Passport how to save the user into the session (by ID)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Tell Passport how to retrieve the full user from the DB using that ID
passport.deserializeUser(async (id, done) => {
  try {
    const user = await findUserById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// --- END OF PASSPORT CONFIGURATION ---

// Make logged-in user available everywhere
app.use((req, res, next) => {
  // Passport puts the user in req.user, your old code used req.session.user
  res.locals.currentUser = req.user || req.session.user || null;
  next();
});


// -------------------------
// Static Frontend
// -------------------------
// 1. Define the root path to the Frontend folder
const frontendPath = path.join(__dirname, "../Frontend");

// 2. Define specific paths for your sibling folders
const publicPath = path.join(frontendPath, "public"); // for css, js
const assetsPath = path.join(frontendPath, "assets"); // for images
const viewsPath = path.join(frontendPath, "views");   // for html files

// Serve static files
app.use(express.static(publicPath));
app.use("/assets", express.static(assetsPath));
app.use("/views", express.static(viewsPath));


// Landing page (shows index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(viewsPath, "index.html"));
});

// -------------------------
// API Routes
// -------------------------
// Test route to confirm backend is running
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "UniStress backend is live" });
});

// Auth routes
app.use("/api/auth", authRoutes);

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
app.listen(PORT, () => {
  console.log(`-----------------------------------------------`);
  console.log(`UniStress running at http://localhost:${PORT}`);
  console.log(`-----------------------------------------------`);  
});


// Run commands to start the server:
// node Backend/server.js or npm run dev or npm start

