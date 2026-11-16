# BLOCK16 Legacy Website — Complete Source Inventory and Recovery Notes

**Repository:** `stagekaden54-cloud/roblox-website`  
**Working branch at inventory time:** `block16-rebrand`  
**Inventory branch:** `docs/block16-complete-legacy-inventory`  
**Inventory date:** 2026-11-15 (UTC repository timestamps may display as 2026-11-16)  
**Purpose:** Record what is actually present before making further restoration changes. This is a static repository review, not a successful runtime audit.

## 1. Executive summary

The repository contains a large legacy-style ASP.NET website project and a separate small static Vercel frontend. The legacy website is the appropriate codebase to investigate for the classic BLOCK16 experience. The separate Vercel frontend is not a substitute for the legacy application and should not become the design source of truth.

Important distinctions:

- The repository README describes this project as a **recreation** of a Roblox-era website and explicitly says the Website project's frontend code is recreated. It does not claim that the website project is Roblox Corporation's original proprietary website source.
- The repository is a public fork of `Intelinsidecom/Roblox-Website`; preserve attribution and verify contributor permissions and asset rights before redistributing or deploying.
- The current `Website/Default.aspx` is already a BLOCK16-branded custom page. It is not evidence of an intact original Roblox 2016 homepage.
- The MVC home view is a very small BLOCK16 placeholder. The games controller is commented out, and the profile controller method is empty.
- The project contains substantial legacy CSS, JavaScript, images, user controls, Web Forms pages, MVC views, and backend/assembly projects. Those assets should be inspected and reused where appropriate instead of inventing a new design.
- The website targets .NET Framework 4.7.2 and uses ASP.NET Web Forms plus ASP.NET MVC 5. It is intended for Windows/IIS. Vercel's normal static/Node hosting is not a direct runtime for this application.

## 2. Repository facts

Repository metadata observed during this review:

- Public repository: `stagekaden54-cloud/roblox-website`
- Default branch reported by GitHub: `2016`
- Active BLOCK16 integration branch reviewed: `block16-rebrand`
- Parent repository: `Intelinsidecom/Roblox-Website`
- Repository has no GitHub license detected in metadata. No license file was identified in the root inventory; confirm this directly before publishing or redistributing code/assets.
- Recursive Git tree for `block16-rebrand`: 13,311 entries (not truncated).
- `Website/`: 2,884 tracked tree entries.

Selected `Website/` inventory counts (these include directories and files where applicable, and are path-prefix counts rather than a count of compiled/runtime components):

| Area | Observed entries |
|---|---:|
| CSS | 372 |
| JavaScript | 659 |
| Images | 1,113 |
| UserControls | 165 |
| Views | 60 |
| Controllers | 24 |
| WebCode | 92 |
| App_Themes | 36 |
| App_Data | 19 |

The repository also contains a large `Assemblies/` tree with many C# projects and supporting libraries. Its full dependency graph has not yet been validated.

## 3. Technology and hosting architecture

### Confirmed from project files

- `Website/Roblox.Website.csproj` targets **.NET Framework 4.7.2**.
- ASP.NET Web Forms is present through `.aspx`, `.ascx`, master pages, code-behind, and designer files.
- ASP.NET MVC is present; the project references MVC 5.2.9 and Razor/WebPages 3.2.x packages.
- `Website/Web.config` configures ASP.NET, membership, role management, session state, machine-key configuration, handlers, modules, and IIS behavior.
- `Website/Roblox.Website.sln` is the website solution.
- `Website/App_Start/RouteConfig.cs` configures MVC routes and explicitly avoids routing physical Web Forms/handler files through MVC.
- `Website/App_Start/BundleConfig.cs` registers legacy JavaScript and CSS bundles through the project's static-content layer.
- `Website/Roblox.Master` is the main Web Forms master page. It wires navigation, footer, tracking controls, client installer, place launcher, and modal controls.
- `Website/Simple.Master` is also present and should be reviewed when tracing pages that do not use the main master.

### Hosting consequence

The legacy website cannot be deployed as-is to a normal Vercel static site or standard Vercel Node.js project. A compatible Windows/IIS environment is required for its ASP.NET Framework runtime and supporting assemblies. Vercel may still host a static frontend or selected static assets, but that does not make the ASP.NET application executable there.

Do not point production traffic, login links, or account forms at an unverified backend origin.

## 4. Main page and navigation findings

### `Website/Default.aspx`

Observed behavior:

- Uses `~/Roblox.Master`.
- Contains a BLOCK16-branded banner, two-column layout, and project status text.
- Includes links to `/games`, `/Catalog`, `/leaderboards`, `/News/`, `/download/windows`, and `/Login/`.
- States account registration is unavailable and says the page does not collect account details.
- Uses inline CSS with a 970px desktop width and a narrow-screen media query.

This is a custom transitional BLOCK16 homepage, not a verified preserved 2016 Roblox homepage. Its links must be checked against real route implementations before being advertised as functional.

### `Website/Default.aspx.cs`

- Authenticated visitors are redirected to `~/My/Home.aspx`.
- Anonymous visitors are shown the BLOCK16 project homepage.
- The code comment says not to transfer anonymous visitors to legacy signup.

### `Website/Roblox.Master` and `Website/Roblox.Master.cs`

The main master page establishes the shared shell:

- MenuRedesign, UserSubmenu, Footer user controls.
- Tracking-pixel controls for Google Analytics, JavaScript errors, Roblox event manager, and Urchin.
- ClientInstaller and PlaceLauncher controls.
- Upsell and confirmation modal controls.
- CSS and JavaScript bundle placeholders.
- jQuery 1.7.2 and MicrosoftAjax CDN references with local fallbacks.
- A 970px body container and an advertising iframe placeholder.
- An XSRF token initialization call and frame-navigation script.

The code-behind attempts to render CSS and JavaScript bundles and metadata. Several bundle-rendering exceptions are swallowed. This means a page rendering without an obvious exception does not prove all legacy assets are loading correctly.

**Recovery implication:** Trace the master page and registered controls before replacing navigation or rebuilding page shells. Tracking and launcher controls must remain disabled or safely gated until separately reviewed.

## 5. MVC controllers and views

### Controllers observed

The `Website/Controllers/` directory includes:

- AccountController
- AuthenticationController
- BuildController
- BundlesController
- DownloadController
- GameController
- GamesController
- HomeController
- ItemsController
- LandingController
- MobileAppApiController
- NewLoginController
- ProfileController
- ReferenceController
- ReplicatedCssController
- ReplicatedCssControllerBase
- ThumbnailController
- ThumbnailsController
- TrackerController
- TrackingController
- UserAdsController
- UserCheckController
- VisitButtonController

The inventory confirms these files exist; it does not imply every action is implemented or safe to expose.

### Specific controller findings

- `HomeController.Index` redirects unauthenticated requests to `~/Login`, then returns the Home view for authenticated users.
- `GamesController.cs` currently has its shown `GetGamesJson` implementation commented out.
- `ProfileController.GetProfile` currently has an empty method body.
- `LandingController.Animated` has GET and POST actions. The POST action calls a signup helper with form-supplied birthday, gender, username, and password fields. This is a legacy registration surface and must not be made publicly usable until a new BLOCK16-specific authentication and privacy design is implemented and reviewed.
- Debug-only Ping and DebugLinks actions are compiled under `#if DEBUG`; they should not be exposed in production.

### Views observed

The MVC view tree includes:

- Home: About, Contact, Index
- Landing: Animated
- Navigation: AlertsAndOptions, Banner, Footer, GameClientBrowsing, Navigation, SignupOrLogin, UserSubmenu
- NewLogin: Index
- Game: ClientInstaller, PlaceLauncher, VideoPreRoll
- Build: Assets, Games, GamesByContext
- Places: Access, AdvancedSettings, BasicSettings, Icons
- Shared: Dialog, Error, metadata views, event/telemetry initializers, and layout files
- Tracking: GoogleAnalytics, EventManager, GoogleAdWordsConversionTracker, JavascriptErrorTracker, VendorSpecificSignupTrackingPixel
- UserAds and VisitButton views

### Home view status

`Website/Views/Home/Index.cshtml` currently renders a minimal BLOCK16 heading and welcome message. It is not a completed classic homepage.

### Landing view warning

`Website/Views/Landing/Animated.cshtml` contains a legacy signup/login interface and references old scripts, CAPTCHA-related UI, a YouTube embed, and POST targets. It should be treated as inactive legacy code until the authentication flow, third-party dependencies, age/privacy handling, and backend services are replaced or verified.

## 6. Legacy page map

`Website/PageMap.txt` provides a useful route/page inventory. Routes listed there include:

- Home: `/home`
- Games: `/games`
- Game detail: `/games/{id}/{name}`
- Catalog: `/catalog`
- Catalog item: `/catalog/{id}/{name}`
- Library item: `/library/{id}/{name}`
- Profile: `/users/{id}/profile`
- Favorites: `/users/{id}/favorites`
- Inventory: `/users/{id}/inventory`
- Avatar: `/my/avatar`
- Groups: `/groups/{id}/{name}` and `/groups/create`
- Group search: `/search/groups`
- Player search: `/search/users`
- Friends: `/users/{id}/friends`
- Messages: `/my/messages`
- Settings: `/my/account`
- Premium/membership and Robux upgrade routes
- Login: `/login`
- Forgot credentials: `/login/forgot-password-or-username`
- Two-step verification route
- Landing: `/` and `/account/signupredir`

This is a historical route map, not proof that each route currently resolves. Each path needs a route-to-controller/page check and a runtime smoke test in an isolated environment.

## 7. Visual assets and styling inventory

The legacy website has a large asset base:

- `Website/CSS/`: 372 entries, including base CSS for Roblox shell, navigation, games, catalog, profile, signup, footer, modals, and other page areas.
- `Website/App_Themes/RobloxDefault/`: populated theme stylesheets for areas such as Badges, Frontpage, Membership, Profile, Roblox, Splash, Toolbox, and User.
- `Website/App_Themes/RobloxV3/`, `RobloxV4/`, and `RobloxV5/`: many stylesheet files are present but several observed files are zero bytes. Do not assume all theme variants are complete.
- `Website/Images/`: 1,113 entries, including branding and landing assets.
- `Website/js/`: 659 entries, including legacy site scripts and feature-specific scripts.

Candidate CSS files for further inspection include:

- `Website/CSS/Base/CSS/Roblox.css`
- `Website/CSS/Base/CSS/Navigation2014.css`
- `Website/CSS/Base/CSS/Games.css`
- `Website/CSS/Base/CSS/Catalog.css`
- `Website/CSS/Base/CSS/Profile.css`
- `Website/CSS/Base/CSS/Frontpage.css`
- `Website/CSS/Base/CSS/LandingGames.css`
- `Website/CSS/Base/CSS/Header.css`
- `Website/CSS/Base/CSS/Footer.css`
- `Website/CSS/Base/CSS/Signup.css`

These are candidates, not confirmed exact 2016 design matches. Inspect their content, referenced images, page bundle inclusion, and commit history before selecting them.

## 8. Separate Vercel frontend

The repository also contains `vercel-frontend/`, with:

- `index.html`
- `styles.css`
- `README.md`
- `assets/` including BLOCK16 logo and icon assets

Its README says it is a small static frontend slice and explicitly excludes the legacy ASP.NET WebForms/MVC application, authentication services, database access, account operations, and server-side membership logic. It instructs Vercel to use `vercel-frontend` as the root directory and warns not to deploy the repository root or `Website/` as a Vercel app.

The homepage in that folder is the recently created AI-styled visual preview that the project owner rejected as the design foundation. Treat it as a temporary/secondary preview only. Do not keep extending it as a replacement for the legacy site. Decide separately whether to archive it, replace its contents with a thin static asset host, or use it only as a temporary project-status page. No deletion is recommended as part of this inventory.

## 9. Security and privacy guardrails

Security changes previously merged into `block16-rebrand` through PR #1 must be preserved. The security review documented:

- Legacy membership creation and password-reset operations are not ready for public use.
- Password reset is disabled in configuration.
- The legacy role provider and admin tooling require a BLOCK16-specific authorization model.
- The `/Admi` area is explicitly denied to all users in `Website/Web.config`. Do not weaken this rule.
- Legacy machine-key configuration was changed to auto-generated keys; a multi-node deployment would require a deliberate, secure shared-key strategy.
- Legacy environment/API credentials and external service hosts were blanked or replaced with non-routable `.invalid` placeholders in reviewed configuration.
- Game launching and related processor settings were disabled in reviewed configuration.
- The static tracking audit identified Google Analytics, advertising conversion, vendor signup, JavaScript error tracking, and OpenTracing/Lightstep-style telemetry callsites. The audit was static source inspection, not a runtime network capture. It does not prove that tracking is active or malicious.
- Keep analytics, advertising pixels, user-linked telemetry, external event destinations, and client/game launching disabled until ownership, payload minimization, consent/notice, retention, and security are reviewed.

Never copy historical secrets from Git history into current configuration. If any historical credential was real, rotate or revoke it with its owner. Do not publish secrets in issues, commits, or documentation.

## 10. Build and runtime status: what is and is not proven

### Known from source/configuration

- The project is designed for Windows and IIS.
- The README's documented prerequisites include Windows 10+, .NET Framework developer packs (4.7.2 or 4.8.1 mentioned), Visual Studio 2022 for debugging, and ASP.NET/IIS features.
- The README describes a build process using `build.cmd` and launch via `launch.cmd`, or hosting through IIS Manager.
- The Website project references many assemblies and packages, including some relative HintPaths that appear to refer to directories outside the repository layout. These must be validated in a clean checkout.
- `Website/Web.config` has production-oriented HTTPS cookie settings and IIS handler/module configuration.

### Not proven by this document

- A complete clean build of all projects from a fresh checkout.
- A successful end-to-end IIS deployment.
- Whether every historical page, route, API, database, storage service, thumbnail service, or game-launch path works.
- Whether all third-party URLs and external service integrations are available or authorized.
- Whether the Vercel URL is publicly accessible without SSO/protection.
- Whether the repository contents reproduce the exact Roblox 2016 production website.

## 11. Recommended restoration plan

Work incrementally, preserving the legacy source and avoiding broad rewrites.

### Phase 0 — Baseline and provenance

1. Preserve the current security changes and branch history.
2. Confirm the upstream repository, contributors, permissions, and asset redistribution rights.
3. Record the exact commit used for each audit.
4. Inspect Git history for provenance; never infer that a file is original Roblox code from its name or appearance.

### Phase 1 — Static source map

1. Trace the master pages and shared navigation controls.
2. Trace `Default.aspx`, the MVC Home view, and Landing routes.
3. Map Games, Catalog, Profile, Login, and user/account pages to their actual controllers, Web Forms pages, controls, models, and CSS/JS bundles.
4. Record missing/empty files and unresolved dependencies.
5. Identify the exact CSS and image assets used by each page.

### Phase 2 — Clean build feasibility

1. Use a clean Windows build runner and the documented build scripts.
2. Inventory missing HintPath assemblies, packages, native dependencies, and configuration inputs.
3. Build the Website and dependent assemblies without enabling external integrations.
4. Record warnings and errors as separate actionable items.
5. Do not solve build errors by deleting major legacy functionality or replacing the application with a mockup.

### Phase 3 — Safe isolated runtime

1. Stand up an isolated IIS staging environment, not production.
2. Use test-only configuration and no real user data.
3. Keep account creation, login, password reset, admin, payments, telemetry, ads, and game launching disabled.
4. Test anonymous read-only pages first.
5. Capture browser network requests and console errors to identify missing resources and external calls.

### Phase 4 — Page-by-page recovery

Suggested order:

1. Shared master page, header, navigation, footer, CSS bundles, and assets.
2. Anonymous homepage.
3. Games browse/list page (read-only, test data).
4. Catalog browse page (read-only, test data).
5. Public profile page (synthetic test data).
6. Login page shell only, with no credential submission.
7. Other pages only after their dependencies and security posture are documented.

For each page, record:
- Source entry point and route.
- Master/layout and user controls.
- Controller/action or Web Forms code-behind.
- CSS/JS bundles and image dependencies.
- Backend services and database dependencies.
- External network destinations.
- Security/privacy concerns.
- Build status and runtime smoke-test evidence.
- Whether the page is preserved, adapted, blocked, or still a placeholder.

### Phase 5 — Hosting decision

Choose a supported host for the ASP.NET Framework application. Keep Vercel for static files or a modern frontend only if a clear need remains. Do not attempt to make Vercel run the .NET Framework application by copying the Website folder into a static project.

## 12. Immediate next tasks

- [ ] Inspect the full `Roblox.Master` dependency chain and navigation user controls.
- [ ] Trace `Website/Default.aspx` and determine whether its current content should be retained only as a transitional BLOCK16 page.
- [ ] Inspect the original-looking Games and Catalog Web Forms/MVC files and identify actual entry points.
- [ ] Inspect profile page implementations and user controls.
- [ ] Map all login/signup endpoints and keep them non-operational.
- [ ] Verify which CSS and image assets belong to the intended 2016 timeframe.
- [ ] Check all external script, iframe, analytics, advertising, thumbnail, and API destinations.
- [ ] Validate project HintPaths and clean Windows build feasibility.
- [ ] Produce a page-by-page status matrix before changing application code.

## 13. Review references

- Repository: https://github.com/stagekaden54-cloud/roblox-website
- Legacy Website project: https://github.com/stagekaden54-cloud/roblox-website/tree/block16-rebrand/Website
- Main master page: https://github.com/stagekaden54-cloud/roblox-website/blob/block16-rebrand/Website/Roblox.Master
- Main master code-behind: https://github.com/stagekaden54-cloud/roblox-website/blob/block16-rebrand/Website/Roblox.Master.cs
- Main Web Forms homepage: https://github.com/stagekaden54-cloud/roblox-website/blob/block16-rebrand/Website/Default.aspx
- MVC home view: https://github.com/stagekaden54-cloud/roblox-website/blob/block16-rebrand/Website/Views/Home/Index.cshtml
- MVC route config: https://github.com/stagekaden54-cloud/roblox-website/blob/block16-rebrand/Website/App_Start/RouteConfig.cs
- Legacy page map: https://github.com/stagekaden54-cloud/roblox-website/blob/block16-rebrand/Website/PageMap.txt
- Vercel frontend notes: https://github.com/stagekaden54-cloud/roblox-website/blob/block16-rebrand/vercel-frontend/README.md
- Previous recovery-plan PR: https://github.com/stagekaden54-cloud/roblox-website/pull/3
- Previous security PR: https://github.com/stagekaden54-cloud/roblox-website/pull/1

---

**Status:** Inventory documentation only. No application source files, production settings, authentication behavior, tracking behavior, or deployment settings were changed by this document.
