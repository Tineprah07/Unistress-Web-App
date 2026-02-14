import pool from "../db/pool.js";

export async function createNote(userId, { title, body, category, mood }) {
  const q = `
    INSERT INTO notes (user_id, title, body, category, mood)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const res = await pool.query(q, [userId, title, body, category || "Reflection", mood || "😐"]);
  return res.rows[0];
}

export async function getNotes(userId, limit = 100) {
  const q = `
    SELECT * FROM notes WHERE user_id = $1
    ORDER BY pinned DESC, updated_at DESC
    LIMIT $2;
  `;
  const res = await pool.query(q, [userId, limit]);
  return res.rows;
}

export async function updateNote(userId, id, { title, body, category, mood }) {
  const q = `
    UPDATE notes SET title = $3, body = $4, category = $5, mood = $6, updated_at = NOW()
    WHERE id = $1 AND user_id = $2
    RETURNING *;
  `;
  const res = await pool.query(q, [id, userId, title, body, category, mood]);
  return res.rows[0] || null;
}

export async function togglePin(userId, id) {
  const q = `
    UPDATE notes SET pinned = NOT pinned, updated_at = NOW()
    WHERE id = $1 AND user_id = $2
    RETURNING *;
  `;
  const res = await pool.query(q, [id, userId]);
  return res.rows[0] || null;
}

export async function deleteNote(userId, id) {
  const q = `DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id;`;
  const res = await pool.query(q, [id, userId]);
  return res.rows[0] || null;
}

export async function deleteAllNotes(userId) {
  await pool.query(`DELETE FROM notes WHERE user_id = $1;`, [userId]);
}