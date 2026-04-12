import test from "node:test";
import assert from "node:assert/strict";

import { create } from "../controllers/notesController.js";

function makeRes() {
  return {
    code: 200,
    body: null,
    status(code) { this.code = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

test("returns 400 when title is missing", async () => {
  const req = { currentUser: { id: 1 }, body: { body: "Some content" } };
  const res = makeRes();

  await create(req, res);

  assert.equal(res.code, 400);
  assert.equal(res.body?.error, "Title and body are required.");
});

test("returns 400 when body is missing", async () => {
  const req = { currentUser: { id: 1 }, body: { title: "My Note" } };
  const res = makeRes();

  await create(req, res);

  assert.equal(res.code, 400);
  assert.equal(res.body?.error, "Title and body are required.");
});
