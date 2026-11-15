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

## Additional high-priority fixes and findings

- Fixed an open redirect in the login POST action. Redirects now accept only local URLs.
- Added anti-forgery tokens and server-side validation to the classic login, animated login, and animated signup forms.
- Profile descriptions are now HTML-encoded before display. Usernames inserted into the profile chat JavaScript are JavaScript-encoded and HTML-attribute-encoded.
- User-created place names in the profile showcase now use encoded data binding.
- Standard login now issues a non-persistent authentication cookie because the form does not offer a remember-me choice.
- Found that the old signup provider generated passwords with a single unsalted SHA-256 hash (HashGenerator.HashString with an empty salt). Account creation has been disabled until a proper password service such as the repository's IPasswordsClient integration is implemented. Do not re-enable the old hash path.
- The placeholder credential validator now rejects all credentials until a real account-backed validator is configured. Placeholder membership code no longer fabricates a signed-in Admin user or grants privileged status. As a result, login and signup are intentionally unavailable until the real services are connected.

## Further investigation

- The inspected account lookup, signup, email-address, and session-token data-access methods pass values as SQL parameters to stored procedures. No direct SQL injection was confirmed in those inspected methods. Stored procedure definitions and the remaining DAL files have not all been audited.
- A stored-XSS path was confirmed in the public profile description and a user-created place-name output. Those two output paths have been encoded. The rest of the legacy Web Forms and inline-JavaScript surfaces still need a full output-encoding review.
- The experimental MVC layout still includes Google Analytics, an event manager, Google AdWords conversion tracking, a JavaScript error tracker, a vendor signup tracking pixel, and a Facebook SDK loader. These are third-party tracking/data-sharing integrations and should be reviewed or removed/replaced according to BLOCK16's privacy policy before public launch.
- The legacy membership provider reports zero invalid-password attempts and a zero-minute attempt window. The actual credential validator must implement login throttling and lockout before authentication is enabled.
- Cookie-constraint code includes no-op/mock implementations and is not a functioning abuse-prevention system. The only MVC controller that carried the redirect attribute was the logout controller; that unnecessary filter was removed so a mock constraint cannot prevent users from signing out. The separate constraint-fulfillment page still uses mock cookie logic and must not be enabled as a security feature.
- Logout now uses an authenticated POST action with MVC anti-forgery validation. The navigation control emits an anti-forgery token and submits it with the logout request. GET logout is no longer supported.
- No runtime, integration, or penetration tests have been performed. The repository is not ready for public launch based on this static review.


## Latest hardening pass

- Logout was changed from GET to POST and protected with `[ValidateAntiForgeryToken]`. The authenticated navigation control now renders an anti-forgery token and copies it into the POST form.
- Added an explicit `System.Web.Helpers` project reference for the Web Forms anti-forgery token helper already provided by the installed ASP.NET WebPages package.
- Signup birthday fields are now parsed with invariant integer parsing and checked for a valid month/day combination and an allowed year range before any date calculation. Invalid values return the existing generic bad-input membership status instead of throwing. The legacy signup helper still does not persist the birthday or gender; this patch only validates the submitted date.
- Removed the mock cookie-constraint redirect filter from the logout-only MVC controller. Cookie constraint remains incomplete: its module is a no-op, its validator is a stub that always reports a constrained cookie, and the separate fulfillment page uses mock cookies rather than a verified security challenge.
- These changes have been committed to `block16-rebrand`; the original `2016` branch remains untouched. No compile or runtime test has yet been performed, so the anti-forgery helper reference and Web Forms rendering must be verified in a .NET Framework 4.7.2 build/runtime.

- The legacy cookie-constraint fulfillment page now rejects external, protocol-relative, and backslash-based return URLs, falling back to the site root. This closes an additional open-redirect path found while tracing the mock constraint flow.
