import test from "node:test";
import assert from "node:assert/strict";

import { create } from "../controllers/remindersController.js";

function makeRes() {
  return {
    code: 200,
    body: null,
    status(code) { this.code = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

test("returns 400 when text is missing", async () => {
  const req = { currentUser: { id: 1 }, body: { due_date: "2026-05-01" } };
  const res = makeRes();

  await create(req, res);

  assert.equal(res.code, 400);
  assert.equal(res.body?.error, "Text and date are required.");
});

test("returns 400 when due_date is missing", async () => {
  const req = { currentUser: { id: 1 }, body: { text: "Drink water" } };
  const res = makeRes();

  await create(req, res);

  assert.equal(res.code, 400);
  assert.equal(res.body?.error, "Text and date are required.");
});
