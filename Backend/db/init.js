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
      password_hash TEXT NOT NULL,
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
// Run all table initialisations
// -------------------------
async function runInit() {
  await createUsersTable();
  await pool.end(); // close connection so script ends
}

// Execute init function
runInit();



// Note that i will add more tables later as needed.

// To run this script, use the command:
// node backend/db/init.js
