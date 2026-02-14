import express from "express";
import * as ctrl from "../controllers/hydrationController.js";
const router = express.Router();

router.post("/",       ctrl.create);     // POST   /api/hydration
router.get("/",        ctrl.getAll);     // GET    /api/hydration
router.get("/today",   ctrl.getToday);   // GET    /api/hydration/today
router.get("/week",    ctrl.getWeek);    // GET    /api/hydration/week
router.delete("/:id",  ctrl.remove);     // DELETE /api/hydration/:id
router.delete("/",     ctrl.removeAll);  // DELETE /api/hydration

export default router;