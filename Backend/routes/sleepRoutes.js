import express from "express";
import * as ctrl from "../controllers/sleepController.js";
const router = express.Router();

router.post("/",       ctrl.create);     // POST   /api/sleep
router.get("/",        ctrl.getAll);     // GET    /api/sleep
router.get("/week",    ctrl.getWeek);    // GET    /api/sleep/week
router.delete("/:id",  ctrl.remove);     // DELETE /api/sleep/:id
router.delete("/",     ctrl.removeAll);  // DELETE /api/sleep

export default router;