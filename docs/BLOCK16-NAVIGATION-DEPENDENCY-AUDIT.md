# BLOCK16 Navigation and Shared-Shell Dependency Audit

**Branch reviewed:** `block16-rebrand`  
**Review type:** Static source inspection only  
**Runtime validation:** Not performed  
**Source changes:** None

## Executive summary

The current application configuration selects the Web Forms navigation implementation. The legacy navigation and styling are already present in the repository, so the next restoration work should preserve those components rather than replace them with a newly generated header.

The shared master page also loads a broad legacy JavaScript bundle containing analytics/event infrastructure and error-reporting code. The presence of these scripts does not prove that data is currently transmitted, but they must be audited and gated before a public deployment.

## 1. Active navigation selection

Evidence:

- `Website/WebCode/Settings/SiteConfig.cs` defines `Navigation.UseMvcNavBar` with a default of `false`.
- `Website/App_Data/Configuration/site-settings.json` explicitly sets `"UseMvcNavBar": false`.
- `Website/UserControls/Navigation/MenuRedesign.ascx` renders the Web Forms menu when the flag is false and the MVC partial when it is true.

**Conclusion:** The configured path is Web Forms navigation, not the MVC navigation partial.

Relevant implementations:

- Web Forms: `Website/UserControls/Navigation/MenuRedesign.ascx` and `.ascx.cs`
- MVC: `Website/Views/Navigation/Navigation.cshtml`
- MVC CSS: `Website/CSS/PartialViews/Navigation.css`
- Web Forms header CSS: `Website/CSS/Base/CSS/MenuRedesign.css`

The Web Forms code-behind also registers `CSS/PartialViews/Navigation.css` through `RobloxCSS.PageCSS.Add`, so the configured Web Forms path may load both the shared MVC navigation stylesheet and the legacy MenuRedesign stylesheet. This overlap should be tested in a Windows/IIS runtime before attempting cleanup.

## 2. Master page and CSS/JavaScript loading

`Website/Roblox.Master` registers the navigation controls, tracking controls, installer/launcher controls, and modal controls. It places the navigation, submenu, advertisement iframe, page content, and footer into shared layout regions.

`Website/Roblox.Master.cs` calls:

- `RobloxCSSShim.RenderBundleHtml("main")`
- `RobloxCSSShim.RenderHtml(StaticContent.GetPageCSSBundle())`
- `RobloxScriptsShim.RenderBundle("master")`
- `RobloxScriptsShim.Render(StaticContent.GetPageScriptBundle())`

The master bundle is registered in `Website/App_Start/BundleConfig.cs`. Its script list includes, among other files:

- `GoogleAnalytics/GoogleAnalyticsEvents.js`
- `JSErrorTracker.js`
- `RobloxEventManager.js`
- `RobloxEventListener.js`
- `GoogleEventListener.js`
- `MongoEventListener.js`
- `SiteTouchEvent.js`
- `XsrfToken.js`
- `DropDownNav.js`
- `UpsellAdModal.js`

**Privacy note:** Several of these files implement event reporting or error telemetry. The master page also registers tracking user controls. Static inspection cannot establish whether all of those systems initialize or transmit in the current runtime. Do not assume they are harmless simply because the current settings file leaves the analytics account code unset. Audit initialization paths, destinations, payloads, and consent/notice behavior before enabling any telemetry.

The master page currently initializes the XSRF client token with an empty string. Do not replace this with a guessed token or weaken server-side request protections.

## 3. Navigation dependencies and functional limits

The Web Forms navigation links to legacy destinations including Home, Games, Catalog, Build, Membership, Forum, Browse, Contests, News, and Help. The MVC navigation uses a different link set and includes a Windows Client link.

The presence of a link is not proof its destination is implemented, routed, safe, or operational. Each destination must be checked against physical Web Forms pages, MVC controllers/actions, handlers, and the existing route configuration before it is represented as working.

The anonymous navigation control links to the legacy signup/login routes and embeds the legacy iframe login page. Those account flows must remain disabled or non-submitting until the authentication implementation and privacy/security behavior have been independently reviewed.

The authenticated navigation control reads the current user and renders account-related information. Its logout handler submits a POST request to `/authentication/logout` with the anti-forgery token. Preserve the POST/CSRF behavior; do not convert logout to a GET request.

## 4. Footer inconsistency

`Website/UserControls/Navigation/Footer.ascx` does not contain a `YearLabel` server control. However, `Footer.ascx.cs` assigns `YearLabel.Text` during `Page_Load`, and the generated designer file declares the field.

This is a likely runtime null-reference defect if the footer control loads as written. It should be confirmed in a Windows/IIS runtime and corrected in a separate, narrowly scoped source-change PR only after validation. This audit intentionally does not change the footer.

The MVC footer partial, `Website/Views/Navigation/Footer.cshtml`, is currently empty.

## 5. Other source-level issues to validate

- `MenuRedesign.ascx` contains a suspicious closing `</>` immediately after the News link. Confirm whether this produces malformed rendered markup and fix only if reproduced.
- The Web Forms and MVC navigation menus differ in destinations and labels. Avoid switching the feature flag as a visual shortcut.
- `NavigationViewModel` calls `Global.MembershipDomainFactories.UserFactory.GetCurrentUser()`; the MVC navigation path therefore depends on membership infrastructure.
- The master page includes an advertisement iframe at `/userads/1`. Keep advertising delivery disabled until reviewed.
- The master page registers `ClientInstaller` and `PlaceLauncher`. Keep actual installation/game launching disabled pending the existing security review.

## 6. Recommended restoration order

1. Reproduce the configured Web Forms navigation under a Windows/IIS runtime and capture its rendered DOM and network requests.
2. Verify all navigation CSS, image, and JavaScript asset paths resolve; record missing files and 404s.
3. Confirm the dropdown behavior with `DropDownNav.js` and the existing menu markup.
4. Confirm the footer null-reference issue and empty MVC footer partial.
5. Map each visible link to an actual page/controller/handler and classify it as implemented, placeholder, unavailable, or unsafe to expose.
6. Audit shared tracking/advertising scripts and controls before any public runtime is enabled.
7. Only then make minimal source changes in separate PRs, preserving the legacy layout and existing security gates.

## Scope and limitations

This document records static source findings from the current `block16-rebrand` branch. It does not claim the site builds, runs, or is publicly accessible. No application code, authentication, telemetry, launch behavior, configuration, or deployment settings were changed.
