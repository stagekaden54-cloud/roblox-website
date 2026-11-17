import test from "node:test";
import assert from "node:assert/strict";
import { handleD1Auth, validUsername, validPassword } from "../../worker/auth-d1.mjs";

function request(path, body, origin = "https://block16.test") {
  return new Request(`https://block16.test${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin, "cf-connecting-ip": "192.0.2.10" },
    body: JSON.stringify(body),
  });
}

test("username and password validation follow the account rules", () => {
  assert.equal(validUsername("Player_16"), true);
  assert.equal(validUsername("ab"), false);
  assert.equal(validUsername("not a username"), false);
  assert.equal(validPassword("long-enough-password"), true);
  assert.equal(validPassword("short"), false);
});

test("new D1 auth routes fail safely until a D1 binding is configured", async () => {
  const response = await handleD1Auth(request("/api/v2/auth/register", {}), {}, "/api/v2/auth/register");
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, "D1_NOT_CONFIGURED");
});

test("new D1 auth routes reject cross-origin writes", async () => {
  const response = await handleD1Auth(
    request("/api/v2/auth/register", { username: "player16", password: "long-enough-password" }, "https://example.invalid"),
    { DB: {} },
    "/api/v2/auth/register",
  );
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, "CROSS_SITE_REQUEST");
});

test("registration permits a missing email and returns one-time recovery codes", async () => {
  const statements = [];
  const DB = {
    prepare(sql) {
      return {
        bind(...values) {
          const statement = { sql, values };
          statements.push(statement);
          return {
            first: async () => ({ attempts: 1 }),
            run: async () => ({ success: true }),
          };
        },
      };
    },
    batch: async batch => {
      statements.push(...batch);
      return batch.map(() => ({ success: true }));
    },
  };
  const response = await handleD1Auth(
    request("/api/v2/auth/register", { username: "player16", password: "long-enough-password" }),
    { DB },
    "/api/v2/auth/register",
  );
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.profile.username, "player16");
  assert.equal(body.recovery_codes.length, 10);
  assert.equal(new Set(body.recovery_codes).size, 10);
  assert.ok(body.recovery_codes.every(code => /^[0-9A-F]{32}$/.test(code)));
  assert.match(response.headers.get("set-cookie") || "", /HttpOnly/);
  assert.match(response.headers.get("set-cookie") || "", /Secure/);
  assert.match(response.headers.get("set-cookie") || "", /SameSite=Strict/);
  assert.ok(statements.some(statement => statement.sql?.includes("INSERT INTO players") && statement.values?.[1] === null));
  assert.ok(statements.some(statement => statement.sql?.includes("INSERT INTO account_credentials")));
  assert.equal(JSON.stringify(body).includes("password_hash"), false);
});

test("malformed registration JSON returns a client error", async () => {
  const response = await handleD1Auth(
    new Request("https://block16.test/api/v2/auth/register", {
      method: "POST",
      headers: { origin: "https://block16.test", "content-type": "application/json" },
      body: "{",
    }),
    { DB: {} },
    "/api/v2/auth/register",
  );
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "INVALID_JSON");
});
