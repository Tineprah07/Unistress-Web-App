import express from "express";
import * as ctrl from "../controllers/exerciseController.js";
const router = express.Router();

router.post("/",       ctrl.create);     // POST   /api/exercise
router.get("/",        ctrl.getAll);     // GET    /api/exercise
router.get("/week",    ctrl.getWeek);    // GET    /api/exercise/week
router.delete("/:id",  ctrl.remove);     // DELETE /api/exercise/:id
router.delete("/",     ctrl.removeAll);  // DELETE /api/exercise

export default router;