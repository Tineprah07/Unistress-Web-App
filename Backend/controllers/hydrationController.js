import * as Hydration from "../models/hydrationModel.js";

export async function create(req, res) {
  try {
    const { glasses } = req.body;
    if (!glasses || glasses < 1) return res.status(400).json({ error: "Glasses must be at least 1." });

    const entry = await Hydration.createHydrationLog(req.currentUser.id, parseInt(glasses));
    res.status(201).json(entry);
  } catch (err) {
    console.error("Error in hydration create:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function getAll(req, res) {
  try {
    const entries = await Hydration.getHydrationLogs(req.currentUser.id, parseInt(req.query.limit) || 50);
    res.json(entries);
  } catch (err) {
    console.error("Error in hydration getAll:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function getToday(req, res) {
  try {
    const total = await Hydration.getTodayTotal(req.currentUser.id);
    res.json({ glasses_today: total });
  } catch (err) {
    console.error("Error in hydration getToday:", err);
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

    const entries = await Hydration.getHydrationByDateRange(req.currentUser.id, start.toISOString(), end.toISOString());
    res.json(entries);
  } catch (err) {
    console.error("Error in hydration getWeek:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function remove(req, res) {
  try {
    const deleted = await Hydration.deleteHydrationLog(req.currentUser.id, req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found." });
    res.json({ message: "Deleted." });
  } catch (err) {
    console.error("Error in hydration remove:", err);
    res.status(500).json({ error: "Server error." });
  }
}

export async function removeAll(req, res) {
  try {
    await Hydration.deleteAllHydrationLogs(req.currentUser.id);
    res.json({ message: "All hydration logs cleared." });
  } catch (err) {
    console.error("Error in hydration removeAll:", err);
    res.status(500).json({ error: "Server error." });
  }
}