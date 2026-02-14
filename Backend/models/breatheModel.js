import pool from "../db/pool.js";

export async function createBreatheSession(userId, { technique, technique_name, cycles, duration_seconds }) {
  const q = `
    INSERT INTO breathe_sessions (user_id, technique, technique_name, cycles, duration_seconds)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const res = await pool.query(q, [userId, technique, technique_name || "", cycles, duration_seconds]);
  return res.rows[0];
}

export async function getBreatheSessions(userId, limit = 50) {
  const q = `SELECT * FROM breathe_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2;`;
  const res = await pool.query(q, [userId, limit]);
  return res.rows;
}

export async function getBreatheByDateRange(userId, startDate, endDate) {
  const q = `
    SELECT * FROM breathe_sessions
    WHERE user_id = $1 AND created_at >= $2 AND created_at < $3
    ORDER BY created_at DESC;
  `;
  const res = await pool.query(q, [userId, startDate, endDate]);
  return res.rows;
}

export async function deleteBreatheSession(userId, id) {
  const q = `DELETE FROM breathe_sessions WHERE id = $1 AND user_id = $2 RETURNING id;`;
  const res = await pool.query(q, [id, userId]);
  return res.rows[0] || null;
}

export async function deleteAllBreatheSessions(userId) {
  await pool.query(`DELETE FROM breathe_sessions WHERE user_id = $1;`, [userId]);
}