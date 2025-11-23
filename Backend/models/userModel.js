// -------------------------
// UniStress User Model
// -------------------------
// All database queries related to the `users` table
// live in this file. Controllers will call these
// functions instead of writing SQL directly.

import pool from "../db/pool.js";

// -------------------------
// Create a new user
// -------------------------
// `passwordHash` should already be hashed using bcrypt
// before this function is called.
export async function createUser(name, email, passwordHash) {
  const query = `
    INSERT INTO users (name, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, name, email, created_at;
  `;

  const values = [name, email, passwordHash];

  const result = await pool.query(query, values);
  return result.rows[0]; // the newly created user (without password)
}

// -------------------------
// Find user by email
// -------------------------
// Used during login or to check if an email is taken.
export async function findUserByEmail(email) {
  const query = `
    SELECT id, name, email, password_hash, created_at
    FROM users
    WHERE email = $1;
  `;

  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
}

// -------------------------
// Find user by id
// -------------------------
// Useful for auth/session checks later.
export async function findUserById(id) {
  const query = `
    SELECT id, name, email, created_at
    FROM users
    WHERE id = $1;
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}
