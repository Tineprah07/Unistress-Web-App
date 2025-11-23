// User table setup script

import pool from "./pool.js";

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
  } finally {
    // Close the pool so the script can exit
    await pool.end();
  }
}

// Run the function when this file is executed
createUsersTable();
