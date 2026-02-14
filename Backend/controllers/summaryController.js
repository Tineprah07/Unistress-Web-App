import { getDailySummary, getWeeklySummary } from "../models/dailySummaryModel.js";

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