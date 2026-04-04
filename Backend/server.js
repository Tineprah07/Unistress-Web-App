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
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { findUserByEmail, createUser, findUserByGoogleId, findUserById } from "./models/userModel.js";

// Auth middleware
import { requireAuth } from "./middleware/authMiddleware.js";

// Route imports
import authRoutes from "./routes/authRoutes.js";
import stressRoutes from "./routes/stressRoutes.js";
import exerciseRoutes from "./routes/exerciseRoutes.js";
import sleepRoutes from "./routes/sleepRoutes.js";
import hydrationRoutes from "./routes/hydrationRoutes.js";
import focusRoutes from "./routes/focusRoutes.js";
import breatheRoutes from "./routes/breatheRoutes.js";
import notesRoutes from "./routes/notesRoutes.js";
import remindersRoutes from "./routes/remindersRoutes.js";
import summaryRoutes from "./routes/summaryRoutes.js";
import tasksRoutes from "./routes/tasksRoutes.js";
import fitbitRoutes from "./routes/fitbitRoutes.js";
import goalsRoutes from "./routes/goalsRoutes.js";

// Load environment variables
dotenv.config();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

// -------------------------
// Core Middleware
// -------------------------

// Enable CORS
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

// Auth Guard Middleware (for view routes)
function ensureAuthenticated(req, res, next) {
  const isAuthenticated = req.isAuthenticated?.() || (req.session && req.session.user);

  if (isAuthenticated) {
    return next();
  }

  if (req.headers["x-requested-with"] === "XMLHttpRequest" || req.headers.accept?.includes("json")) {
    return res.status(401).json({ error: "Unauthorized. Please log in." });
  }

  res.redirect("/views/auth.html");
}

// -------------------------
// Passport Configuration
// -------------------------

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

        let user = await findUserByGoogleId(googleId);

        if (!user) {
          user = await findUserByEmail(email);
          if (!user) {
            user = await createUser(profile.displayName, email, null, googleId);
          }
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await findUserById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Make user available in templates/locals
app.use((req, res, next) => {
  res.locals.currentUser = req.user || req.session.user || null;
  next();
});

// -------------------------
// Static Paths
// -------------------------
const frontendPath = path.join(__dirname, "../Frontend");
const publicPath = path.join(frontendPath, "public");
const assetsPath = path.join(frontendPath, "assets");
const viewsPath = path.join(frontendPath, "views");

// 1. SERVE PUBLIC ASSETS (Keep this high up)
// Allows access to /js/auth.js and /css/auth.css without login
app.use(express.static(publicPath));
app.use("/assets", express.static(assetsPath));

// 2. PUBLIC PAGE ROUTES
app.get("/", (req, res) => {
  res.sendFile(path.join(viewsPath, "index.html"));
});

// The main hub for Login, Register, and now Reset Password
app.get("/views/auth.html", (req, res) => {
  // If user is already logged in, send them to the homepage
  if (req.isAuthenticated?.() || req.session.user) {
    return res.redirect("/views/homepage.html");
  }
  res.sendFile(path.join(viewsPath, "auth.html"));
});

// 3. PROTECTED ROUTES
// Only the homepage and other internal views require the ensureAuthenticated check
app.get("/views/homepage.html", ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(viewsPath, "homepage.html"));
});

// This catch-all protects any OTHER private file in /views
app.use("/views", ensureAuthenticated, express.static(viewsPath));

// -------------------------
// API Routes
// -------------------------

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "UniStress backend is live" });
});

// Auth (public — no requireAuth)
app.use("/api/auth", authRoutes);

// Protected module APIs — all require login
app.use("/api/stress",     requireAuth, stressRoutes);
app.use("/api/exercise",   requireAuth, exerciseRoutes);
app.use("/api/sleep",      requireAuth, sleepRoutes);
app.use("/api/hydration",  requireAuth, hydrationRoutes);
app.use("/api/focus",      requireAuth, focusRoutes);
app.use("/api/breathe",    requireAuth, breatheRoutes);
app.use("/api/notes",      requireAuth, notesRoutes);
app.use("/api/reminders",  requireAuth, remindersRoutes);
app.use("/api/summary",    requireAuth, summaryRoutes);
app.use("/api/tasks", requireAuth, tasksRoutes);
app.use("/api/goals", requireAuth, goalsRoutes);

// Fitbit: callback is a browser redirect from Fitbit, so use ensureAuthenticated (redirects to login)
app.get("/api/fitbit/callback", ensureAuthenticated, async (req, res) => {
  // Manually import and call the callback controller
  const { callback } = await import("./controllers/fitbitController.js");
  req.currentUser = { id: (req.user || req.session.user).id };
  return callback(req, res);
});

// All other Fitbit endpoints use requireAuth (returns 401 JSON)
app.use("/api/fitbit", requireAuth, fitbitRoutes);

// Database connection test
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
  console.log(`  UniStress running at http://localhost:${PORT}`);
  console.log(`-----------------------------------------------`);
});

// Run commands to start the server:

// node Backend/server.js or npm run dev or npm start