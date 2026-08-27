import test from "node:test";
import assert from "node:assert/strict";

import { normalizeUserInput } from "./route";

test("normalizeUserInput trims and lowercases the email and defaults the role", () => {
  const payload = normalizeUserInput({
    name: "  Jordan Lee  ",
    email: " Jordan@Example.com ",
    password: "secret123",
    role: "  Manager  ",
  });

  assert.deepEqual(payload, {
    name: "Jordan Lee",
    email: "jordan@example.com",
    password: "secret123",
    role: "Manager",
  });
});

test("normalizeUserInput rejects invalid email or password input", () => {
  assert.throws(() => normalizeUserInput({
    name: "Jordan",
    email: "not-an-email",
    password: "short",
    role: "Administrator",
  }), /valid name, email, and password/i);
});
