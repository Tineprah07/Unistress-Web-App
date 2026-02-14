import * as Breathe from "../models/breatheModel.js";

export async function create(req, res) {
  try {
    const { technique, technique_name, cycles, duration_seconds } = req.body;
    if (!technique || !cycles || !duration_seconds) {
      return res.status(400).json({ error: "Technique, cycles, and duration are required." });
    }

    const entry = await Breathe.createBreatheSession(req.currentUser.id, {
      technique, technique_name, cycles: parseInt(cycles), duration_seconds: parseInt(duration_seconds)
    });
    res.status(201).json(entry);
  } catch (err) {
    console.error("Error in breathe create:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function getAll(req, res) {
  try {
    const entries = await Breathe.getBreatheSessions(req.currentUser.id, parseInt(req.query.limit) || 50);
    res.json(entries);
  } catch (err) {
    console.error("Error in breathe getAll:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function remove(req, res) {
  try {
    const deleted = await Breathe.deleteBreatheSession(req.currentUser.id, req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found." });
    res.json({ message: "Deleted." });
  } catch (err) {
    console.error("Error in breathe remove:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function removeAll(req, res) {
  try {
    await Breathe.deleteAllBreatheSessions(req.currentUser.id);
    res.json({ message: "All sessions cleared." });
  } catch (err) {
    console.error("Error in breathe removeAll:", err);
    res.status(500).json({ error: "Server error." });
  }
}