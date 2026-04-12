import test from "node:test";
import assert from "node:assert/strict";

import { create } from "../controllers/focusController.js";

function makeRes() {
  return {
    code: 200,
    body: null,
    status(code) { this.code = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

test("returns 400 when duration_minutes is missing", async () => {
  const req = { currentUser: { id: 1 }, body: {} };
  const res = makeRes();

  await create(req, res);

  assert.equal(res.code, 400);
  assert.equal(res.body?.error, "Duration is required.");
});

test("returns 400 when duration_minutes is 0", async () => {
  const req = { currentUser: { id: 1 }, body: { duration_minutes: 0 } };
  const res = makeRes();

  await create(req, res);

  assert.equal(res.code, 400);
  assert.equal(res.body?.error, "Duration is required.");
});
