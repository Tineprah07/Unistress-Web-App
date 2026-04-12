import test from "node:test";
import assert from "node:assert/strict";

import { create } from "../controllers/exerciseController.js";

function makeRes() {
  return {
    code: 200,
    body: null,
    status(code) { this.code = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

test("returns 400 when exercise_type is missing", async () => {
  const req = { currentUser: { id: 1 }, body: { duration: 30 } };
  const res = makeRes();

  await create(req, res);

  assert.equal(res.code, 400);
  assert.equal(res.body?.error, "Type and duration are required.");
});

test("returns 400 when duration is missing", async () => {
  const req = { currentUser: { id: 1 }, body: { exercise_type: "running" } };
  const res = makeRes();

  await create(req, res);

  assert.equal(res.code, 400);
  assert.equal(res.body?.error, "Type and duration are required.");
});

test("returns 400 when duration is 0", async () => {
  const req = { currentUser: { id: 1 }, body: { exercise_type: "running", duration: 0 } };
  const res = makeRes();

  await create(req, res);

  assert.equal(res.code, 400);
  assert.equal(res.body?.error, "Type and duration are required.");
});

test("returns 400 when duration is 301 (exceeds max)", async () => {
  const req = { currentUser: { id: 1 }, body: { exercise_type: "running", duration: 301 } };
  const res = makeRes();

  await create(req, res);

  assert.equal(res.code, 400);
  assert.equal(res.body?.error, "Duration must be 1-300 minutes.");
});
