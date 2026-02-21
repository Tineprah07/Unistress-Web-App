// -------------------------
// Fitbit Tokens Table Migration
// -------------------------
// Run once: node Backend/db/fitbit-migration.js
// This creates the table that stores each user's Fitbit OAuth tokens.

import pool from "./pool.js";

async function createFitbitTokensTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS fitbit_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      fitbit_user_id VARCHAR(50),
      access_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      token_type VARCHAR(20) DEFAULT 'Bearer',
      expires_at TIMESTAMP NOT NULL,
      scope TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_fitbit_user ON fitbit_tokens(user_id);
  `);
  console.log("✅ fitbit_tokens table is ready");
}

async function run() {
  try {
    await createFitbitTokensTable();
    console.log("\n🎉 Fitbit migration complete!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await pool.end();
  }
}

run();