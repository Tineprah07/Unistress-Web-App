import pool from "../db/pool.js";

export async function createHydrationLog(userId, glasses) {
  const q = `
    INSERT INTO hydration_logs (user_id, glasses)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const res = await pool.query(q, [userId, glasses]);
  return res.rows[0];
}

export async function getHydrationLogs(userId, limit = 50) {
  const q = `SELECT * FROM hydration_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2;`;
  const res = await pool.query(q, [userId, limit]);
  return res.rows;
}

export async function getHydrationByDateRange(userId, startDate, endDate) {
  const q = `
    SELECT * FROM hydration_logs
    WHERE user_id = $1 AND created_at >= $2 AND created_at < $3
    ORDER BY created_at DESC;
  `;
  const res = await pool.query(q, [userId, startDate, endDate]);
  return res.rows;
}

export async function getTodayTotal(userId) {
  const q = `
    SELECT COALESCE(SUM(glasses), 0) AS total
    FROM hydration_logs
    WHERE user_id = $1 AND created_at::date = CURRENT_DATE;
  `;
  const res = await pool.query(q, [userId]);
  return parseInt(res.rows[0].total, 10);
}

export async function deleteHydrationLog(userId, id) {
  const q = `DELETE FROM hydration_logs WHERE id = $1 AND user_id = $2 RETURNING id;`;
  const res = await pool.query(q, [id, userId]);
  return res.rows[0] || null;
}

export async function deleteAllHydrationLogs(userId) {
  await pool.query(`DELETE FROM hydration_logs WHERE user_id = $1;`, [userId]);
}