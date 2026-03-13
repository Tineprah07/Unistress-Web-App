import pool from "../db/pool.js";

const DEFAULTS = {
  exercise_weekly_min: 150,
  sleep_hours: 8.0,
  hydration_daily_glasses: 8,
  focus_weekly_min: 120,
  focus_daily_sessions: 4,
  stress_daily_checkins: 3
};

export async function getUserGoals(userId) {
  const res = await pool.query(`SELECT * FROM user_goals WHERE user_id = $1;`, [userId]);
  if (res.rows[0]) return res.rows[0];
  return { user_id: userId, ...DEFAULTS };
}

export async function updateUserGoals(userId, goals) {
  // First get existing goals so partial updates keep other fields
  const existing = await getUserGoals(userId);
  const res = await pool.query(`
    INSERT INTO user_goals (user_id, exercise_weekly_min, sleep_hours, hydration_daily_glasses, focus_weekly_min, focus_daily_sessions, stress_daily_checkins, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      exercise_weekly_min   = $2,
      sleep_hours           = $3,
      hydration_daily_glasses = $4,
      focus_weekly_min      = $5,
      focus_daily_sessions  = $6,
      stress_daily_checkins = $7,
      updated_at            = NOW()
    RETURNING *;
  `, [
    userId,
    goals.exercise_weekly_min    ?? existing.exercise_weekly_min,
    goals.sleep_hours            ?? existing.sleep_hours,
    goals.hydration_daily_glasses ?? existing.hydration_daily_glasses,
    goals.focus_weekly_min       ?? existing.focus_weekly_min,
    goals.focus_daily_sessions   ?? existing.focus_daily_sessions,
    goals.stress_daily_checkins  ?? existing.stress_daily_checkins
  ]);
  return res.rows[0];
}
