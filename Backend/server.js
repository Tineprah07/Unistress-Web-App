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

// Auth Guard Middleware
function ensureAuthenticated(req, res, next) {
    const isAuthenticated = req.isAuthenticated?.() || (req.session && req.session.user);
    
    if (isAuthenticated) {
        return next();
    }

    if (req.headers['x-requested-with'] === 'XMLHttpRequest' || req.headers.accept.includes('json')) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }
    
    res.redirect('/views/auth.html');
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

// Serve Public Assets (CSS/JS/Images) first so they are never blocked
app.use(express.static(publicPath));
app.use("/assets", express.static(assetsPath));

// -------------------------
// Page Routes
// -------------------------

// 1. Landing Page
app.get("/", (req, res) => {
  res.sendFile(path.join(viewsPath, "index.html"));
});

// 2. Login Page (Public)
app.get("/views/auth.html", (req, res) => {
    if (req.isAuthenticated?.() || req.session.user) {
        return res.redirect("/views/homepage.html");
    }
    res.sendFile(path.join(viewsPath, "auth.html"));
});

// 3. Reset Password Page (Must be Public)
app.get("/views/resetPassword.html", (req, res) => {
  res.sendFile(path.join(viewsPath, "resetPassword.html"));
});

// 4. Protected Homepage
app.get("/views/homepage.html", ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(viewsPath, "homepage.html"));
});

// 5. Protected Views Catch-all
app.use("/views", ensureAuthenticated, express.static(viewsPath));

// -------------------------
// API Routes
// -------------------------

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "UniStress backend is live" });
});

app.use("/api/auth", authRoutes);

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