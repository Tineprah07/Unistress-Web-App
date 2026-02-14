import pool from "../db/pool.js";

// Today's summary across all modules
export async function getDailySummary(userId) {
  const q = `
    SELECT
      (SELECT COUNT(*)::int FROM stress_checkins WHERE user_id = $1 AND created_at::date = CURRENT_DATE) AS stress_checkins_today,
      (SELECT ROUND(AVG(stress_level)::numeric, 1) FROM stress_checkins WHERE user_id = $1 AND created_at::date = CURRENT_DATE) AS avg_stress_today,
      (SELECT COALESCE(SUM(duration), 0)::int FROM exercise_logs WHERE user_id = $1 AND created_at::date = CURRENT_DATE) AS exercise_minutes_today,
      (SELECT COUNT(*)::int FROM exercise_logs WHERE user_id = $1 AND created_at::date = CURRENT_DATE) AS exercise_sessions_today,
      (SELECT duration_hours FROM sleep_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1) AS last_sleep_hours,
      (SELECT quality FROM sleep_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1) AS last_sleep_quality,
      (SELECT COALESCE(SUM(glasses), 0)::int FROM hydration_logs WHERE user_id = $1 AND created_at::date = CURRENT_DATE) AS glasses_today,
      (SELECT COALESCE(SUM(duration_minutes), 0)::int FROM focus_sessions WHERE user_id = $1 AND created_at::date = CURRENT_DATE AND mode = 'focus') AS focus_minutes_today,
      (SELECT COUNT(*)::int FROM focus_sessions WHERE user_id = $1 AND created_at::date = CURRENT_DATE AND mode = 'focus') AS focus_sessions_today,
      (SELECT COUNT(*)::int FROM breathe_sessions WHERE user_id = $1 AND created_at::date = CURRENT_DATE) AS breathe_sessions_today,
      (SELECT COUNT(*)::int FROM notes WHERE user_id = $1 AND created_at::date = CURRENT_DATE) AS notes_today,
      (SELECT COUNT(*)::int FROM reminders WHERE user_id = $1 AND completed = FALSE AND due_date = CURRENT_DATE) AS reminders_due_today;
  `;
  const res = await pool.query(q, [userId]);
  return res.rows[0];
}

// Weekly summary (last 7 days)
export async function getWeeklySummary(userId) {
  const q = `
    SELECT
      (SELECT COALESCE(SUM(duration), 0)::int FROM exercise_logs WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days') AS exercise_minutes_week,
      (SELECT ROUND(AVG(stress_level)::numeric, 1) FROM stress_checkins WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days') AS avg_stress_week,
      (SELECT ROUND(AVG(duration_hours)::numeric, 1) FROM sleep_logs WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days') AS avg_sleep_week,
      (SELECT ROUND(AVG(daily_glasses)::numeric, 1) FROM (
        SELECT SUM(glasses) AS daily_glasses FROM hydration_logs
        WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY created_at::date
      ) sub) AS avg_glasses_week,
      (SELECT COALESCE(SUM(duration_minutes), 0)::int FROM focus_sessions WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days' AND mode = 'focus') AS focus_minutes_week;
  `;
  const res = await pool.query(q, [userId]);
  return res.rows[0];
}