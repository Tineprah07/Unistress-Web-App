import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import dotenv from "dotenv";

dotenv.config();

// Converts ES module paths into usable directory paths.
// Needed because __dirname is not available in ES modules by default.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// -------------------------
// View engine configuration
// -------------------------
// This tells Express to use EJS for rendering pages,
// and where your EJS files (frontend templates) are located.
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src", "views"));

// -------------------------
// Public / static files
// -------------------------
// Anything inside /public becomes accessible in the browser.
// Example: src/public/css/main.css → /css/main.css
app.use(express.static(path.join(__dirname, "src", "public")));

// -------------------------
// Parsing form + JSON data
// -------------------------
// Makes Express read data sent from forms and JSON requests.
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// -------------------------
// Session handling
// -------------------------
// Used to remember users when they log in.
// Without sessions, every page refresh would forget who you are.
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret", // Key used to secure session data
    resave: false,
    saveUninitialized: false,
  })
);

// Pass user data to all EJS templates automatically.
// This allows you to write <%= currentUser.name %> in any view.
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// -------------------------
// Routes
// -------------------------
// Landing page route. When the user opens "/", load landing.ejs.
app.get("/", (req, res) => {
  res.render("landing");
});

// -------------------------
// Start server
// -------------------------
app.listen(PORT, () => {
  console.log(`UniStress running on http://localhost:${PORT}`);
});
