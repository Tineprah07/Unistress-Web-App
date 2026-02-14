import pool from "../db/pool.js";

export async function createExercise(userId, { exercise_type, duration, intensity, notes }) {
  const q = `
    INSERT INTO exercise_logs (user_id, exercise_type, duration, intensity, notes)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const res = await pool.query(q, [userId, exercise_type, duration, intensity || "Light", notes || null]);
  return res.rows[0];
}

export async function getExercises(userId, limit = 50) {
  const q = `SELECT * FROM exercise_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2;`;
  const res = await pool.query(q, [userId, limit]);
  return res.rows;
}

export async function getExercisesByDateRange(userId, startDate, endDate) {
  const q = `
    SELECT * FROM exercise_logs
    WHERE user_id = $1 AND created_at >= $2 AND created_at < $3
    ORDER BY created_at DESC;
  `;
  const res = await pool.query(q, [userId, startDate, endDate]);
  return res.rows;
}

export async function deleteExercise(userId, id) {
  const q = `DELETE FROM exercise_logs WHERE id = $1 AND user_id = $2 RETURNING id;`;
  const res = await pool.query(q, [id, userId]);
  return res.rows[0] || null;
}

export async function deleteAllExercises(userId) {
  await pool.query(`DELETE FROM exercise_logs WHERE user_id = $1;`, [userId]);
}