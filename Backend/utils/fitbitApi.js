// -------------------------
// Fitbit API Helper
// -------------------------
// Handles authenticated requests to Fitbit Web API,
// including automatic token refresh when expired.

import { getFitbitTokens, updateFitbitTokens } from "../models/fitbitModel.js";

const FITBIT_TOKEN_URL = "https://api.fitbit.com/oauth2/token";
const FITBIT_API_BASE = "https://api.fitbit.com";

// Refresh an expired access token using the refresh token
async function refreshAccessToken(userId, refreshToken) {
  const clientId = process.env.FITBIT_CLIENT_ID;
  const clientSecret = process.env.FITBIT_CLIENT_SECRET;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(FITBIT_TOKEN_URL, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("Fitbit token refresh failed:", err);
    throw new Error("Failed to refresh Fitbit token");
  }

  const data = await res.json();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  // Save the new tokens
  await updateFitbitTokens(userId, {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: expiresAt,
  });

  return data.access_token;
}

// Make an authenticated request to the Fitbit API
// Automatically refreshes the token if expired
export async function fitbitApiRequest(userId, endpoint) {
  const tokens = await getFitbitTokens(userId);
  if (!tokens) throw new Error("Fitbit not connected");

  let accessToken = tokens.access_token;

  // Check if token is expired (with 5-minute buffer)
  const now = new Date();
  const expiresAt = new Date(tokens.expires_at);
  if (now >= new Date(expiresAt.getTime() - 5 * 60 * 1000)) {
    accessToken = await refreshAccessToken(userId, tokens.refresh_token);
  }

  const url = endpoint.startsWith("http") ? endpoint : `${FITBIT_API_BASE}${endpoint}`;

  const res = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Accept": "application/json",
    },
  });

  if (res.status === 401) {
    // Token might have been revoked — try one more refresh
    try {
      accessToken = await refreshAccessToken(userId, tokens.refresh_token);
      const retry = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json",
        },
      });
      if (!retry.ok) throw new Error(`Fitbit API error: ${retry.status}`);
      return retry.json();
    } catch (e) {
      throw new Error("Fitbit authorisation expired. Please reconnect.");
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("Fitbit API error:", res.status, err);
    throw new Error(`Fitbit API error: ${res.status}`);
  }

  return res.json();
}

// Helper: Get today's date in YYYY-MM-DD format
export function todayStr() {
  return new Date().toISOString().split("T")[0];
}