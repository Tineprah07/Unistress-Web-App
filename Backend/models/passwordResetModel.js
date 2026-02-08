import pool from "../db/pool.js";

export async function createResetToken(userId, tokenHash, expiresAt) {
  const q = `
    INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
    VALUES ($1, $2, $3)
    RETURNING id;
  `;
  const res = await pool.query(q, [userId, tokenHash, expiresAt]);
  return res.rows[0];
}

export async function findValidResetToken(tokenHash) {
  const q = `
    SELECT id, user_id, expires_at
    FROM password_reset_tokens
    WHERE token_hash = $1 
      AND used = FALSE 
      AND expires_at > NOW() -- Automatically checks if token is still valid
    LIMIT 1;
  `;
  const res = await pool.query(q, [tokenHash]);
  return res.rows[0] || null;
}
export async function markTokenUsed(tokenId) {
  const q = `UPDATE password_reset_tokens SET used = TRUE WHERE id = $1;`;
  await pool.query(q, [tokenId]);
}

export async function invalidateActiveTokensForUser(userId) {
  const q = `
    UPDATE password_reset_tokens
    SET used = TRUE
    WHERE user_id = $1 AND used = FALSE;
  `;
  await pool.query(q, [userId]);
}
