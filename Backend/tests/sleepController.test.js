import test from "node:test";
import assert from "node:assert/strict";

import { create } from "../controllers/sleepController.js";

function makeRes() {
  return {
    code: 200,
    body: null,
    status(code) { this.code = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

test("returns 400 when required fields are missing", async () => {
  const req = {
    currentUser: { id: 1 },
    body: { bedtime: "23:00", wake_time: "07:00" },
  };
  const res = makeRes();

  await create(req, res);

  assert.equal(res.code, 400);
  assert.equal(res.body?.error, "Bedtime, wake time, duration, and quality are required.");
});
