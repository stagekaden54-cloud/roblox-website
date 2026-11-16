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
