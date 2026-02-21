// -------------------------
// Fitbit Controller
// -------------------------
// Handles: OAuth connect/callback, disconnect, status check,
// and fetching activity/sleep/steps data from Fitbit Web API.

import * as FitbitModel from "../models/fitbitModel.js";
import { fitbitApiRequest, todayStr } from "../utils/fitbitApi.js";

const FITBIT_AUTH_URL = "https://www.fitbit.com/oauth2/authorize";
const FITBIT_TOKEN_URL = "https://api.fitbit.com/oauth2/token";

// =============================
// OAuth: Redirect user to Fitbit to grant permission
// =============================
export function connect(req, res) {
  const clientId = process.env.FITBIT_CLIENT_ID;
  const redirectUri = process.env.FITBIT_REDIRECT_URI;
  const scope = "activity sleep heartrate profile";

  const authUrl = `${FITBIT_AUTH_URL}?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&expires_in=604800`;

  res.json({ url: authUrl });
}

// =============================
// OAuth: Handle callback from Fitbit
// =============================
export async function callback(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).send("Missing authorisation code.");

  const userId = req.currentUser?.id || req.session?.user?.id || req.user?.id;
  if (!userId) return res.redirect("/views/auth.html");

  const clientId = process.env.FITBIT_CLIENT_ID;
  const clientSecret = process.env.FITBIT_CLIENT_SECRET;
  const redirectUri = process.env.FITBIT_REDIRECT_URI;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {
    // Exchange authorisation code for tokens
    const tokenRes = await fetch(FITBIT_TOKEN_URL, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.json().catch(() => ({}));
      console.error("Fitbit token exchange failed:", err);
      return res.status(400).send("Failed to connect Fitbit. Please try again.");
    }

    const data = await tokenRes.json();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    // Save tokens to database
    await FitbitModel.saveFitbitTokens(userId, {
      fitbit_user_id: data.user_id,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type,
      expires_at: expiresAt,
      scope: data.scope,
    });

    // Redirect back to the app (exercise page or homepage)
    res.redirect("/views/exercise.html?fitbit=connected");

  } catch (err) {
    console.error("Fitbit callback error:", err);
    res.status(500).send("Server error during Fitbit connection.");
  }
}

// =============================
// Disconnect Fitbit
// =============================
export async function disconnect(req, res) {
  try {
    await FitbitModel.deleteFitbitTokens(req.currentUser.id);
    res.json({ message: "Fitbit disconnected." });
  } catch (err) {
    console.error("Fitbit disconnect error:", err);
    res.status(500).json({ error: "Server error." });
  }
}

// =============================
// Check Fitbit connection status
// =============================
export async function status(req, res) {
  try {
    const connection = await FitbitModel.isFitbitConnected(req.currentUser.id);
    res.json({
      connected: !!connection,
      fitbit_user_id: connection?.fitbit_user_id || null,
    });
  } catch (err) {
    console.error("Fitbit status error:", err);
    res.status(500).json({ error: "Server error." });
  }
}

// =============================
// Get today's activity summary (steps, calories, active minutes)
// =============================
export async function getActivityToday(req, res) {
  try {
    const date = req.query.date || todayStr();
    const data = await fitbitApiRequest(req.currentUser.id, `/1/user/-/activities/date/${date}.json`);
    
    res.json({
      date,
      steps: data.summary?.steps || 0,
      calories: data.summary?.caloriesOut || 0,
      active_minutes: (data.summary?.fairlyActiveMinutes || 0) + (data.summary?.veryActiveMinutes || 0),
      lightly_active_minutes: data.summary?.lightlyActiveMinutes || 0,
      sedentary_minutes: data.summary?.sedentaryMinutes || 0,
      distances: data.summary?.distances || [],
    });
  } catch (err) {
    console.error("Fitbit activity error:", err);
    res.status(err.message.includes("not connected") ? 400 : 500).json({ error: err.message });
  }
}

// =============================
// Get today's sleep data
// =============================
export async function getSleepToday(req, res) {
  try {
    const date = req.query.date || todayStr();
    const data = await fitbitApiRequest(req.currentUser.id, `/1.2/user/-/sleep/date/${date}.json`);

    const mainSleep = data.sleep?.find(s => s.isMainSleep) || data.sleep?.[0];

    res.json({
      date,
      total_minutes: data.summary?.totalMinutesAsleep || 0,
      total_hours: data.summary?.totalMinutesAsleep ? (data.summary.totalMinutesAsleep / 60).toFixed(1) : "0",
      time_in_bed: data.summary?.totalTimeInBed || 0,
      efficiency: mainSleep?.efficiency || 0,
      start_time: mainSleep?.startTime || null,
      end_time: mainSleep?.endTime || null,
      stages: data.summary?.stages || null,
    });
  } catch (err) {
    console.error("Fitbit sleep error:", err);
    res.status(err.message.includes("not connected") ? 400 : 500).json({ error: err.message });
  }
}

// =============================
// Get step count for a date range (for charts)
// =============================
export async function getStepsRange(req, res) {
  try {
    const start = req.query.start || todayStr();
    const end = req.query.end || todayStr();
    const data = await fitbitApiRequest(req.currentUser.id, `/1/user/-/activities/steps/date/${start}/${end}.json`);

    const steps = (data["activities-steps"] || []).map(d => ({
      date: d.dateTime,
      steps: parseInt(d.value) || 0,
    }));

    res.json(steps);
  } catch (err) {
    console.error("Fitbit steps range error:", err);
    res.status(err.message.includes("not connected") ? 400 : 500).json({ error: err.message });
  }
}

// =============================
// Get heart rate data for today
// =============================
export async function getHeartRate(req, res) {
  try {
    const date = req.query.date || todayStr();
    const data = await fitbitApiRequest(req.currentUser.id, `/1/user/-/activities/heart/date/${date}/1d.json`);

    const heartRate = data["activities-heart"]?.[0]?.value;

    res.json({
      date,
      resting_heart_rate: heartRate?.restingHeartRate || null,
      zones: heartRate?.heartRateZones || [],
    });
  } catch (err) {
    console.error("Fitbit heart rate error:", err);
    res.status(err.message.includes("not connected") ? 400 : 500).json({ error: err.message });
  }
}

// =============================
// Get Fitbit profile info
// =============================
export async function getProfile(req, res) {
  try {
    const data = await fitbitApiRequest(req.currentUser.id, `/1/user/-/profile.json`);

    res.json({
      display_name: data.user?.displayName || "",
      avatar: data.user?.avatar || "",
      member_since: data.user?.memberSince || "",
      age: data.user?.age || null,
    });
  } catch (err) {
    console.error("Fitbit profile error:", err);
    res.status(err.message.includes("not connected") ? 400 : 500).json({ error: err.message });
  }
}