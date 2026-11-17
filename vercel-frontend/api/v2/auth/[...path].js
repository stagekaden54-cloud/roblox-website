const AUTH_API = "https://block16-auth-preview.stagekaden54.workers.dev";
const ALLOWED_PATHS = new Set(["register", "login", "recover", "logout", "me"]);

export default async function handler(req, res) {
  const method = req.method || "GET";
  if (method !== "GET" && method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed." } });
  }

  // Vercel normally supplies catch-all segments in req.query.path. Derive
  // from the request URL as a fallback so routing still works when that
  // query field is absent or represented differently by a preview deployment.
  const pathValue = req.query?.path;
  const queryPath = Array.isArray(pathValue) ? pathValue.join("/") : String(pathValue || "");
  const pathname = new URL(req.url || "/", "https://vercel.invalid").pathname;
  const urlPath = pathname.startsWith("/api/v2/auth/")
    ? pathname.slice("/api/v2/auth/".length)
    : "";
  const path = queryPath || urlPath;
  if (!ALLOWED_PATHS.has(path)) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "API route not found." } });
  }

  // Browser POSTs must originate from the exact host serving this preview.
  // The upstream Worker receives its own origin so its same-origin guard remains enabled.
  const host = req.headers.host;
  const browserOrigin = host ? `https://${host}` : "";
  const requestOrigin = req.headers.origin || "";
  const fetchSite = req.headers["sec-fetch-site"];
  if (method === "POST" && (!browserOrigin || requestOrigin !== browserOrigin
      || (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none"))) {
    return res.status(403).json({ error: { code: "CROSS_SITE_REQUEST", message: "This request must come from the BLOCK16 preview page." } });
  }

  const headers = {
    origin: AUTH_API,
    "sec-fetch-site": "same-origin",
    accept: "application/json",
  };
  if (req.headers.cookie) headers.cookie = req.headers.cookie;
  if (req.headers["content-type"]) headers["content-type"] = req.headers["content-type"];

  const options = { method, headers, redirect: "manual" };
  if (method === "POST") {
    options.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});
  }

  try {
    const upstream = await fetch(`${AUTH_API}/api/v2/auth/${path}`, options);
    const contentType = upstream.headers.get("content-type");
    const cacheControl = upstream.headers.get("cache-control");
    const setCookie = upstream.headers.get("set-cookie");
    if (contentType) res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", cacheControl || "no-store");
    if (setCookie) res.setHeader("Set-Cookie", setCookie);
    const body = await upstream.text();
    return res.status(upstream.status).send(body);
  } catch {
    return res.status(502).json({ error: { code: "AUTH_PREVIEW_UNAVAILABLE", message: "The account preview service is temporarily unavailable." } });
  }
}
