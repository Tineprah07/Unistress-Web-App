import express from "express";
import * as ctrl from "../controllers/summaryController.js";
const router = express.Router();

router.get("/daily",   ctrl.daily);   // GET /api/summary/daily
router.get("/weekly",  ctrl.weekly);  // GET /api/summary/weekly

export default router;