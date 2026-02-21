import pool from "../db/pool.js";

// Save or update Fitbit tokens for a user
export async function saveFitbitTokens(userId, { fitbit_user_id, access_token, refresh_token, token_type, expires_at, scope }) {
  const q = `
    INSERT INTO fitbit_tokens (user_id, fitbit_user_id, access_token, refresh_token, token_type, expires_at, scope)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (user_id)
    DO UPDATE SET
      fitbit_user_id = $2,
      access_token = $3,
      refresh_token = $4,
      token_type = $5,
      expires_at = $6,
      scope = $7,
      updated_at = NOW()
    RETURNING *;
  `;
  const res = await pool.query(q, [userId, fitbit_user_id, access_token, refresh_token, token_type || "Bearer", expires_at, scope]);
  return res.rows[0];
}

// Get Fitbit tokens for a user
export async function getFitbitTokens(userId) {
  const q = `SELECT * FROM fitbit_tokens WHERE user_id = $1;`;
  const res = await pool.query(q, [userId]);
  return res.rows[0] || null;
}

// Update tokens after a refresh
export async function updateFitbitTokens(userId, { access_token, refresh_token, expires_at }) {
  const q = `
    UPDATE fitbit_tokens
    SET access_token = $2, refresh_token = $3, expires_at = $4, updated_at = NOW()
    WHERE user_id = $1
    RETURNING *;
  `;
  const res = await pool.query(q, [userId, access_token, refresh_token, expires_at]);
  return res.rows[0] || null;
}

// Delete Fitbit connection for a user
export async function deleteFitbitTokens(userId) {
  const q = `DELETE FROM fitbit_tokens WHERE user_id = $1 RETURNING id;`;
  const res = await pool.query(q, [userId]);
  return res.rows[0] || null;
}

// Check if user has Fitbit connected
export async function isFitbitConnected(userId) {
  const q = `SELECT id, fitbit_user_id, expires_at FROM fitbit_tokens WHERE user_id = $1;`;
  const res = await pool.query(q, [userId]);
  return res.rows[0] || null;
}