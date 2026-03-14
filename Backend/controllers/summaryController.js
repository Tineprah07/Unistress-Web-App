import { getDailySummary, getWeeklySummary } from "../models/dailySummaryModel.js";
import { getWbScore, saveWbScore } from "../models/wellbeingModel.js";

export async function daily(req, res) {
  try {
    const summary = await getDailySummary(req.currentUser.id);
    res.json(summary);
  } catch (err) {
    console.error("Error in summary daily:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function weekly(req, res) {
  try {
    const summary = await getWeeklySummary(req.currentUser.id);
    res.json(summary);
  } catch (err) {
    console.error("Error in summary weekly:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function getWellbeing(req, res) {
  try {
    const row = await getWbScore(req.currentUser.id);
    if (!row || row.wb_score === null) return res.json({ score: null, date: null });
    res.json({ score: row.wb_score, date: row.wb_score_date });
  } catch (err) {
    console.error("Error in getWellbeing:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function saveWellbeing(req, res) {
  try {
    const score = parseInt(req.body.score, 10);
    if (isNaN(score) || score < 0 || score > 100) {
      return res.status(400).json({ error: "Invalid score." });
    }
    const row = await saveWbScore(req.currentUser.id, score);
    res.json({ score: row.wb_score, date: row.wb_score_date });
  } catch (err) {
    console.error("Error in saveWellbeing:", err);
    res.status(500).json({ error: "Server error." });
  }
}
