# BLOCK16 security notes

This branch contains an initial hardening pass, not a security certification.

## Changes made

- Production-oriented ASP.NET settings: compilation debug disabled and custom errors enabled.
- Authentication cookies are configured as HTTPS-only, HttpOnly, SameSite=Lax, and cookie-only.
- Forms authentication uses a 30-minute timeout, full cookie protection, and no hard-coded localhost cookie domain.
- The legacy `/Admi` area is deliberately blocked for everyone until BLOCK16-specific administrator authorization is implemented and tested. Do not replace this with an authenticated-users-only rule.
- New account password policy is 12 characters minimum with at least one non-alphanumeric character.
- Added basic response headers: X-Content-Type-Options, X-Frame-Options, and Referrer-Policy.
- Machine keys use application-isolated auto-generation for a single IIS host. Multi-node deployments must use the same strong keys from a secret manager on every node; do not commit production keys.

## Deployment requirements before public launch

1. Serve the application only behind correctly configured HTTPS. The secure-cookie settings intentionally prevent authentication cookies from working over plain HTTP.
2. Confirm the hosting platform honors the configured response headers and does not override authentication cookie attributes.
3. For multiple IIS nodes, configure shared machine keys securely outside the repository.
4. Implement and test explicit administrator-role checks before reopening `/Admi`.
5. Review login throttling and account lockout in the actual credential-validation service; the legacy membership provider delegates credential validation and this source review did not prove its rate-limit behavior.
6. Review SQL query parameterization, CSRF protection, output encoding/XSS, file uploads, secrets, dependencies, and telemetry across the complete application.
7. Build and run integration tests in the intended IIS/.NET Framework environment. These changes have not yet been runtime-tested.

## Important compatibility note

The legacy admin pages are intentionally unavailable after this hardening change. This is a fail-closed measure, not a completed replacement admin system. Local development over plain HTTP will also need an appropriately isolated development-only configuration rather than weakening production settings.


## Additional authentication findings and mitigations

- Login POST now validates an ASP.NET MVC anti-forgery token. The classic login form and animated login form both emit tokens.
- Signup POST now validates an anti-forgery token, and the animated signup form emits it.
- Login redirects now accept only local return URLs; external or malformed targets fall back to the site root.
- Login cookies are non-persistent because the current form has no explicit "remember me" choice.
- The repository's placeholder credential validator previously accepted every credential. It now rejects authentication until a real account-backed credential validator is configured.
- Placeholder membership services no longer fabricate an authenticated "Admin" user, return synthetic users by arbitrary name, or grant privileged status. This is intentionally fail-closed.
- These fail-closed changes mean authentication/account features will not work until real account and credential services are integrated. This is safer than allowing access with stub implementations.

## Further findings still requiring work

- The membership provider reports zero invalid-password attempts and a zero-minute attempt window. The provider delegates validation to another service, so real throttling/lockout must be implemented and tested in that service before launch.
- Cookie-constraint code contains no-op and mock implementations. It must not be treated as an active abuse-prevention control.
- Reviewed account, signup, email-address, and session-token DAL methods use SQL parameters and stored procedures in the inspected paths. This is encouraging but is not a complete SQL injection audit; stored procedure definitions and all DAL call sites still need review.
- The inspected Razor login views use normal encoded Razor output. Site-wide XSS review, particularly legacy Web Forms pages and user-generated profile/chat/catalog content, remains incomplete.
- No runtime, integration, or penetration testing has been performed.
