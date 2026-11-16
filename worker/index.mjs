const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

const PROFILE_FIELDS = "id,username,display_name,avatar_url,bio,created_at,updated_at";
const GAME_FIELDS = "id,slug,title,description,genre,thumbnail_url,creator_id,created_at,updated_at";

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
    "access-control-allow-headers": "authorization,content-type",
    "access-control-max-age": "86400",
    "vary": "origin",
  };
}

function withCors(response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function apiError(message, status = 400, code = "BAD_REQUEST") {
  return json({ error: { code, message } }, status);
}

function isConfigured(env) {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
}

async function readJson(request, maxBytes = 16_384) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > maxBytes) throw new Error("REQUEST_TOO_LARGE");
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) throw new Error("REQUEST_TOO_LARGE");
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("INVALID_JSON");
  }
}

function validEmail(value) {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validUsername(value) {
  return typeof value === "string" && /^[A-Za-z0-9_]{3,20}$/.test(value);
}

async function supabaseFetch(env, path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("apikey", env.SUPABASE_ANON_KEY);
  if (!headers.has("authorization")) headers.set("authorization", `Bearer ${env.SUPABASE_ANON_KEY}`);
  if (options.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  return fetch(`${env.SUPABASE_URL.replace(/\/$/, "")}${path}`, { ...options, headers });
}

async function parseProviderResponse(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const status = response.status === 400 || response.status === 422 ? 400 : response.status;
    const message = typeof body.msg === "string" ? body.msg
      : typeof body.message === "string" ? body.message
      : typeof body.error_description === "string" ? body.error_description
      : "The authentication service could not complete the request.";
    return { response: apiError(message, status, "AUTHENTICATION_FAILED") };
  }
  return { body };
}

function cookieValue(request, name) {
  const cookies = request.headers.get("cookie") || "";
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
function sessionHeaders(accessToken, refreshToken, expiresIn = 3600) {
  const age = Math.max(60, Math.min(Number(expiresIn) || 3600, 604800));
  return [`b16_access=${encodeURIComponent(accessToken)}; Path=/; Max-Age=${age}; HttpOnly; Secure; SameSite=Lax`,`b16_refresh=${encodeURIComponent(refreshToken)}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`];
}
function clearSessionHeaders() { return ["b16_access=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax","b16_refresh=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax"]; }
function sessionJson(data, cookies = [], status = 200) {
  const response = json(data, status); const headers = new Headers(response.headers);
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(response.body, { status: response.status, headers });
}
async function requireUser(request, env) {
  let token = cookieValue(request, "b16_access");
  const refreshToken = cookieValue(request, "b16_refresh");
  if (!token) token = (request.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1] || null;
  if (!token && !refreshToken) return { error: apiError("Sign in to continue.", 401, "UNAUTHENTICATED") };
  let response = token ? await supabaseFetch(env, "/auth/v1/user", { headers: { authorization: `Bearer ${token}` } }) : null;
  let cookies = [];
  if ((!response || !response.ok) && refreshToken) {
    const refreshed = await supabaseFetch(env, "/auth/v1/token?grant_type=refresh_token", { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) });
    const session = await refreshed.json().catch(() => ({}));
    if (refreshed.ok && session.access_token && session.refresh_token) {
      token = session.access_token; cookies = sessionHeaders(token, session.refresh_token, session.expires_in);
      response = await supabaseFetch(env, "/auth/v1/user", { headers: { authorization: `Bearer ${token}` } });
    }
  }
  if (!response?.ok) return { error: sessionJson({ error: { code: "INVALID_SESSION", message: "Your session has expired. Please sign in again." } }, clearSessionHeaders(), 401) };
  const user = await response.json().catch(() => null);
  if (!user?.id) return { error: sessionJson({ error: { code: "INVALID_SESSION", message: "Your session has expired. Please sign in again." } }, clearSessionHeaders(), 401) };
  return { user, token, cookies };
}

async function handleAuth(request, env, path) {
  if (path === "/api/v1/auth/register" && request.method === "POST") {
    let body;
    try { body = await readJson(request); } catch (error) {
      return error.message === "REQUEST_TOO_LARGE"
        ? apiError("Request body is too large.", 413, "REQUEST_TOO_LARGE")
        : apiError("Send a valid JSON request.", 400, "INVALID_JSON");
    }
    const { email, password, username, display_name: displayName } = body || {};
    if (!validEmail(email)) return apiError("Enter a valid email address.");
    if (!validUsername(username)) return apiError("Username must be 3–20 letters, numbers, or underscores.");
    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
      return apiError("Password must be between 8 and 128 characters.");
    }
    if (displayName !== undefined && (typeof displayName !== "string" || displayName.trim().length < 1 || displayName.length > 40)) {
      return apiError("Display name must be between 1 and 40 characters.");
    }

    const redirectTo = new URLSearchParams({ redirect_to: "https://block16.stagekaden54.workers.dev/account" });
    const response = await supabaseFetch(env, `/auth/v1/signup?${redirectTo}`, {
      method: "POST",
      body: JSON.stringify({
        email: email.trim(),
        password,
        data: { username, display_name: displayName?.trim() || username },
      }),
    });
    const result = await parseProviderResponse(response);
    if (result.response) return result.response;
    const sessionCreated = Boolean(result.body?.access_token);
    return sessionJson({ user: result.body?.user ? { id: result.body.user.id, email: result.body.user.email } : null, email_confirmation_required: !sessionCreated }, sessionCreated ? sessionHeaders(result.body.access_token, result.body.refresh_token, result.body.expires_in) : [], sessionCreated ? 201 : 202);
  }

  if (path === "/api/v1/auth/confirm" && request.method === "POST") {
    let body;
    try { body = await readJson(request, 8_192); } catch (error) {
      return error.message === "REQUEST_TOO_LARGE"
        ? apiError("Request body is too large.", 413, "REQUEST_TOO_LARGE")
        : apiError("Send a valid JSON request.", 400, "INVALID_JSON");
    }
    const accessToken = body?.access_token;
    const refreshToken = body?.refresh_token;
    if (typeof accessToken !== "string" || accessToken.length < 20 || accessToken.length > 8_192
      || typeof refreshToken !== "string" || refreshToken.length < 10 || refreshToken.length > 2_048) {
      return apiError("The confirmation link is invalid or incomplete. Request a new confirmation email.", 400, "INVALID_CONFIRMATION");
    }

    const response = await supabaseFetch(env, "/auth/v1/user", {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      return apiError("This confirmation link is invalid or expired. Request a new confirmation email.", 401, "INVALID_CONFIRMATION");
    }
    const user = await response.json().catch(() => null);
    if (!user?.id || !(user.email_confirmed_at || user.confirmed_at)) {
      return apiError("Your email has not been confirmed yet. Open the newest confirmation email and try again.", 401, "EMAIL_NOT_CONFIRMED");
    }
    // Rotate the refresh token and confirm both tokens belong to the same user.
    const refreshedResponse = await supabaseFetch(env, "/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const refreshed = await refreshedResponse.json().catch(() => ({}));
    if (!refreshedResponse.ok || refreshed?.user?.id !== user.id
      || typeof refreshed.access_token !== "string" || typeof refreshed.refresh_token !== "string") {
      return apiError("This confirmation link is invalid or expired. Request a new confirmation email.", 401, "INVALID_CONFIRMATION");
    }
    return sessionJson(
      { user: { id: user.id, email: user.email || null } },
      sessionHeaders(refreshed.access_token, refreshed.refresh_token, refreshed.expires_in),
    );
  }

  if (path === "/api/v1/auth/login" && request.method === "POST") {
    let body;
    try { body = await readJson(request); } catch (error) {
      return error.message === "REQUEST_TOO_LARGE"
        ? apiError("Request body is too large.", 413, "REQUEST_TOO_LARGE")
        : apiError("Send a valid JSON request.", 400, "INVALID_JSON");
    }
    const { email, password } = body || {};
    if (!validEmail(email) || typeof password !== "string" || password.length < 1 || password.length > 128) {
      return apiError("Enter a valid email address and password.");
    }
    const response = await supabaseFetch(env, "/auth/v1/token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const result = await parseProviderResponse(response);
    if (result.response) return result.response;
    return sessionJson({ user: result.body?.user ? { id: result.body.user.id, email: result.body.user.email } : null }, sessionHeaders(result.body.access_token, result.body.refresh_token, result.body.expires_in));
  }

  if (path === "/api/v1/auth/logout" && request.method === "POST") {
    const auth = await requireUser(request, env);
    if (auth.error) return auth.error;
    const response = await supabaseFetch(env, "/auth/v1/logout", {
      method: "POST",
      headers: { authorization: `Bearer ${auth.token}` },
    });
    if (!response.ok) return apiError("Could not end the session. Please try again.", 502, "AUTH_PROVIDER_ERROR");
    return sessionJson({ success: true }, clearSessionHeaders());
  }

  return null;
}

async function handleProfile(request, env, path) {
  if (path === "/api/v1/me" && request.method === "GET") {
    const auth = await requireUser(request, env);
    if (auth.error) return auth.error;
    const query = new URLSearchParams({ id: `eq.${auth.user.id}`, select: PROFILE_FIELDS, limit: "1" });
    const response = await supabaseFetch(env, `/rest/v1/profiles?${query}`, {
      headers: { authorization: `Bearer ${auth.token}` },
    });
    if (!response.ok) return apiError("Could not load your profile.", 502, "DATABASE_ERROR");
    const profiles = await response.json();
    return sessionJson({ user: { id: auth.user.id, email: auth.user.email }, profile: profiles[0] || null }, auth.cookies);
  }

  if (path === "/api/v1/me" && request.method === "PATCH") {
    const auth = await requireUser(request, env);
    if (auth.error) return auth.error;
    let body;
    try { body = await readJson(request, 8_192); } catch (error) {
      return error.message === "REQUEST_TOO_LARGE"
        ? apiError("Request body is too large.", 413, "REQUEST_TOO_LARGE")
        : apiError("Send a valid JSON request.", 400, "INVALID_JSON");
    }
    const updates = {};
    if (Object.hasOwn(body || {}, "display_name")) {
      if (typeof body.display_name !== "string" || body.display_name.trim().length < 1 || body.display_name.length > 40) {
        return apiError("Display name must be between 1 and 40 characters.");
      }
      updates.display_name = body.display_name.trim();
    }
    if (Object.hasOwn(body || {}, "bio")) {
      if (typeof body.bio !== "string" || body.bio.length > 160) return apiError("Bio must be 160 characters or fewer.");
      updates.bio = body.bio;
    }
    if (Object.hasOwn(body || {}, "avatar_url")) {
      if (body.avatar_url !== null && (typeof body.avatar_url !== "string" || body.avatar_url.length > 2_048 || !/^https:\/\//i.test(body.avatar_url))) {
        return apiError("Avatar URL must be an HTTPS URL.");
      }
      updates.avatar_url = body.avatar_url;
    }
    if (Object.keys(updates).length === 0) return apiError("Include at least one editable profile field.");

    const query = new URLSearchParams({ id: `eq.${auth.user.id}`, select: PROFILE_FIELDS });
    const response = await supabaseFetch(env, `/rest/v1/profiles?${query}`, {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${auth.token}`,
        prefer: "return=representation",
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) return apiError("Could not update your profile.", 502, "DATABASE_ERROR");
    const profiles = await response.json();
    return sessionJson({ profile: profiles[0] || null }, auth.cookies);
  }
  return null;
}

async function handleGames(request, env, path) {
  if (request.method !== "GET") return null;
  const match = path.match(/^\/api\/v1\/games(?:\/([a-z0-9]+(?:-[a-z0-9]+)*))?$/);
  if (!match) return null;

  const query = new URLSearchParams({
    select: GAME_FIELDS,
    status: "eq.published",
    order: "created_at.desc",
    limit: "50",
  });
  if (match[1]) query.set("slug", `eq.${match[1]}`);

  const response = await supabaseFetch(env, `/rest/v1/games?${query}`);
  if (!response.ok) return apiError("Could not load the game catalogue.", 502, "DATABASE_ERROR");
  const games = await response.json();
  if (match[1]) {
    if (!games[0]) return apiError("Game not found.", 404, "NOT_FOUND");
    return json({ game: games[0] });
  }
  return json({ games });
}

async function route(request, env) {
  const url = new URL(request.url);
  if (url.pathname === "/api/health" || url.pathname === "/api/v1/health") {
    return json({ status: "ok", service: "block16-api", configured: isConfigured(env) });
  }
  if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
  if (!isConfigured(env)) return apiError("The backend is not configured yet.", 503, "BACKEND_NOT_CONFIGURED");
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });
  if (!["GET", "POST", "PATCH"].includes(request.method)) return apiError("Method not allowed.", 405, "METHOD_NOT_ALLOWED");

  const authResponse = await handleAuth(request, env, url.pathname);
  if (authResponse) return authResponse;

  const profileResponse = await handleProfile(request, env, url.pathname);
  if (profileResponse) return profileResponse;

  const gameResponse = await handleGames(request, env, url.pathname);
  if (gameResponse) return gameResponse;

  return apiError("API route not found.", 404, "NOT_FOUND");
}

export default {
  async fetch(request, env) {
    try {
      return withCors(await route(request, env));
    } catch {
      return withCors(apiError("An unexpected server error occurred.", 500, "INTERNAL_ERROR"));
    }
  },
};
