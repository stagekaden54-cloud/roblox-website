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


## User-generated content audit — latest pass

- Encoded `ProfileViewModel.ProfileDisplayName` before inserting it into the profile sets heading in `Website/UserControls/UserContent/SetsPane.ascx`.
- Encoded the profile display name before assigning it to the Web Forms label in `Website/UserControls/UserContent/HeaderPane.ascx.cs`. Web Forms label text should not be assumed to HTML-encode arbitrary content automatically.
- Previously hardened profile descriptions, profile chat-name JavaScript interpolation, and showcased place names remain encoded.
- The sets-pane JavaScript formatter applies an `escapeHTML()` conversion to string fields before inserting them into its HTML template. This should still be tested in-browser with hostile test strings; static inspection alone does not establish complete safety.
- The image upload page (`Website/UploadMedia/PostImage.aspx.cs`) currently has no upload implementation. The comments handler returns a fixed placeholder response, and the raw-asset handler returns a hard-coded CDN URL. These are incomplete features, not evidence of a working upload/comments pipeline. Do not enable uploads or treat these endpoints as production functionality without a designed and tested implementation.
- This pass is a focused review of selected profile and endpoint files, not a complete XSS or upload audit. Additional Web Forms controls, JavaScript templates, API handlers, and data sources remain to be inspected.
- Changes were committed to `block16-rebrand`; the original `2016` branch was not modified. Source files were re-fetched after edits. No .NET Framework build, browser test, integration test, or penetration test was run in this pass.


## Additional profile and privacy review

- Encoded the profile display name before formatting the no-groups message in `UserGroupsPane.ascx.cs`. This protects the label output from a profile-name HTML injection path.
- Encoded the profile username for the dormant `Party.InviteUser(...)` inline JavaScript call in `PublicUser.ascx`. The containing feature branch is currently disabled in the markup, but the interpolation is now safe if that branch is re-enabled.
- Removed a redundant profile greeting assignment in `HeaderPane.ascx.cs` that inserted the display name into a label and was immediately overwritten later in the same request. The actual displayed profile name remains HTML-encoded.
- Reviewed `ProfileViewModel.GetFollowScript`: the inspected implementation interpolates the numeric viewer user ID into a fixed JavaScript call, rather than interpolating user-controlled text. This specific construction did not show a string-injection path. It still warrants functional authorization testing before enabling follow/join actions.
- The experimental layout includes third-party Google Analytics, Google AdWords conversion tracking, an event manager, a JavaScript error tracker, a vendor signup tracking pixel, and a Facebook SDK loader. These were inventoried but not removed: BLOCK16 needs an explicit privacy/telemetry decision and confirmation of which layouts are actually served before changing production behavior. Avoid collecting unnecessary personal data; publish a clear privacy notice before launch.
- The checked-in machine-key configuration uses application-isolated auto-generation rather than a literal hard-coded key. This is suitable only for a single-host arrangement; multi-node hosting requires securely provisioned shared keys outside source control. No secret values were copied into this report.
- The website package manifest contains a BCrypt.Net-Next dependency, but this pass did not prove that the disabled account-creation path has been correctly wired to it. Do not enable account creation solely because the package exists.
- The profile-focused output-encoding pass now includes profile description, profile heading, header label, empty-groups message, profile chat username, and invite-to-party username interpolation. This is not a complete site-wide XSS audit; all remaining Web Forms controls, MVC views, client templates, and API-fed markup still need review.
- Changes are committed to `block16-rebrand` and were re-fetched for verification. No .NET Framework build, browser test, or runtime security test was run in this pass.


## Third-party tracking reduction — latest pass

- Removed Google Analytics (both duplicate partial inclusions), Google AdWords conversion/remarketing tracking, the Facebook SDK loader, the vendor-specific signup tracking pixel, the event-manager partial, and the JavaScript error-tracker partial from `Website/Views/Shared/Experimental/_Layout.cshtml`.
- The event manager was not simply a local diagnostic: its inspected setup pointed the event listener at `roblox.com/Game/EventTracker.ashx` and registered page-view/return-visit events. It is no longer initialized by this layout.
- The JavaScript error tracker was configured to route exceptions through its Google Analytics pixel path. Its initialization has been removed from this layout.
- The old tracking partial/view files and JavaScript assets remain in the repository for now, but this experimental layout no longer loads them. Other layouts or individual pages may still reference tracking code; a repository-wide telemetry inventory is still required before claiming that all tracking has been removed.
- The jQuery and Microsoft Ajax CDN scripts remain because they are application dependencies, not the tracking integrations targeted in this pass. They are third-party resource requests and should be reviewed separately for dependency freshness, integrity, availability, and privacy.
- Re-fetched the edited layout from `block16-rebrand` and verified that none of the listed tracking partials or the Facebook SDK loader remain in it. No browser/network inspection or runtime test has yet confirmed the actual requests made by a deployed site.


## Primary layout tracking removal — follow-up

- Removed Google Analytics partials, the JavaScript error-tracker initializer, event-manager initialization, new-user event trigger, and vendor signup tracking pixel from `Website/Views/Shared/_Layout.cshtml`, the primary shared layout.
- The earlier experimental-layout removal remains in place.
- The primary layout's Google Analytics partial had initialized multiple Google Analytics accounts; its removal prevents that layout from injecting the legacy Google Analytics loader through this partial.
- The primary layout's event-manager partial initialized both the legacy Roblox event listener and Google event listener. Removing it prevents those listeners from being initialized through the primary layout.
- Tracking-related JavaScript files are still present in shared script bundles and the repository. The inspected files do not independently load Google Analytics unless the analytics partial defines `_gaq`, and event listeners require initialization; however, other call sites and individual pages still need a complete reference audit before declaring telemetry fully disabled.
- The application also contains first-party game/client metrics that POST to same-origin `/game/report-stats` and `/game/report-event` endpoints. These are not third-party trackers, but they are telemetry and should be documented in BLOCK16's privacy notice if retained.
- Both shared layouts were re-fetched after the edits and checked for the removed tracker partials and Facebook SDK loader. This is static source verification only; no deployed-browser network capture or runtime test has been performed.


## Remaining telemetry and external dependency review

### First-party telemetry
- `Website/js/EventTracker.js` sends event names and elapsed durations to same-origin `/game/report-stats` and `/game/report-event` endpoints. Its `transmitMetrics` flag defaults to `true`. Reviewed callers include game-launch and client-install flows. This is first-party operational/product telemetry, not a third-party analytics request, but it should be disclosed and minimized. Server-side retention, access controls, and exact stored fields were not established in this source-only pass.
- The event tracker includes `crossDomain: true` and `withCredentials: true` even though its target paths are relative same-origin URLs. This deserves cleanup in a tested change; it is not evidence by itself of cross-origin transmission.
- `RobloxEventManager.js` reads the legacy `RBXEventTracker` cookie for a browser identifier and can attach that identifier to events. Its `initialize` method defaults to disabled only when explicitly passed false; the module itself starts `initialized = false`. The primary/experimental layouts no longer include the old event-manager partial initializers, but remaining call sites and server-side cookie issuance still need tracing.
- `MongoEventListener.js` can transmit event data through JSONP to its configured `loggingURI`; the reviewed bundle includes the module, but no active listener initialization/configuration was confirmed in the reviewed layout and bundle entry points. Treat as legacy code requiring removal or proof of non-use before launch.
- `GoogleEventListener.js`, `GoogleAnalyticsEvents.js`, and `JSErrorTracker.js` remain in shared script bundles. Their reviewed code can emit Google Analytics events if a GA queue/tracker is configured. The layout partials that configured the old analytics/error tracking have been removed. Remaining configuration and call sites need a complete check before asserting that no analytics request can occur.
- `ABPlaceLauncher.js` can queue a JavaScript exception event through `RobloxEventManager`; without an active event-manager initializer this may remain queued rather than transmitted. This path should be revisited when the event manager is retired.

### External dependencies
- Both shared layouts still request jQuery 1.7.2 and Microsoft Ajax from `ajax.aspnetcdn.com`, with local fallback copies under `/js/jquery/jquery-1.7.2.min.js` and `/js/Microsoft/MicrosoftAjax.js`. These are third-party resource requests, not analytics pixels, but the browser contacts the CDN before using the local fallback. The versions are legacy and should be upgraded/self-hosted only after compatibility testing.
- The primary layout contains an `fb-root` element and an old Facebook XML namespace, but the Facebook SDK loader was removed. Those markup remnants alone do not make a Facebook network request.
- `GPTAdScript.js` is included in the base bundle. It should be reviewed alongside the ad-related page features before removing it; ad delivery and analytics are separate concerns.
- No code was changed in this review pass. Findings are static source observations; browser network capture, server endpoint inspection, dependency advisory scanning, and runtime testing remain outstanding.


## Client telemetry default-off change

- Changed `Website/js/EventTracker.js` so `transmitMetrics` defaults to `false`. Game-launch and client-install timing/event names are no longer POSTed by this module unless a future caller explicitly enables transmission.
- Removed the unnecessary `crossDomain: true` and `withCredentials: true` AJAX options from its relative same-origin reporting URLs. Same-origin browser requests use the normal same-origin behavior.
- Local event timing and the in-memory `localEventLog` remain available; this change does not remove those local diagnostics.
- The repository tree did not contain an obvious `/game/report-stats` or `/game/report-event` handler by filename, so server-side behavior, storage, retention, and access controls remain unverified. The client-side default-off change is not proof that all telemetry has been eliminated.
- `Website/UserControls/TrackingPixels/RobloxEventManager.ascx` contains an explicit `RobloxEventManager.initialize(true)` and configures an external `roblox.com/Game/EventTracker.ashx` listener. The two shared layouts reviewed earlier no longer include this partial, but the separate `/Tracking/EventManager` view and any other callers must be checked before removing the legacy event-manager subsystem.
- The legacy video pre-roll view currently sets `Roblox.VideoPreRoll.showVideoPreRoll = false`; however, the view is included by the game place-launcher view and the ad scripts remain bundled. The newer `videoPreRollDFP.js` contains age/segment, gender, game-genre, place-ID, and related ad-targeting fields. Do not enable this integration for BLOCK16 without a clear privacy policy, data-minimization review, and explicit product decision.
- Re-fetched the updated `EventTracker.js` from `block16-rebrand` after the change. This was source-level verification only; no browser network capture or runtime test was performed.


## Legacy event-manager endpoint disabled

- Replaced the contents of `Website/UserControls/TrackingPixels/RobloxEventManager.ascx` with a comment stating that legacy event tracking is disabled. The former partial initialized both Roblox and Google event listeners, enabled event forwarding, emitted page-view/return-visit events, and monitored legacy client-install events.
- This also disables that initializer when the standalone `/Tracking/EventManager` MVC view is requested, because that view renders this partial.
- The legacy JavaScript modules and tracking controller/view files remain in the repository; other independent initializers or direct external integrations may still exist. This change does not prove all third-party tracking is gone.
- Re-fetched the edited partial from `block16-rebrand` after the change. No browser network test was performed.


## Third-party advertising and CDN reduction

- Removed `GPTAdScript.js` from the base script bundle. The old Google Publisher Tag loader is therefore no longer injected through that bundle. The legacy source file remains in the repository but is not included by the reviewed base bundle.
- Replaced the game pre-roll partial's ad markup and targeting configuration with a minimal compatibility shim that loads the legacy `VideoPreRoll.js` object but explicitly keeps `showVideoPreRoll` and video logging disabled. This preserves the `Roblox.VideoPreRoll` object expected by legacy game-launch code while removing the old publisher key, targeting categories, place-specific ad categories, and visible ad container from this view.
- Replaced the standalone Google AdWords remarketing, vendor signup pixel, and JavaScript error-tracker views with inert comments. Direct requests to these views no longer emit those third-party scripts or pixels.
- Changed both shared layouts to load jQuery 1.7.2 and Microsoft Ajax from the repository's local paths directly, rather than contacting ajax.aspnetcdn.com first. This removes those CDN requests from the reviewed layouts.
- Important dependency caveat: the locally served jQuery and Microsoft Ajax files are still legacy versions. Self-hosting reduces third-party network exposure but does not patch known age-related dependency risk. Upgrade only after compatibility testing; do not mistake local hosting for a dependency security update.
- `EventTracker.js` now gates both timing-stat POSTs and named-event POSTs behind the same `transmitMetrics` flag, which defaults to false. Event names are URL-encoded if a future caller deliberately opts in. Local in-memory event logging remains.
- The legacy Google Analytics helper, Google/Mongo event listener modules, error-tracker JavaScript, and event-manager JavaScript remain in some script bundles for compatibility. The reviewed shared layouts no longer initialize their legacy tracker partials; the event-manager partial is inert; and the reviewed standalone error-tracker view is inert. A complete repository-wide caller/configuration and deployed-network audit is still needed before claiming no analytics or external telemetry can ever occur.
- The old `VideoPreRoll.js` implementation remains available because game-launch code references its object and methods. The BLOCK16 view forces the feature off. No external video-ad provider loader was found in the reviewed partial, but the old module should be retired once the launcher no longer depends on it.
- Re-fetched the edited views, layouts, bundle configuration, and client telemetry script from `block16-rebrand`. This was static source verification only; no .NET build, browser network capture, runtime game-launch test, or dependency vulnerability scan was performed.


## Additional profile output-encoding fixes

- Encoded the public profile heading's display name before assigning it to the Web Forms label.
- Encoded the dynamic last-location text before assigning it to the online/in-game status controls.
- Encoded the previous-usernames string specifically for its HTML title attribute. This string was previously concatenated into an HTML fragment without attribute encoding.
- Changed the badge description tooltip and badge name data bindings to encoded data-binding expressions (`<%#: ... %>`) so stored badge text is not emitted as raw markup.
- Re-fetched the edited profile code-behind and badge markup from `block16-rebrand`. This is a targeted XSS mitigation, not a complete review of all Web Forms controls, templates, and user-generated content.


## Legacy installer and installation-image review

A static review of the BLOCK16 branch found that `Website/Images/Install/` contains legacy Roblox-branded installation screenshots. The images name Roblox.exe, Roblox Corporation, old browser download prompts, and an InstallShield wizard. They do not describe a verified BLOCK16 Windows-client installation process and should not be used on new BLOCK16 download pages.

The reviewed `Website/Views/Game/ClientInstaller.cshtml` references external `images.rbxcdn.com` screenshots and links to `roblox.com/Download`; it is rendered by `Website/UserControls/ClientInstaller.ascx`. The associated `ClientInstallerViewModel` still configures a legacy plugin CLSID and install host. This path is not a verified BLOCK16 installer. Do not present it as a working BLOCK16 Windows-client download flow without a separate migration and runtime validation.

An asset audit note was added at `Website/Images/Install/README.md`. The legacy image files were intentionally not deleted or edited: repository-wide reference tracing is incomplete, and the actual BLOCK16 Windows installer/package format, publisher identity, signing, and supported Windows versions have not yet been established. Replacing words inside the old screenshots would preserve obsolete and potentially misleading steps.

Verification: static source and image inspection only. GitHub code search reported incomplete results, so global reference absence is not established. No build, installer test, browser test, or runtime test was performed.
