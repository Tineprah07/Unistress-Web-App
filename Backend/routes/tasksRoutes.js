import express from "express";
import * as ctrl from "../controllers/tasksController.js";
const router = express.Router();

router.post("/",              ctrl.create);    // POST   /api/tasks
router.get("/",               ctrl.getAll);    // GET    /api/tasks
router.patch("/:id/toggle",   ctrl.toggle);    // PATCH  /api/tasks/:id/toggle
router.delete("/:id",         ctrl.remove);    // DELETE /api/tasks/:id
router.delete("/",            ctrl.removeAll); // DELETE /api/tasks

export default router;