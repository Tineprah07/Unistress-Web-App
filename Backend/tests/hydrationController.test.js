import test from "node:test";
import assert from "node:assert/strict";

import { create } from "../controllers/hydrationController.js";

function makeRes() {
  return {
    code: 200,
    body: null,
    status(code) { this.code = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

test("returns 400 when glasses is missing", async () => {
  const req = { currentUser: { id: 1 }, body: {} };
  const res = makeRes();

  await create(req, res);

  assert.equal(res.code, 400);
  assert.equal(res.body?.error, "Glasses must be at least 1.");
});

test("returns 400 when glasses is 0", async () => {
  const req = { currentUser: { id: 1 }, body: { glasses: 0 } };
  const res = makeRes();

  await create(req, res);

  assert.equal(res.code, 400);
  assert.equal(res.body?.error, "Glasses must be at least 1.");
});
