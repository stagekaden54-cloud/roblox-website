const ITERATIONS = 600_000;
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const COOKIE_NAME = "b16_session";
const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...headers } });
}
function fail(message, status = 400, code = "BAD_REQUEST", headers = {}) {
  return json({ error: { code, message } }, status, headers);
}
function bytesToHex(bytes) {
  return Array.from(new Uint8Array(bytes), value => value.toString(16).padStart(2, "0")).join("");
}
function hexToBytes(value) {
  if (typeof value !== "string" || !/^(?:[0-9a-f]{2})+$/i.test(value)) return new Uint8Array();
  return new Uint8Array(value.match(/.{2}/g).map(part => Number.parseInt(part, 16)));
}
function randomHex(size) {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return bytesToHex(bytes);
}
async function sha256(value) {
  return bytesToHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}
async function derivePassword(password, saltHex, iterations = ITERATIONS) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: hexToBytes(saltHex), iterations },
    key,
    256,
  );
  return bytesToHex(bits);
}
function constantTimeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}
export function validUsername(value) {
  return typeof value === "string" && /^[A-Za-z0-9_]{3,20}$/.test(value);
}
export function validPassword(value) {
  return typeof value === "string" && value.length >= 12 && value.length <= 128;
}
function validEmail(value) {
  return value === null || value === "" || (typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
}
function sessionCookie(token) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict`;
}
function clearCookie() {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}
function readCookie(request) {
  const cookies = request.headers.get("cookie") || "";
  const match = cookies.match(/(?:^|;\s*)b16_session=([^;]*)/);
  if (!match) return null;
  try { return decodeURIComponent(match[1]); } catch { return null; }
}
async function readBody(request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 8_192) throw new Error("too_large");
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > 8_192) throw new Error("too_large");
  try { return JSON.parse(raw); } catch { throw new Error("invalid_json"); }
}
function sameOrigin(request, env) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  const requestOrigin = new URL(request.url).origin;
  const trustedOrigin = typeof env.ALLOWED_ORIGIN === "string" ? env.ALLOWED_ORIGIN : "";
  const originIsTrusted = origin === requestOrigin || (trustedOrigin && origin === trustedOrigin);
  return Boolean(originIsTrusted) && (!fetchSite || fetchSite === "same-origin" || fetchSite === "none");
}
async function rateLimit(db, request, action, limit, windowSeconds) {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const key = await sha256(`${action}:${ip}`);
  const now = Math.floor(Date.now() / 1000);
  const cutoff = now - windowSeconds;
  const row = await db.prepare(`
    INSERT INTO account_rate_limits (bucket_key, window_started_at, attempts)
    VALUES (?, ?, 1)
    ON CONFLICT(bucket_key) DO UPDATE SET
      attempts = CASE WHEN window_started_at <= ? THEN 1 ELSE attempts + 1 END,
      window_started_at = CASE WHEN window_started_at <= ? THEN excluded.window_started_at ELSE window_started_at END
    RETURNING attempts
  `).bind(key, now, cutoff, cutoff).first();
  return Number(row?.attempts || 0) <= limit;
}
async function createSession(db, playerId) {
  const token = randomHex(32);
  const tokenHash = await sha256(token);
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  await db.prepare("INSERT INTO account_sessions (token_hash, player_id, expires_at) VALUES (?, ?, ?)")
    .bind(tokenHash, playerId, expiresAt).run();
  return token;
}
async function getSession(db, request) {
  const token = readCookie(request);
  if (!token || token.length !== 64) return null;
  const tokenHash = await sha256(token);
  const row = await db.prepare(`
    SELECT s.player_id, p.username, p.display_name, p.avatar_url, p.bio, p.created_at
    FROM account_sessions s
    JOIN profiles p ON p.id = s.player_id
    WHERE s.token_hash = ? AND s.expires_at > ?
    LIMIT 1
  `).bind(tokenHash, Math.floor(Date.now() / 1000)).first();
  return row ? { tokenHash, profile: row } : null;
}
function profilePayload(row) {
  return {
    id: row.id || row.player_id,
    username: row.username,
    display_name: row.display_name,
    avatar_url: row.avatar_url || null,
    bio: row.bio || "",
    created_at: row.created_at,
  };
}
function generateRecoveryCodes() {
  return Array.from({ length: 10 }, () => randomHex(16).toUpperCase());
}

async function register(db, request, body) {
  if (!(await rateLimit(db, request, "register", 5, 3600))) return fail("Too many registration attempts. Please try again later.", 429, "RATE_LIMITED");
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const email = body.email === undefined || body.email === null ? "" : (typeof body.email === "string" ? body.email.trim() : body.email);
  const password = body.password;
  const displayName = typeof body.display_name === "string" && body.display_name.trim()
    ? body.display_name.trim() : username;
  if (!validUsername(username)) return fail("Username must be 3–20 letters, numbers, or underscores.");
  if (!validPassword(password)) return fail("Password must be between 12 and 128 characters.");
  if (!validEmail(email)) return fail("Enter a valid email address or leave the field empty.");
  if (displayName.length < 1 || displayName.length > 40) return fail("Display name must be 1–40 characters.");

  const playerId = crypto.randomUUID();
  const salt = randomHex(16);
  const passwordHash = await derivePassword(password, salt);
  const recoveryCodes = generateRecoveryCodes();
  const recoveryRows = await Promise.all(recoveryCodes.map(async code => ({
    hash: await sha256(code),
  })));
  const statements = [
    db.prepare("INSERT INTO players (id, email) VALUES (?, ?)").bind(playerId, email || null),
    db.prepare("INSERT INTO profiles (id, username, display_name) VALUES (?, ?, ?)").bind(playerId, username, displayName),
    db.prepare("INSERT INTO account_credentials (player_id, password_salt, password_hash, password_iterations) VALUES (?, ?, ?, ?)")
      .bind(playerId, salt, passwordHash, ITERATIONS),
    ...recoveryRows.map(row => db.prepare("INSERT INTO account_recovery_codes (code_hash, player_id) VALUES (?, ?)")
      .bind(row.hash, playerId)),
  ];
  try {
    await db.batch(statements);
  } catch {
    // Do not disclose whether a username or optional email is already in use.
    return fail("We couldn't create that account. Check the details or try a different username.", 409, "REGISTRATION_FAILED");
  }
  const token = await createSession(db, playerId);
  return json({
    success: true,
    profile: { id: playerId, username, display_name: displayName, bio: "" },
    recovery_codes: recoveryCodes,
    recovery_codes_notice: "Save these codes somewhere safe. Each code works once, and they will not be shown again.",
  }, 201, { "set-cookie": sessionCookie(token) });
}

async function login(db, request, body) {
  if (!(await rateLimit(db, request, "login", 10, 900))) return fail("Too many sign-in attempts. Please wait and try again.", 429, "RATE_LIMITED");
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = body.password;
  if (!validUsername(username) || typeof password !== "string" || password.length > 128) {
    return fail("Username or password is incorrect.", 401, "INVALID_CREDENTIALS");
  }
  const row = await db.prepare(`
    SELECT p.id, p.username, p.display_name, p.avatar_url, p.bio, p.created_at,
           c.password_salt, c.password_hash, c.password_iterations
    FROM profiles p JOIN account_credentials c ON c.player_id = p.id
    WHERE p.username = ? COLLATE NOCASE LIMIT 1
  `).bind(username).first();
  const salt = row?.password_salt || "00112233445566778899aabbccddeeff";
  const expected = row?.password_hash || "0".repeat(64);
  const actual = await derivePassword(password, salt, Number(row?.password_iterations || ITERATIONS));
  if (!row || !constantTimeEqual(actual, expected)) return fail("Username or password is incorrect.", 401, "INVALID_CREDENTIALS");
  const token = await createSession(db, row.id);
  return json({ success: true, profile: profilePayload(row) }, 200, { "set-cookie": sessionCookie(token) });
}

async function logout(db, request) {
  const token = readCookie(request);
  if (token && token.length === 64) {
    await db.prepare("DELETE FROM account_sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  }
  return json({ success: true }, 200, { "set-cookie": clearCookie() });
}

async function me(db, request) {
  const session = await getSession(db, request);
  if (!session) return fail("Sign in to continue.", 401, "UNAUTHENTICATED", { "set-cookie": clearCookie() });
  return json({ profile: profilePayload(session.profile) });
}

async function recover(db, request, body) {
  if (!(await rateLimit(db, request, "recover", 5, 3600))) return fail("Too many recovery attempts. Please try again later.", 429, "RATE_LIMITED");
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const code = typeof body.recovery_code === "string" ? body.recovery_code.replace(/\s|-/g, "").toUpperCase() : "";
  const newPassword = body.new_password;
  if (!validUsername(username) || !/^[0-9A-F]{32}$/.test(code) || !validPassword(newPassword)) {
    return fail("The recovery details are invalid.", 400, "INVALID_RECOVERY");
  }
  const row = await db.prepare("SELECT id FROM profiles WHERE username = ? COLLATE NOCASE LIMIT 1").bind(username).first();
  const codeHash = await sha256(code);
  const recovery = row ? await db.prepare("SELECT code_hash FROM account_recovery_codes WHERE player_id = ? AND code_hash = ? LIMIT 1")
    .bind(row.id, codeHash).first() : null;
  if (!row || !recovery) return fail("The recovery details are invalid or the code has already been used.", 400, "INVALID_RECOVERY");
  const salt = randomHex(16);
  const passwordHash = await derivePassword(newPassword, salt);
  await db.batch([
    db.prepare("UPDATE account_credentials SET password_salt = ?, password_hash = ?, password_iterations = ?, updated_at = CURRENT_TIMESTAMP WHERE player_id = ?")
      .bind(salt, passwordHash, ITERATIONS, row.id),
    db.prepare("DELETE FROM account_recovery_codes WHERE code_hash = ?").bind(codeHash),
    db.prepare("DELETE FROM account_sessions WHERE player_id = ?").bind(row.id),
  ]);
  return json({ success: true, message: "Password updated. Sign in with your new password." }, 200, { "set-cookie": clearCookie() });
}

export async function handleD1Auth(request, env, path) {
  if (!path.startsWith("/api/v2/auth/")) return null;
  if (!env.DB) return fail("BLOCK16 username accounts are not configured yet.", 503, "D1_NOT_CONFIGURED");
  if (path === "/api/v2/auth/me" && request.method === "GET") return me(env.DB, request);
  if (!["POST"].includes(request.method)) return fail("Method not allowed.", 405, "METHOD_NOT_ALLOWED");
  if (!sameOrigin(request, env)) return fail("This request must come from the BLOCK16 website.", 403, "CROSS_SITE_REQUEST");
  let body;
  try { body = await readBody(request); }
  catch (error) {
    return error.message === "too_large"
      ? fail("Request body is too large.", 413, "REQUEST_TOO_LARGE")
      : fail("Send a valid JSON request.", 400, "INVALID_JSON");
  }
  if (path === "/api/v2/auth/register") return register(env.DB, request, body || {});
  if (path === "/api/v2/auth/login") return login(env.DB, request, body || {});
  if (path === "/api/v2/auth/logout") return logout(env.DB, request);
  if (path === "/api/v2/auth/recover") return recover(env.DB, request, body || {});
  return fail("API route not found.", 404, "NOT_FOUND");
}
