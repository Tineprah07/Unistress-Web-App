import pool from "../db/pool.js";

export async function getWbScore(userId) {
  const res = await pool.query(
    `SELECT score AS wb_score, score_date AS wb_score_date
     FROM wellbeing_scores WHERE user_id = $1;`,
    [userId]
  );
  return res.rows[0] || null;
}

export async function saveWbScore(userId, score) {
  const res = await pool.query(
    `INSERT INTO wellbeing_scores (user_id, score, score_date, updated_at)
     VALUES ($1, $2, CURRENT_DATE, NOW())
     ON CONFLICT (user_id) DO UPDATE
       SET score = EXCLUDED.score,
           score_date = CURRENT_DATE,
           updated_at = NOW()
     RETURNING score AS wb_score, score_date AS wb_score_date;`,
    [userId, score]
  );
  return res.rows[0] || null;
}
