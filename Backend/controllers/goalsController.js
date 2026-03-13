import { getUserGoals, updateUserGoals } from "../models/goalsModel.js";

export async function getGoals(req, res) {
  try {
    const goals = await getUserGoals(req.currentUser.id);
    res.json(goals);
  } catch (err) {
    console.error("Error in getGoals:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function saveGoals(req, res) {
  try {
    const updated = await updateUserGoals(req.currentUser.id, req.body);
    res.json(updated);
  } catch (err) {
    console.error("Error in saveGoals:", err);
    res.status(500).json({ error: "Server error." });
  }
}
