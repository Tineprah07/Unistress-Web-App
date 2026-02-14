import * as Tasks from "../models/tasksModel.js";

export async function create(req, res) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "Task name is required." });

    const entry = await Tasks.createTask(req.currentUser.id, { name: name.trim() });
    res.status(201).json(entry);
  } catch (err) {
    console.error("Error in tasks create:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function getAll(req, res) {
  try {
    const entries = await Tasks.getTasks(req.currentUser.id);
    res.json(entries);
  } catch (err) {
    console.error("Error in tasks getAll:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function toggle(req, res) {
  try {
    const entry = await Tasks.toggleTask(req.currentUser.id, req.params.id);
    if (!entry) return res.status(404).json({ error: "Not found." });
    res.json(entry);
  } catch (err) {
    console.error("Error in tasks toggle:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function remove(req, res) {
  try {
    const deleted = await Tasks.deleteTask(req.currentUser.id, req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found." });
    res.json({ message: "Deleted." });
  } catch (err) {
    console.error("Error in tasks remove:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function removeAll(req, res) {
  try {
    await Tasks.deleteAllTasks(req.currentUser.id);
    res.json({ message: "All tasks cleared." });
  } catch (err) {
    console.error("Error in tasks removeAll:", err);
    res.status(500).json({ error: "Server error." });
  }
}