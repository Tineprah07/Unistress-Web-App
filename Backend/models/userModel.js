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
export async function createUser(name, email, passwordHash = null, googleId = null) {
  const query = `
    INSERT INTO users (name, email, password_hash, google_id)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, email, handle, avatar_color, created_at;
  `;

  const values = [name, email, passwordHash, googleId];

  const result = await pool.query(query, values);
  return result.rows[0];
}

// -------------------------
// Find user by email
// -------------------------
// Used during login or to check if an email is taken.
export async function findUserByEmail(email) {
  const query = `
    SELECT id, name, email, handle, avatar_color, password_hash, google_id, created_at
    FROM users
    WHERE email = $1;
  `;

  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
}

// -------------------------
// Find user by Google ID
// -------------------------
// New function to help Passport.js identify returning Google users
export async function findUserByGoogleId(googleId) {
  const query = `
    SELECT id, name, email, handle, avatar_color, created_at
    FROM users
    WHERE google_id = $1;
  `;

  const result = await pool.query(query, [googleId]);
  return result.rows[0] || null;
}

// -------------------------
// Find user by id
// -------------------------
// Useful for auth/session checks later.
export async function findUserById(id) {
  const query = `
    SELECT id, name, email, handle, avatar_color, created_at
    FROM users
    WHERE id = $1;
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

export async function linkGoogleIdToUser(userId, googleId) {
  const query = `
    UPDATE users
    SET google_id = $1
    WHERE id = $2
    RETURNING id, name, email, handle, avatar_color, google_id, created_at;
  `;
  const res = await pool.query(query, [googleId, userId]);
  return res.rows[0] || null;
}

export async function updateUserProfile(userId, { name, handle, avatarColor }) {
  const query = `
    UPDATE users
    SET name = $2, handle = $3, avatar_color = $4
    WHERE id = $1
    RETURNING id, name, email, handle, avatar_color, created_at;
  `;
  const res = await pool.query(query, [userId, name, handle, avatarColor]);
  return res.rows[0] || null;
}
