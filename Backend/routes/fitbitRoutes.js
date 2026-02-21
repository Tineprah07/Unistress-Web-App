import { Router } from "express";
import * as Fitbit from "../controllers/fitbitController.js";

const router = Router();

// OAuth flow
router.get("/connect",    Fitbit.connect);        // Returns Fitbit auth URL
router.get("/callback",    Fitbit.callback);       // Handles OAuth callback
router.delete("/disconnect", Fitbit.disconnect);   // Remove Fitbit connection

// Status
router.get("/status",      Fitbit.status);         // Check if Fitbit is connected

// Data endpoints
router.get("/activity",    Fitbit.getActivityToday);  // Steps, calories, active minutes
router.get("/sleep",       Fitbit.getSleepToday);     // Sleep data
router.get("/steps",       Fitbit.getStepsRange);     // Steps over a date range
router.get("/heart-rate",  Fitbit.getHeartRate);       // Heart rate data
router.get("/profile",     Fitbit.getProfile);         // Fitbit profile info

export default router;