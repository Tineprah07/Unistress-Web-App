import * as Reminders from "../models/remindersModel.js";

export async function create(req, res) {
  try {
    const { text, due_date, due_time, category, repeat, priority } = req.body;
    if (!text || !due_date) return res.status(400).json({ error: "Text and date are required." });

    const entry = await Reminders.createReminder(req.currentUser.id, { text, due_date, due_time, category, repeat, priority });
    res.status(201).json(entry);
  } catch (err) {
    console.error("Error in reminders create:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function getAll(req, res) {
  try {
    const entries = await Reminders.getReminders(req.currentUser.id);
    res.json(entries);
  } catch (err) {
    console.error("Error in reminders getAll:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function update(req, res) {
  try {
    const { text, due_date, due_time, category, repeat, priority } = req.body;
    if (!text || !due_date) return res.status(400).json({ error: "Text and date are required." });

    const entry = await Reminders.updateReminder(req.currentUser.id, req.params.id, { text, due_date, due_time, category, repeat, priority });
    if (!entry) return res.status(404).json({ error: "Not found." });
    res.json(entry);
  } catch (err) {
    console.error("Error in reminders update:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function toggleComplete(req, res) {
  try {
    const entry = await Reminders.toggleComplete(req.currentUser.id, req.params.id);
    if (!entry) return res.status(404).json({ error: "Not found." });
    res.json(entry);
  } catch (err) {
    console.error("Error in reminders toggleComplete:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function remove(req, res) {
  try {
    const deleted = await Reminders.deleteReminder(req.currentUser.id, req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found." });
    res.json({ message: "Deleted." });
  } catch (err) {
    console.error("Error in reminders remove:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function removeCompleted(req, res) {
  try {
    await Reminders.deleteCompletedReminders(req.currentUser.id);
    res.json({ message: "Completed reminders cleared." });
  } catch (err) {
    console.error("Error in reminders removeCompleted:", err);
    res.status(500).json({ error: "Server error." });
  }
}