import * as Stress from "../models/stressModel.js";

export async function create(req, res) {
  try {
    const { stress_level, mood, mood_emoji, triggers, notes } = req.body;
    if (!stress_level || !mood) return res.status(400).json({ error: "Stress level and mood are required." });
    if (stress_level < 1 || stress_level > 10) return res.status(400).json({ error: "Stress level must be 1-10." });

    const entry = await Stress.createCheckin(req.currentUser.id, { stress_level, mood, mood_emoji, triggers, notes });
    res.status(201).json(entry);
  } catch (err) {
    console.error("Error in stress create:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function getAll(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const entries = await Stress.getCheckins(req.currentUser.id, limit);
    res.json(entries);
  } catch (err) {
    console.error("Error in stress getAll:", err);
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

    const entries = await Stress.getCheckinsByDateRange(req.currentUser.id, start.toISOString(), end.toISOString());
    res.json(entries);
  } catch (err) {
    console.error("Error in stress getWeek:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function remove(req, res) {
  try {
    const deleted = await Stress.deleteCheckin(req.currentUser.id, req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found." });
    res.json({ message: "Deleted." });
  } catch (err) {
    console.error("Error in stress remove:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function removeAll(req, res) {
  try {
    await Stress.deleteAllCheckins(req.currentUser.id);
    res.json({ message: "All check-ins cleared." });
  } catch (err) {
    console.error("Error in stress removeAll:", err);
    res.status(500).json({ error: "Server error." });
  }
}