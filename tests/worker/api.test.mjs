import test from "node:test";
import assert from "node:assert/strict";
import worker from "../../worker/index.mjs";

const env = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "test-anon-key",
  ASSETS: { fetch: async () => new Response("static asset") },
};

test("health endpoint reports API status without leaking credentials", async () => {
  const response = await worker.fetch(new Request("https://block16.test/api/health"), env);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "ok",
    service: "block16-api",
    configured: true,
  });
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
});

test("unconfigured backend returns a safe 503 response", async () => {
  const response = await worker.fetch(
    new Request("https://block16.test/api/v1/games"),
    { ASSETS: env.ASSETS },
  );
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, "BACKEND_NOT_CONFIGURED");
});

test("registration validates input before contacting Supabase", async () => {
  const response = await worker.fetch(
    new Request("https://block16.test/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", password: "short", username: "x" }),
    }),
    env,
  );
  assert.equal(response.status, 400);
  assert.match((await response.json()).error.message, /valid email/i);
});

test("unknown API routes return JSON 404", async () => {
  const response = await worker.fetch(new Request("https://block16.test/api/v1/nope"), env);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, "NOT_FOUND");
});

test("non-API requests fall through to static assets", async () => {
  const response = await worker.fetch(new Request("https://block16.test/games"), env);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "static asset");
});


test("published games endpoint reads only published catalogue records", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";
  globalThis.fetch = async (input, init = {}) => {
    requestedUrl = String(input);
    assert.equal(new Headers(init.headers).get("apikey"), "test-anon-key");
    return Response.json([{ id: "g1", slug: "crossroads", title: "Crossroads" }]);
  };
  try {
    const response = await worker.fetch(new Request("https://block16.test/api/v1/games"), env);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      games: [{ id: "g1", slug: "crossroads", title: "Crossroads" }],
    });
    assert.match(requestedUrl, /status=eq\.published/);
    assert.match(requestedUrl, /limit=50/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});


test("successful registration stores Supabase tokens in HttpOnly cookies, not JSON", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({
    user: { id: "user-1", email: "player@example.com" },
    access_token: "access-secret",
    refresh_token: "refresh-secret",
    expires_in: 3600,
  }, { status: 200 });
  try {
    const response = await worker.fetch(new Request("https://block16.test/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "player@example.com", password: "password123", username: "player_123" }),
    }), env);
    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.session, undefined);
    assert.equal(JSON.stringify(body).includes("access-secret"), false);
    assert.match(response.headers.get("set-cookie") || "", /b16_access=access-secret/);
    assert.match(response.headers.get("set-cookie") || "", /HttpOnly/);
    assert.match(response.headers.get("set-cookie") || "", /SameSite=Lax/);
  } finally { globalThis.fetch = originalFetch; }
});


test("signup sends the account page as Supabase confirmation redirect", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";
  globalThis.fetch = async input => {
    requestedUrl = String(input);
    return Response.json({
      user: { id: "user-2", email: "newplayer@example.com" },
      access_token: null,
      refresh_token: null,
    }, { status: 200 });
  };
  try {
    const response = await worker.fetch(new Request("https://block16.test/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "newplayer@example.com", password: "password123", username: "new_player" }),
    }), env);
    assert.equal(response.status, 202);
    const url = new URL(requestedUrl);
    assert.equal(url.pathname, "/auth/v1/signup");
    assert.equal(url.searchParams.get("redirect_to"), "https://block16.stagekaden54.workers.dev/account");
  } finally { globalThis.fetch = originalFetch; }
});

test("confirmation validates Supabase user and sets HttpOnly session cookies without returning tokens", async () => {
  const originalFetch = globalThis.fetch;
  let requestedAuthorization = "";
  globalThis.fetch = async (input, init = {}) => {
    assert.match(String(input), /\/auth\/v1\/user$/);
    requestedAuthorization = new Headers(init.headers).get("authorization");
    return Response.json({ id: "user-verified", email: "verified@example.com", email_confirmed_at: "2026-11-16T00:00:00Z" });
  };
  try {
    const response = await worker.fetch(new Request("https://block16.test/api/v1/auth/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ access_token: "access-token-value-long-enough", refresh_token: "refresh-token-value" }),
    }), env);
    assert.equal(response.status, 200);
    assert.equal(requestedAuthorization, "Bearer access-token-value-long-enough");
    const body = await response.json();
    assert.deepEqual(body, { user: { id: "user-verified", email: "verified@example.com" } });
    assert.equal(JSON.stringify(body).includes("access-token"), false);
    const cookies = response.headers.get("set-cookie") || "";
    assert.match(cookies, /b16_access=access-token-value-long-enough/);
    assert.match(cookies, /b16_refresh=refresh-token-value/);
    assert.match(cookies, /HttpOnly/);
    assert.match(cookies, /Secure/);
    assert.match(cookies, /SameSite=Lax/);
  } finally { globalThis.fetch = originalFetch; }
});

test("confirmation rejects invalid or unverified tokens without setting cookies", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ id: "user-unverified", email: "pending@example.com" });
  try {
    const response = await worker.fetch(new Request("https://block16.test/api/v1/auth/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ access_token: "access-token-value-long-enough", refresh_token: "refresh-token-value" }),
    }), env);
    assert.equal(response.status, 401);
    assert.equal(response.headers.get("set-cookie"), null);
    assert.equal((await response.json()).error.code, "EMAIL_NOT_CONFIRMED");
  } finally { globalThis.fetch = originalFetch; }
});
