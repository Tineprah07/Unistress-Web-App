import express from "express";
import { getGoals, saveGoals } from "../controllers/goalsController.js";
const router = express.Router();

router.get("/", getGoals);
router.put("/", saveGoals);

export default router;
