// -------------------------
// UniStress Database Init
// -------------------------
// Creates all tables needed for UniStress.
// Run once: node Backend/db/init.js

import pool from "./pool.js";

// -------------------------
// Users Table (existing)
// -------------------------
async function createUsersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password_hash TEXT,
      google_id TEXT UNIQUE,
      handle VARCHAR(50),
      avatar_color VARCHAR(7) DEFAULT '#4e54c8',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log("✅ users table is ready");
}

// -------------------------
// Password Reset Tokens (existing)
// -------------------------
async function createPasswordResetTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_password_reset_user_id
    ON password_reset_tokens(user_id);

    CREATE INDEX IF NOT EXISTS idx_password_reset_token_hash
    ON password_reset_tokens(token_hash);

    CREATE UNIQUE INDEX IF NOT EXISTS uq_password_reset_active_token_per_user
    ON password_reset_tokens(user_id)
    WHERE used = FALSE;
  `);
  console.log("✅ password_reset_tokens table is ready");
}

// -------------------------
// Stress Check-ins
// -------------------------
async function createStressTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS stress_checkins (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      stress_level SMALLINT NOT NULL CHECK (stress_level BETWEEN 1 AND 10),
      mood VARCHAR(30) NOT NULL,
      mood_emoji VARCHAR(10),
      triggers TEXT[] DEFAULT '{}',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_stress_user ON stress_checkins(user_id);
    CREATE INDEX IF NOT EXISTS idx_stress_date ON stress_checkins(user_id, created_at);
  `);
  console.log("✅ stress_checkins table is ready");
}

// -------------------------
// Exercise Logs
// -------------------------
async function createExerciseTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS exercise_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      exercise_type VARCHAR(50) NOT NULL,
      duration INTEGER NOT NULL CHECK (duration > 0),
      intensity VARCHAR(20) NOT NULL DEFAULT 'Light',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_exercise_user ON exercise_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_exercise_date ON exercise_logs(user_id, created_at);
  `);
  console.log("✅ exercise_logs table is ready");
}

// -------------------------
// Sleep Logs
// -------------------------
async function createSleepTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sleep_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      bedtime TIME NOT NULL,
      wake_time TIME NOT NULL,
      duration_hours NUMERIC(4,2) NOT NULL,
      quality SMALLINT NOT NULL CHECK (quality BETWEEN 1 AND 5),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_sleep_user ON sleep_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_sleep_date ON sleep_logs(user_id, created_at);
  `);
  console.log("✅ sleep_logs table is ready");
}

// -------------------------
// Hydration Logs
// -------------------------
async function createHydrationTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hydration_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      glasses INTEGER NOT NULL CHECK (glasses > 0),
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_hydration_user ON hydration_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_hydration_date ON hydration_logs(user_id, created_at);
  `);
  console.log("✅ hydration_logs table is ready");
}

// -------------------------
// Focus Sessions
// -------------------------
async function createFocusTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS focus_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
      mode VARCHAR(20) NOT NULL DEFAULT 'focus',
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_focus_user ON focus_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_focus_date ON focus_sessions(user_id, created_at);
  `);
  console.log("✅ focus_sessions table is ready");
}

// -------------------------
// Breathe Sessions
// -------------------------
async function createBreatheTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS breathe_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      technique VARCHAR(50) NOT NULL,
      technique_name VARCHAR(100),
      cycles INTEGER NOT NULL CHECK (cycles > 0),
      duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_breathe_user ON breathe_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_breathe_date ON breathe_sessions(user_id, created_at);
  `);
  console.log("✅ breathe_sessions table is ready");
}

// -------------------------
// Notes
// -------------------------
async function createNotesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(100) NOT NULL,
      body TEXT NOT NULL,
      category VARCHAR(30) NOT NULL DEFAULT 'Reflection',
      mood VARCHAR(10) DEFAULT '😐',
      pinned BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
    CREATE INDEX IF NOT EXISTS idx_notes_date ON notes(user_id, created_at);
  `);
  console.log("✅ notes table is ready");
}

// -------------------------
// Reminders
// -------------------------
async function createRemindersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reminders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text VARCHAR(100) NOT NULL,
      due_date DATE NOT NULL,
      due_time TIME NOT NULL DEFAULT '09:00',
      category VARCHAR(30) NOT NULL DEFAULT 'Other',
      repeat VARCHAR(10) NOT NULL DEFAULT 'none',
      priority VARCHAR(10) NOT NULL DEFAULT 'medium',
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);
    CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(user_id, due_date);
  `);
  console.log("✅ reminders table is ready");
}

async function createTasksTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(200) NOT NULL,
      done BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
  `);
  console.log("✅ tasks table is ready");
}

// -------------------------
// Run All
// -------------------------
async function runInit() {
  try {
    await pool.query("BEGIN");

    // Existing tables
    await createUsersTable();
    await createPasswordResetTable();

    // New module tables
    await createStressTable();
    await createExerciseTable();
    await createSleepTable();
    await createHydrationTable();
    await createFocusTable();
    await createBreatheTable();
    await createNotesTable();
    await createRemindersTable();
    await createTasksTable();

    await pool.query("COMMIT");
    console.log("\n🎉 All UniStress tables initialised successfully!");
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("❌ Error running init:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

runInit();



// Note that i will add more tables later as needed.

// To run this script, use the command:
// node backend/db/init.js
