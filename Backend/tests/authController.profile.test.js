import test from "node:test";
import assert from "node:assert/strict";

import {
  getCurrentUser,
  updateCurrentUserProfile,
} from "../controllers/authController.js";

function makeRes() {
  return {
    code: 200,
    body: null,
    status(code) {
      this.code = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test("getCurrentUser returns 401 when no user session exists", async () => {
  const req = { user: null, session: null };
  const res = makeRes();

  await getCurrentUser(req, res);

  assert.equal(res.code, 401);
  assert.equal(res.body?.error, "Not logged in.");
});

test("updateCurrentUserProfile returns 401 when unauthenticated", async () => {
  const req = { user: null, session: null, body: {} };
  const res = makeRes();

  await updateCurrentUserProfile(req, res);

  assert.equal(res.code, 401);
  assert.equal(res.body?.error, "Not logged in.");
});

test("updateCurrentUserProfile validates required name", async () => {
  const req = {
    user: { id: 1, name: "Test", email: "t@example.com" },
    session: { user: { id: 1, name: "Test", email: "t@example.com" } },
    body: { name: "   ", handle: "valid_handle", avatar_color: "#112233" },
  };
  const res = makeRes();

  await updateCurrentUserProfile(req, res);

  assert.equal(res.code, 400);
  assert.equal(res.body?.error, "Name is required.");
});

test("updateCurrentUserProfile validates handle characters", async () => {
  const req = {
    user: { id: 1, name: "Test", email: "t@example.com" },
    session: { user: { id: 1, name: "Test", email: "t@example.com" } },
    body: { name: "Valid Name", handle: "bad handle!", avatar_color: "#112233" },
  };
  const res = makeRes();

  await updateCurrentUserProfile(req, res);

  assert.equal(res.code, 400);
  assert.equal(
    res.body?.error,
    "Handle can only contain letters, numbers, dot, underscore, or hyphen."
  );
});
