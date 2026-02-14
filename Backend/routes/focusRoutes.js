import express from "express";
import * as ctrl from "../controllers/focusController.js";
const router = express.Router();

router.post("/",       ctrl.create);     // POST   /api/focus
router.get("/",        ctrl.getAll);     // GET    /api/focus
router.get("/week",    ctrl.getWeek);    // GET    /api/focus/week
router.delete("/:id",  ctrl.remove);     // DELETE /api/focus/:id
router.delete("/",     ctrl.removeAll);  // DELETE /api/focus

export default router;