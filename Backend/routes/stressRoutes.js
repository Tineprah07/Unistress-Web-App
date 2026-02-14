import express from "express";
import * as ctrl from "../controllers/stressController.js";
const router = express.Router();

router.post("/",       ctrl.create);     // POST   /api/stress
router.get("/",        ctrl.getAll);     // GET    /api/stress
router.get("/week",    ctrl.getWeek);    // GET    /api/stress/week
router.delete("/:id",  ctrl.remove);     // DELETE /api/stress/:id
router.delete("/",     ctrl.removeAll);  // DELETE /api/stress

export default router;