import * as Sleep from "../models/sleepModel.js";

export async function create(req, res) {
  try {
    const { bedtime, wake_time, duration_hours, quality, notes } = req.body;
    if (!bedtime || !wake_time || !duration_hours || !quality) {
      return res.status(400).json({ error: "Bedtime, wake time, duration, and quality are required." });
    }

    const entry = await Sleep.createSleepLog(req.currentUser.id, {
      bedtime, wake_time, duration_hours: parseFloat(duration_hours), quality: parseInt(quality), notes
    });
    res.status(201).json(entry);
  } catch (err) {
    console.error("Error in sleep create:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function getAll(req, res) {
  try {
    const entries = await Sleep.getSleepLogs(req.currentUser.id, parseInt(req.query.limit) || 50);
    res.json(entries);
  } catch (err) {
    console.error("Error in sleep getAll:", err);
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

    const entries = await Sleep.getSleepByDateRange(req.currentUser.id, start.toISOString(), end.toISOString());
    res.json(entries);
  } catch (err) {
    console.error("Error in sleep getWeek:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function remove(req, res) {
  try {
    const deleted = await Sleep.deleteSleepLog(req.currentUser.id, req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found." });
    res.json({ message: "Deleted." });
  } catch (err) {
    console.error("Error in sleep remove:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function removeAll(req, res) {
  try {
    await Sleep.deleteAllSleepLogs(req.currentUser.id);
    res.json({ message: "All sleep logs cleared." });
  } catch (err) {
    console.error("Error in sleep removeAll:", err);
    res.status(500).json({ error: "Server error." });
  }
}