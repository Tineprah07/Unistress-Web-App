import express from "express";
import * as ctrl from "../controllers/notesController.js";
const router = express.Router();

router.post("/",            ctrl.create);      // POST   /api/notes
router.get("/",             ctrl.getAll);      // GET    /api/notes
router.put("/:id",          ctrl.update);      // PUT    /api/notes/:id
router.patch("/:id/pin",    ctrl.togglePin);   // PATCH  /api/notes/:id/pin
router.delete("/:id",       ctrl.remove);      // DELETE /api/notes/:id
router.delete("/",          ctrl.removeAll);   // DELETE /api/notes

export default router;