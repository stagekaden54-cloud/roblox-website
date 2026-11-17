# BLOCK16 username authentication (D1)

This is an isolated, opt-in authentication implementation. It does not replace the current Supabase routes, alter existing accounts, or create a production database.

## Development preview

- Preview page: `/account-d1.html`
- API prefix: `/api/v2/auth/`
- D1 binding name expected by the Worker: `DB`
- Migration: `migrations/0002_username_auth.sql`

The new API is deliberately separate from the existing `/api/v1/auth/*` endpoints. Without a `DB` binding, the new endpoints return `503 D1_NOT_CONFIGURED`; the current account flow remains available.

## Account behavior

- Registration requires a 3–20 character username and a password of 12–128 characters.
- Email is optional and is stored as `NULL` when omitted. It is not currently used for password recovery because an unverified address must not be treated as proof of account ownership.
- Registration does not send email or require email confirmation.
- Login uses username and password.
- Each account receives ten random, one-time recovery codes. The plaintext codes are returned only at registration; only SHA-256 hashes are stored.
- A recovery code can reset the password once. Password reset revokes all active sessions.
- Sessions use random 256-bit tokens. Only SHA-256 token hashes are stored in D1; the browser receives a Secure, HttpOnly, SameSite=Strict cookie.
- Passwords use PBKDF2-HMAC-SHA-256 with a per-account random salt and 600,000 iterations.
- Registration, login, and recovery have D1-backed per-IP rate limits. The IP is hashed before storage.

## D1 setup (not performed by this PR)

When the project owner is ready to provision the database:

1. Create a D1 database in the intended Cloudflare account.
2. Add a `[[d1_databases]]` binding named `DB` to `wrangler.jsonc`, using the actual database ID returned by Cloudflare. Do not use a placeholder ID.
3. Apply migrations in order, including `0001_initial_schema.sql` and `0002_username_auth.sql`, to the intended environment.
4. Run the Worker tests and test the preview page in a non-production environment.
5. Review backup, retention, abuse-monitoring, and recovery procedures before enabling this for real players.

This PR intentionally does not create a database, add a D1 binding, run a remote migration, change Supabase configuration, merge itself, or deploy anything.

## Important limitations before launch

- This is a separate account store; it does not migrate or link existing Supabase users.
- Every player must keep their recovery codes, whether or not they provide an email. If they lose their password and all unused recovery codes, this implementation has no alternate recovery channel.
- A scheduled cleanup task should later prune expired sessions and old rate-limit buckets.
- The current page is a development preview. The live `/account.html` flow is unchanged until a separately reviewed cutover.
