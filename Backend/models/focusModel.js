import pool from "../db/pool.js";

export async function createFocusSession(userId, { duration_minutes, mode }) {
  const q = `
    INSERT INTO focus_sessions (user_id, duration_minutes, mode)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const res = await pool.query(q, [userId, duration_minutes, mode || "focus"]);
  return res.rows[0];
}

export async function getFocusSessions(userId, limit = 50) {
  const q = `SELECT * FROM focus_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2;`;
  const res = await pool.query(q, [userId, limit]);
  return res.rows;
}

export async function getFocusByDateRange(userId, startDate, endDate) {
  const q = `
    SELECT * FROM focus_sessions
    WHERE user_id = $1 AND created_at >= $2 AND created_at < $3
    ORDER BY created_at DESC;
  `;
  const res = await pool.query(q, [userId, startDate, endDate]);
  return res.rows;
}

export async function deleteFocusSession(userId, id) {
  const q = `DELETE FROM focus_sessions WHERE id = $1 AND user_id = $2 RETURNING id;`;
  const res = await pool.query(q, [id, userId]);
  return res.rows[0] || null;
}

export async function deleteAllFocusSessions(userId) {
  await pool.query(`DELETE FROM focus_sessions WHERE user_id = $1;`, [userId]);
}