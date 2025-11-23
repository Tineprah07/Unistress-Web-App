// -------------------------
// PostgreSQL connection pool
// -------------------------
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// Create a connection pool using DATABASE_URL from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Simple helper to test the connection
export async function testDbConnection() {
  const result = await pool.query("SELECT NOW()");
  return result.rows[0];
}

export default pool;
