// -------------------------
// Fitbit API Helper
// -------------------------
// Handles authenticated requests to Fitbit Web API,
// including automatic token refresh when expired.

import { getFitbitTokens, updateFitbitTokens } from "../models/fitbitModel.js";

const FITBIT_TOKEN_URL = "https://api.fitbit.com/oauth2/token";
const FITBIT_API_BASE = "https://api.fitbit.com";

// In-flight refresh promises keyed by userId — prevents concurrent refresh races
const pendingRefreshes = new Map();

// ── Response cache ──
// Caches Fitbit API responses per user+endpoint for a short window
// to avoid burning through the 150 requests/hour rate limit.
const responseCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function cacheKey(userId, endpoint) {
  return `${userId}::${endpoint}`;
}

function getCached(userId, endpoint) {
  const key = cacheKey(userId, endpoint);
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    responseCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(userId, endpoint, data) {
  responseCache.set(cacheKey(userId, endpoint), { data, ts: Date.now() });
}

// Clear cache for a user (e.g. on disconnect)
export function clearFitbitCache(userId) {
  for (const key of responseCache.keys()) {
    if (key.startsWith(`${userId}::`)) responseCache.delete(key);
  }
}

// Refresh an expired access token using the refresh token.
// If a refresh is already in-flight for this user, reuse that promise.
function refreshAccessToken(userId, refreshToken) {
  if (pendingRefreshes.has(userId)) {
    return pendingRefreshes.get(userId);
  }

  const promise = _doRefresh(userId, refreshToken).finally(() => {
    pendingRefreshes.delete(userId);
  });

  pendingRefreshes.set(userId, promise);
  return promise;
}

async function _doRefresh(userId, refreshToken) {
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
// Automatically refreshes the token if expired.
// Uses an in-memory cache to avoid hitting Fitbit's 150 req/hr rate limit.
export async function fitbitApiRequest(userId, endpoint, { bypassCache = false } = {}) {
  // Check cache first
  if (!bypassCache) {
    const cached = getCached(userId, endpoint);
    if (cached) return cached;
  }

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
      const data = await retry.json();
      setCache(userId, endpoint, data);
      return data;
    } catch (e) {
      throw new Error("Fitbit authorisation expired. Please reconnect.");
    }
  }

  if (res.status === 429) {
    // Rate limited — return cached data if available, otherwise throw
    const stale = getCached(userId, endpoint);
    if (stale) return stale;
    const retryAfter = res.headers.get("Retry-After") || "unknown";
    console.warn(`Fitbit rate limited (429). Retry-After: ${retryAfter}s`);
    throw new Error("Fitbit rate limit reached. Please wait a few minutes.");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("Fitbit API error:", res.status, err);
    throw new Error(`Fitbit API error: ${res.status}`);
  }

  const data = await res.json();
  setCache(userId, endpoint, data);
  return data;
}

// Helper: Get today's date in YYYY-MM-DD format
export function todayStr() {
  return new Date().toISOString().split("T")[0];
}
