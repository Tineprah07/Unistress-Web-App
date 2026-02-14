import express from "express";
import * as ctrl from "../controllers/remindersController.js";
const router = express.Router();

router.post("/",                ctrl.create);          // POST   /api/reminders
router.get("/",                 ctrl.getAll);          // GET    /api/reminders
router.put("/:id",              ctrl.update);          // PUT    /api/reminders/:id
router.patch("/:id/complete",   ctrl.toggleComplete);  // PATCH  /api/reminders/:id/complete
router.delete("/completed",     ctrl.removeCompleted); // DELETE /api/reminders/completed
router.delete("/:id",           ctrl.remove);          // DELETE /api/reminders/:id

export default router;