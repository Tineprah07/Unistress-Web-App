import pool from "../db/pool.js";

export async function createCheckin(userId, { stress_level, mood, mood_emoji, triggers, notes }) {
  const q = `
    INSERT INTO stress_checkins (user_id, stress_level, mood, mood_emoji, triggers, notes)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const res = await pool.query(q, [userId, stress_level, mood, mood_emoji || "😐", triggers || [], notes || null]);
  return res.rows[0];
}

export async function getCheckins(userId, limit = 50) {
  const q = `SELECT * FROM stress_checkins WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2;`;
  const res = await pool.query(q, [userId, limit]);
  return res.rows;
}

export async function getCheckinsByDateRange(userId, startDate, endDate) {
  const q = `
    SELECT * FROM stress_checkins
    WHERE user_id = $1 AND created_at >= $2 AND created_at < $3
    ORDER BY created_at DESC;
  `;
  const res = await pool.query(q, [userId, startDate, endDate]);
  return res.rows;
}

export async function deleteCheckin(userId, id) {
  const q = `DELETE FROM stress_checkins WHERE id = $1 AND user_id = $2 RETURNING id;`;
  const res = await pool.query(q, [id, userId]);
  return res.rows[0] || null;
}

export async function deleteAllCheckins(userId) {
  await pool.query(`DELETE FROM stress_checkins WHERE user_id = $1;`, [userId]);
}