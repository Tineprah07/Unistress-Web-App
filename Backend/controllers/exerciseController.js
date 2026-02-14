import * as Exercise from "../models/exerciseModel.js";

export async function create(req, res) {
  try {
    const { exercise_type, duration, intensity, notes } = req.body;
    if (!exercise_type || !duration) return res.status(400).json({ error: "Type and duration are required." });
    if (duration < 1 || duration > 300) return res.status(400).json({ error: "Duration must be 1-300 minutes." });

    const entry = await Exercise.createExercise(req.currentUser.id, { exercise_type, duration: parseInt(duration), intensity, notes });
    res.status(201).json(entry);
  } catch (err) {
    console.error("Error in exercise create:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function getAll(req, res) {
  try {
    const entries = await Exercise.getExercises(req.currentUser.id, parseInt(req.query.limit) || 50);
    res.json(entries);
  } catch (err) {
    console.error("Error in exercise getAll:", err);
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

    const entries = await Exercise.getExercisesByDateRange(req.currentUser.id, start.toISOString(), end.toISOString());
    res.json(entries);
  } catch (err) {
    console.error("Error in exercise getWeek:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function remove(req, res) {
  try {
    const deleted = await Exercise.deleteExercise(req.currentUser.id, req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found." });
    res.json({ message: "Deleted." });
  } catch (err) {
    console.error("Error in exercise remove:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function removeAll(req, res) {
  try {
    await Exercise.deleteAllExercises(req.currentUser.id);
    res.json({ message: "All exercises cleared." });
  } catch (err) {
    console.error("Error in exercise removeAll:", err);
    res.status(500).json({ error: "Server error." });
  }
}