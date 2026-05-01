# UniStress

> A full-stack student wellbeing platform that brings stress, sleep, hydration, exercise, and focus tracking together in one place, with optional Fitbit integration.

![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.1-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13%2B-336791?logo=postgresql&logoColor=white)
![Passport](https://img.shields.io/badge/Auth-Passport.js-34E27A?logo=passport&logoColor=white)
![Licence](https://img.shields.io/badge/Licence-ISC-blue)

---

## Table of Contents

1. [Overview](#overview)
2. [Live Deployment](#live-deployment)
3. [Features](#features)
4. [Tech Stack](#tech-stack)
5. [Architecture](#architecture)
6. [Project Structure](#project-structure)
7. [Prerequisites](#prerequisites)
8. [Installation and Setup](#installation-and-setup)
9. [Environment Variables](#environment-variables)
10. [Available Scripts](#available-scripts)
11. [API Documentation](#api-documentation)
12. [Testing](#testing)
13. [Deployment](#deployment)
14. [Academic Context](#academic-context)
15. [Licence](#licence)
16. [Acknowledgements](#acknowledgements)
17. [Author](#author)

---

## Overview

**UniStress** is a full-stack web application designed to help university students manage and improve their day-to-day wellbeing. It combines stress check-ins, sleep tracking, hydration logging, exercise records, focused-study timers, and guided breathing into a single dashboard, alongside lightweight productivity tools such as tasks, notes, and reminders. Optional integration with the Fitbit Web API allows users to enrich their wellbeing data with real heart-rate and activity readings from a wearable device.

The platform is aimed at students who experience the academic, social, and financial pressures of higher education and who would benefit from a single space to monitor habits, spot trends, and act on them. Rather than fragmenting wellbeing across multiple apps, UniStress consolidates the most evidence-backed self-care behaviours into one private, secure account.

UniStress was developed as a final-year **BSc (Hons) Software Engineering** dissertation project at the **University of Portsmouth** during the 2025/2026 academic session. The codebase, primary research, and accompanying dissertation form a complete software engineering artefact: requirements gathering, design, implementation, testing, and evaluation.

---

## Live Deployment

The application is deployed and publicly accessible at:

**https://unistress.onrender.com**

A test account can be created from the sign-up page, or you may sign in with Google.

---

## Features

### Authentication and Account Management
- Email and password registration with bcrypt-hashed credentials
- Google OAuth 2.0 single sign-on via Passport.js
- Secure session handling with `express-session` and HTTP-only cookies
- Forgot-password flow with time-limited, single-use reset tokens, delivered by email
- Profile editing (display name, handle, avatar colour) and notification preference toggle
- Brute-force protection on login and registration via `express-rate-limit`

### Wellbeing Tracking Modules
- **Stress check-ins:** 1 to 10 scale with mood, emoji, triggers, free-text notes, and optional heart-rate field
- **Sleep logs:** bedtime, wake time, automatic duration calculation, and quality rating
- **Hydration logs:** quick-add glasses with daily and weekly totals
- **Exercise logs:** activity type, duration, intensity, and notes
- **Guided breathing sessions:** technique, cycles, and duration recorded for streak tracking

### Productivity Tools
- **Pomodoro-style focus timer** with focus and break modes, persisting completed sessions
- **Tasks list** with mark-as-done and delete operations
- **Notes** with categories, mood tags, and pinning
- **Reminders** with date, time, category, repeat option, priority, and completion state

### Dashboard and Visualisation
- Weekly grouped bar charts for stress, exercise, and sleep, rendered with vanilla JavaScript and CSS
- Daily summary view that aggregates totals across modules
- Wellbeing score (0 to 100) computed from recent check-ins
- Streaks and progress against per-user goals

### Goals and Personalisation
- Configurable weekly and daily targets for exercise minutes, sleep hours, hydration glasses, focus minutes, focus sessions, and stress check-ins

### Fitbit Web API Integration
- OAuth 2.0 authorisation flow with secure token storage
- Automatic refresh-token handling with concurrent-refresh deduplication
- Per-user response caching (5 minute TTL) to respect Fitbit's 150 requests/hour quota
- Pulls heart-rate, sleep, and activity data into the dashboard

---

## Tech Stack

| Layer            | Technology                                                                 |
| ---------------- | -------------------------------------------------------------------------- |
| Frontend         | HTML5, CSS3, Vanilla JavaScript (ES Modules), custom DOM/CSS bar charts    |
| Backend          | Node.js (ES Modules), Express 5                                            |
| Database         | PostgreSQL (via `pg` connection pool, SSL in production)                   |
| Authentication   | Passport.js, `passport-google-oauth20`, `bcrypt`, `express-session`        |
| Security         | `cors`, `express-rate-limit`, HTTP-only secure cookies                     |
| External APIs    | Fitbit Web API (OAuth 2.0), Google OAuth 2.0                               |
| Email            | Nodemailer (Gmail SMTP)                                                    |
| Tooling          | `nodemon` (development), Node's built-in test runner (`node:test`)         |
| Hosting          | Render (Frankfurt, EU Central) with a managed PostgreSQL instance          |

---

## Architecture

UniStress follows a classic **Model-View-Controller (MVC)** layering on the backend, with a separate static frontend served by the same Express process:

- **Routes** (`Backend/routes/`): map HTTP methods and paths to controller actions, applying `requireAuth` middleware to protected modules.
- **Controllers** (`Backend/controllers/`): validate input, call into models, and shape the JSON response.
- **Models** (`Backend/models/`): encapsulate all SQL queries against PostgreSQL via a shared connection pool.
- **Middleware** (`Backend/middleware/`): authentication guard that supports both Passport sessions and manual session users.
- **Views** (`Frontend/views/`): static HTML pages, with their CSS and JS served from `Frontend/public/`.

All session state is persisted in `express-session`, while long-lived data (users, logs, tokens, goals) lives in PostgreSQL. The schema is created idempotently at server startup by `Backend/db/init.js`.

---

## Project Structure

```
Unistress-Web-App/
├── Backend/
│   ├── controllers/         # Request handlers for each module
│   ├── db/
│   │   ├── init.js          # Idempotent table creation on startup
│   │   ├── pool.js          # PostgreSQL connection pool
│   │   ├── reset.js         # Local-only DB reset helper
│   │   └── fitbitMigration.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/              # SQL data access layer
│   ├── routes/              # Express routers (one per module)
│   ├── tests/               # node:test unit tests for controllers
│   ├── utils/
│   │   ├── fitbitApi.js     # Fitbit API client with token refresh and caching
│   │   └── mailer.js        # Nodemailer wrapper for password-reset emails
│   └── server.js            # App entry point, Passport config, route wiring
├── Frontend/
│   ├── assets/images/       # Static images
│   ├── public/
│   │   ├── css/             # Per-page stylesheets and global.css
│   │   └── js/              # Per-page client modules
│   └── views/               # HTML pages (auth, homepage, stress, sleep, etc.)
├── .env.example             # Template for local environment variables
├── .gitignore
├── package.json
└── README.md
```

---

## Prerequisites

Before installing, make sure the following are available on your machine:

- **Node.js** 22 or later (the codebase uses ES Modules and Express 5)
- **npm** 10 or later (bundled with Node)
- **PostgreSQL** 13 or later (any compatible managed service such as Neon or Render Postgres also works)
- **Git**
- *(Optional)* A **Fitbit Developer** account, if you want to enable the Fitbit integration locally
- *(Optional)* A **Google Cloud Console** project with OAuth 2.0 credentials, if you want to enable Google sign-in locally
- *(Optional)* A **Gmail account with an App Password**, if you want to send password-reset emails locally

---

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/Tineprah07/Unistress-Web-App.git
cd Unistress-Web-App
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up the PostgreSQL database

Create a local database and note the connection string:

```bash
createdb unistress_db
```

Or, with `psql`:

```sql
CREATE DATABASE unistress_db;
```

You can use either a `DATABASE_URL` connection string or the individual `DB_*` variables shown in the next step.

### 4. Configure environment variables

Create a `.env` file in the project root using the template below. Replace every placeholder with your own credentials. **Never commit this file:** it is already listed in `.gitignore`.

```env
# Server
PORT=3000
NODE_ENV=development

# Security (generate a long, random string, e.g. with `openssl rand -hex 32`)
SESSION_SECRET=replace_with_a_long_random_string

# Database
DATABASE_URL=postgres://your_user@localhost:5432/unistress_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_NAME=unistress_db
DB_PORT=5432

# CORS / Frontend origin
FRONTEND_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Google OAuth (Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Fitbit API (Fitbit Developer Portal)
FITBIT_CLIENT_ID=your_fitbit_client_id
FITBIT_CLIENT_SECRET=your_fitbit_client_secret
FITBIT_REDIRECT_URI=http://localhost:3000/api/fitbit/callback

# Email (Gmail SMTP, requires an App Password)
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password
```

### 5. Initialise the database schema

The schema is created automatically on first server start by `Backend/db/init.js`, which runs `CREATE TABLE IF NOT EXISTS` statements inside a transaction. No manual migration step is required; simply start the server in the next step.

To run the initialiser by itself:

```bash
node Backend/db/init.js
```

### 6. Run the application in development

```bash
npm run dev
```

The server will start with `nodemon` and reload on file changes.

### 7. Open the application

Visit:

```
http://localhost:3000
```

A health check is available at `http://localhost:3000/api/health`, and a database connectivity check at `http://localhost:3000/api/db-test`.

---

## Environment Variables

All values shown below are **placeholders only**. Real credentials must never be committed to version control or shared publicly.

| Variable                | Purpose                                                                                | Example (placeholder)                                    |
| ----------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `PORT`                  | Port the Express server listens on                                                     | `3000`                                                   |
| `NODE_ENV`              | Runtime mode; enables secure cookies and SSL when set to `production`                  | `development`                                            |
| `SESSION_SECRET`        | Secret used to sign session cookies                                                    | `a_long_random_string`                                   |
| `DATABASE_URL`          | PostgreSQL connection string used by the `pg` pool                                     | `postgres://user:pass@host:5432/unistress_db`            |
| `DB_USER`               | Database username (alternative to `DATABASE_URL`)                                      | `postgres`                                               |
| `DB_PASSWORD`           | Database password                                                                      | `your_password_here`                                     |
| `DB_HOST`               | Database host                                                                          | `localhost`                                              |
| `DB_NAME`               | Database name                                                                          | `unistress_db`                                           |
| `DB_PORT`               | Database port                                                                          | `5432`                                                   |
| `FRONTEND_ORIGIN`       | Allowed CORS origin                                                                    | `http://localhost:3000`                                  |
| `FRONTEND_URL`          | Base URL used in outgoing emails (password reset links)                                | `http://localhost:3000`                                  |
| `GOOGLE_CLIENT_ID`      | Google OAuth client ID                                                                 | `your_google_client_id`                                  |
| `GOOGLE_CLIENT_SECRET`  | Google OAuth client secret                                                             | `your_google_client_secret`                              |
| `GOOGLE_CALLBACK_URL`   | OAuth redirect URI registered in the Google Cloud Console                              | `http://localhost:3000/api/auth/google/callback`         |
| `FITBIT_CLIENT_ID`      | Fitbit Web API client ID                                                               | `your_fitbit_client_id`                                  |
| `FITBIT_CLIENT_SECRET`  | Fitbit Web API client secret                                                           | `your_fitbit_client_secret`                              |
| `FITBIT_REDIRECT_URI`   | Redirect URI registered in the Fitbit Developer Portal                                 | `http://localhost:3000/api/fitbit/callback`              |
| `EMAIL_USER`            | Gmail address used as the SMTP sender                                                  | `your_gmail_address@gmail.com`                           |
| `EMAIL_PASS`            | Gmail App Password (not your regular account password)                                 | `your_gmail_app_password`                                |

---

## Available Scripts

The following npm scripts are defined in `package.json`:

| Script           | Command                                       | Purpose                                                          |
| ---------------- | --------------------------------------------- | ---------------------------------------------------------------- |
| `npm start`      | `node Backend/server.js`                      | Run the production server                                        |
| `npm run dev`    | `nodemon Backend/server.js`                   | Run the server in development mode with auto-reload              |
| `npm test`       | `node --test Backend/tests/**/*.test.js`      | Run the backend unit-test suite via Node's built-in test runner  |

---

## API Documentation

All API endpoints are mounted under `/api` and return JSON. Module endpoints (everything except `/api/auth`, `/api/health`, and `/api/db-test`) require an authenticated session and return `401 Unauthorised` otherwise.

### Authentication (`/api/auth`)

| Method | Path                          | Description                              |
| ------ | ----------------------------- | ---------------------------------------- |
| POST   | `/register`                   | Create a new account                     |
| POST   | `/login`                      | Sign in with email and password          |
| POST   | `/logout`                     | Sign out and destroy the session         |
| GET    | `/me`                         | Get the current authenticated user       |
| PUT    | `/profile`                    | Update profile fields                    |
| POST   | `/forgot`                     | Request a password reset email           |
| POST   | `/reset`                      | Submit a new password using a reset token|
| GET    | `/google`                     | Begin Google OAuth flow                  |
| GET    | `/google/callback`            | Google OAuth redirect target             |

### Module APIs (representative sample)

| Path                  | Description                                       |
| --------------------- | ------------------------------------------------- |
| `/api/stress`         | Create and list stress check-ins                  |
| `/api/sleep`          | Create and list sleep logs                        |
| `/api/hydration`      | Create and list hydration entries                 |
| `/api/exercise`       | Create and list exercise logs                     |
| `/api/focus`          | Record completed focus sessions                   |
| `/api/breathe`        | Record completed breathing sessions               |
| `/api/notes`          | Full CRUD for notes                               |
| `/api/reminders`      | Full CRUD for reminders                           |
| `/api/tasks`          | Manage tasks                                      |
| `/api/goals`          | Read and update per-user goals                    |
| `/api/summary`        | Aggregated daily and weekly summaries             |
| `/api/fitbit`         | Fitbit OAuth, token status, and proxied endpoints |

For the complete list, browse [`Backend/routes/`](./Backend/routes/) and the corresponding controllers in [`Backend/controllers/`](./Backend/controllers/).

### Health checks

| Method | Path             | Description                          |
| ------ | ---------------- | ------------------------------------ |
| GET    | `/api/health`    | Liveness probe                       |
| GET    | `/api/db-test`   | Verifies the PostgreSQL connection   |

---

## Testing

The system was validated through a multi-layered evaluation strategy:

- **20 automated unit tests** for backend controllers, written against Node's built-in `node:test` runner with the standard `assert` module. Files live in [`Backend/tests/`](./Backend/tests/) and cover stress, sleep, hydration, exercise, focus, notes, reminders, and the auth profile flow.
- **14 manual functional tests** documented in the dissertation, exercising the registration, login, password-reset, tracking, dashboard, and Fitbit flows.
- **6 security tests** covering session protection, brute-force rate limiting, password hashing, password-reset token expiry, OAuth callback handling, and SQL-injection resistance.
- **Responsive testing** across three viewport widths (mobile 375 px, tablet 768 px, desktop 1440 px).
- **Usability testing with eight student participants** (System Usability Scale), feeding back into the final UI iteration.

Run the unit-test suite locally with:

```bash
npm test
```

---

## Deployment

UniStress is deployed on **Render**.

- **Region:** Frankfurt, EU Central (lowest latency for UK users while remaining within the EU data zone)
- **Database:** Render-managed PostgreSQL with SSL enforced. The `pg` pool enables `ssl: { rejectUnauthorized: false }` automatically when `NODE_ENV=production`.
- **Build command:** `npm install`
- **Start command:** `npm start`
- **Trust proxy:** the Express app sets `app.set("trust proxy", 1)` so that secure cookies and rate-limit IPs work correctly behind Render's load balancer.

### Environment variables to set in the Render dashboard

Set every variable listed in [Environment Variables](#environment-variables), and additionally:

| Variable             | Value                                                       |
| -------------------- | ----------------------------------------------------------- |
| `NODE_ENV`           | `production`                                                |
| `TZ`                 | `Europe/London`                                             |
| `FRONTEND_ORIGIN`    | `https://unistress.onrender.com`                            |
| `FRONTEND_URL`       | `https://unistress.onrender.com`                            |
| `GOOGLE_CALLBACK_URL`| `https://unistress.onrender.com/api/auth/google/callback`   |
| `FITBIT_REDIRECT_URI`| `https://unistress.onrender.com/api/fitbit/callback`        |

The corresponding redirect URIs must also be registered in the Google Cloud Console and the Fitbit Developer Portal.

---

## Academic Context

This project was developed as the final-year individual dissertation for the **BSc (Hons) Software Engineering** degree at the **University of Portsmouth**, academic year **2025/2026**. It was supervised by **Dr Taiwo Adedeji** and moderated by **Dr Femi Fasunlade**. The accompanying dissertation documents the requirements analysis, primary research, design rationale, implementation, evaluation, and reflection that frame this codebase.

---

## Licence

Released under the **ISC Licence** (see `package.json`). The project is provided as-is for academic and demonstration purposes; please contact the author before any commercial reuse.

---

## Acknowledgements

- **Dr Taiwo Adedeji**, project supervisor, University of Portsmouth, for ongoing guidance and feedback throughout the project lifecycle.
- **Dr Femi Fasunlade**, project moderator, for review and assessment.
- **Student participants** in the primary research survey and usability testing sessions, whose responses shaped the feature set and final user interface.
- The open-source maintainers of Express, Passport, `pg`, Nodemailer, and the wider Node.js ecosystem on which this project depends.

---

## Author

**Augustine Gyamprah**
BSc (Hons) Software Engineering, University of Portsmouth
GitHub: [@Tineprah07](https://github.com/Tineprah07)
