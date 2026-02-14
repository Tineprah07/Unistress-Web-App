import * as Focus from "../models/focusModel.js";

export async function create(req, res) {
  try {
    const { duration_minutes, mode } = req.body;
    if (!duration_minutes || duration_minutes < 1) return res.status(400).json({ error: "Duration is required." });

    const entry = await Focus.createFocusSession(req.currentUser.id, { duration_minutes: parseInt(duration_minutes), mode });
    res.status(201).json(entry);
  } catch (err) {
    console.error("Error in focus create:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function getAll(req, res) {
  try {
    const entries = await Focus.getFocusSessions(req.currentUser.id, parseInt(req.query.limit) || 50);
    res.json(entries);
  } catch (err) {
    console.error("Error in focus getAll:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function getWeek(req, res) {
  try {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    const entries = await Focus.getFocusByDateRange(req.currentUser.id, start.toISOString(), end.toISOString());
    res.json(entries);
  } catch (err) {
    console.error("Error in focus getWeek:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function remove(req, res) {
  try {
    const deleted = await Focus.deleteFocusSession(req.currentUser.id, req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found." });
    res.json({ message: "Deleted." });
  } catch (err) {
    console.error("Error in focus remove:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function removeAll(req, res) {
  try {
    await Focus.deleteAllFocusSessions(req.currentUser.id);
    res.json({ message: "All focus sessions cleared." });
  } catch (err) {
    console.error("Error in focus removeAll:", err);
    res.status(500).json({ error: "Server error." });
  }
}