// -------------------------
// UniStress Database Init
// -------------------------
// This script creates the initial database tables that
// UniStress needs to run. You only execute it once,
// or again if you reset the database.

import pool from "./pool.js";

// -------------------------
// Create Users Table
// -------------------------
async function createUsersTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password_hash TEXT,
      google_id TEXT UNIQUE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  try {
    await pool.query(createTableQuery);
    console.log("✅ users table is ready");
  } catch (error) {
    console.error("❌ Error creating users table:", error);
  }
}

// -------------------------
// Create Password Reset Tokens Table
// -------------------------
async function createPasswordResetTable() {
  const query = `
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
  `;

  try {
    await pool.query(query);
    console.log("✅ password_reset_tokens table is ready");
  } catch (error) {
    console.error("❌ Error creating password_reset_tokens table:", error);
  }
}


// -------------------------
// Run all table initialisations
// -------------------------
async function runInit() {
  try {
    await pool.query("BEGIN");
    await createUsersTable();
    await createPasswordResetTable();
    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("❌ Error running init:", error);
    throw error;
  } finally {
    await pool.end();
  }
}


// Execute init function
runInit();



// Note that i will add more tables later as needed.

// To run this script, use the command:
// node backend/db/init.js
