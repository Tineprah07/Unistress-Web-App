import pool from "../db/pool.js";

export async function createReminder(userId, { text, due_date, due_time, category, repeat, priority }) {
  const q = `
    INSERT INTO reminders (user_id, text, due_date, due_time, category, repeat, priority)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
  const res = await pool.query(q, [userId, text, due_date, due_time || "09:00", category || "Other", repeat || "none", priority || "medium"]);
  return res.rows[0];
}

export async function getReminders(userId) {
  const q = `SELECT * FROM reminders WHERE user_id = $1 ORDER BY completed ASC, due_date ASC, due_time ASC;`;
  const res = await pool.query(q, [userId]);
  return res.rows;
}

export async function updateReminder(userId, id, { text, due_date, due_time, category, repeat, priority }) {
  const q = `
    UPDATE reminders
    SET text = $3, due_date = $4, due_time = $5, category = $6, repeat = $7, priority = $8, updated_at = NOW()
    WHERE id = $1 AND user_id = $2
    RETURNING *;
  `;
  const res = await pool.query(q, [id, userId, text, due_date, due_time, category, repeat, priority]);
  return res.rows[0] || null;
}

export async function toggleComplete(userId, id) {
  const q = `
    UPDATE reminders SET completed = NOT completed, updated_at = NOW()
    WHERE id = $1 AND user_id = $2
    RETURNING *;
  `;
  const res = await pool.query(q, [id, userId]);
  return res.rows[0] || null;
}

export async function deleteReminder(userId, id) {
  const q = `DELETE FROM reminders WHERE id = $1 AND user_id = $2 RETURNING id;`;
  const res = await pool.query(q, [id, userId]);
  return res.rows[0] || null;
}

export async function deleteCompletedReminders(userId) {
  await pool.query(`DELETE FROM reminders WHERE user_id = $1 AND completed = TRUE;`, [userId]);
}