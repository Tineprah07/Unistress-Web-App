import express from "express";
import * as ctrl from "../controllers/breatheController.js";
const router = express.Router();

router.post("/",       ctrl.create);     // POST   /api/breathe
router.get("/",        ctrl.getAll);     // GET    /api/breathe
router.delete("/:id",  ctrl.remove);     // DELETE /api/breathe/:id
router.delete("/",     ctrl.removeAll);  // DELETE /api/breathe

export default router;