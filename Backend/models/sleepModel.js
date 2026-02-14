import pool from "../db/pool.js";

export async function createSleepLog(userId, { bedtime, wake_time, duration_hours, quality, notes }) {
  const q = `
    INSERT INTO sleep_logs (user_id, bedtime, wake_time, duration_hours, quality, notes)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const res = await pool.query(q, [userId, bedtime, wake_time, duration_hours, quality, notes || null]);
  return res.rows[0];
}

export async function getSleepLogs(userId, limit = 50) {
  const q = `SELECT * FROM sleep_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2;`;
  const res = await pool.query(q, [userId, limit]);
  return res.rows;
}

export async function getSleepByDateRange(userId, startDate, endDate) {
  const q = `
    SELECT * FROM sleep_logs
    WHERE user_id = $1 AND created_at >= $2 AND created_at < $3
    ORDER BY created_at DESC;
  `;
  const res = await pool.query(q, [userId, startDate, endDate]);
  return res.rows;
}

export async function deleteSleepLog(userId, id) {
  const q = `DELETE FROM sleep_logs WHERE id = $1 AND user_id = $2 RETURNING id;`;
  const res = await pool.query(q, [id, userId]);
  return res.rows[0] || null;
}

export async function deleteAllSleepLogs(userId) {
  await pool.query(`DELETE FROM sleep_logs WHERE user_id = $1;`, [userId]);
}