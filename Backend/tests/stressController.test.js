import test from "node:test";
import assert from "node:assert/strict";

import { create } from "../controllers/stressController.js";

function makeRes() {
  return {
    code: 200,
    body: null,
    status(code) { this.code = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

test("returns 400 when stress_level is missing", async () => {
  const req = { currentUser: { id: 1 }, body: {} };
  const res = makeRes();

  await create(req, res);

  assert.equal(res.code, 400);
  assert.equal(res.body?.error, "Stress level is required.");
});

test("returns 400 when stress_level is 0 (below valid range)", async () => {
  const req = { currentUser: { id: 1 }, body: { stress_level: 0 } };
  const res = makeRes();

  await create(req, res);

  assert.equal(res.code, 400);
  assert.equal(res.body?.error, "Stress level is required.");
});

test("returns 400 when stress_level is 15 (above valid range)", async () => {
  const req = { currentUser: { id: 1 }, body: { stress_level: 15 } };
  const res = makeRes();

  await create(req, res);

  assert.equal(res.code, 400);
  assert.equal(res.body?.error, "Stress level must be 1-10.");
});
