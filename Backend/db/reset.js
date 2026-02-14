// -------------------------
// UniStress Database Reset
// -------------------------
// WARNING: Drops ALL tables. Development only.
// Run: node Backend/db/reset.js

import pool from "./pool.js";

async function resetDatabase() {
  try {
    console.log("⚠️  Dropping all UniStress tables...\n");
    await pool.query(`
      DROP TABLE IF EXISTS password_reset_tokens CASCADE;
      DROP TABLE IF EXISTS stress_checkins CASCADE;
      DROP TABLE IF EXISTS exercise_logs CASCADE;
      DROP TABLE IF EXISTS sleep_logs CASCADE;
      DROP TABLE IF EXISTS hydration_logs CASCADE;
      DROP TABLE IF EXISTS focus_sessions CASCADE;
      DROP TABLE IF EXISTS breathe_sessions CASCADE;
      DROP TABLE IF EXISTS notes CASCADE;
      DROP TABLE IF EXISTS reminders CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS tasks CASCADE;
    `);
    console.log("✅ All tables dropped.\n");
    console.log("Now run: node Backend/db/init.js to recreate them.");
  } catch (error) {
    console.error("❌ Error resetting database:", error);
  } finally {
    await pool.end();
  }
}

resetDatabase();