import * as Notes from "../models/notesModel.js";

export async function create(req, res) {
  try {
    const { title, body, category, mood } = req.body;
    if (!title || !body) return res.status(400).json({ error: "Title and body are required." });

    const entry = await Notes.createNote(req.currentUser.id, { title, body, category, mood });
    res.status(201).json(entry);
  } catch (err) {
    console.error("Error in notes create:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function getAll(req, res) {
  try {
    const entries = await Notes.getNotes(req.currentUser.id, parseInt(req.query.limit) || 100);
    res.json(entries);
  } catch (err) {
    console.error("Error in notes getAll:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function update(req, res) {
  try {
    const { title, body, category, mood } = req.body;
    if (!title || !body) return res.status(400).json({ error: "Title and body are required." });

    const entry = await Notes.updateNote(req.currentUser.id, req.params.id, { title, body, category, mood });
    if (!entry) return res.status(404).json({ error: "Not found." });
    res.json(entry);
  } catch (err) {
    console.error("Error in notes update:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function togglePin(req, res) {
  try {
    const entry = await Notes.togglePin(req.currentUser.id, req.params.id);
    if (!entry) return res.status(404).json({ error: "Not found." });
    res.json(entry);
  } catch (err) {
    console.error("Error in notes togglePin:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function remove(req, res) {
  try {
    const deleted = await Notes.deleteNote(req.currentUser.id, req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found." });
    res.json({ message: "Deleted." });
  } catch (err) {
    console.error("Error in notes remove:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function removeAll(req, res) {
  try {
    await Notes.deleteAllNotes(req.currentUser.id);
    res.json({ message: "All notes cleared." });
  } catch (err) {
    console.error("Error in notes removeAll:", err);
    res.status(500).json({ error: "Server error." });
  }
}