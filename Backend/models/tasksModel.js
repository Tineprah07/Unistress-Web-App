import pool from "../db/pool.js";

export async function createTask(userId, { name }) {
  const q = `
    INSERT INTO tasks (user_id, name)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const res = await pool.query(q, [userId, name]);
  return res.rows[0];
}

export async function getTasks(userId) {
  const q = `SELECT * FROM tasks WHERE user_id = $1 ORDER BY done ASC, created_at DESC;`;
  const res = await pool.query(q, [userId]);
  return res.rows;
}

export async function toggleTask(userId, id) {
  const q = `
    UPDATE tasks SET done = NOT done
    WHERE id = $1 AND user_id = $2
    RETURNING *;
  `;
  const res = await pool.query(q, [id, userId]);
  return res.rows[0] || null;
}

export async function deleteTask(userId, id) {
  const q = `DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id;`;
  const res = await pool.query(q, [id, userId]);
  return res.rows[0] || null;
}

export async function deleteAllTasks(userId) {
  await pool.query(`DELETE FROM tasks WHERE user_id = $1;`, [userId]);
}