# BLOCK16 Tracking and Telemetry Audit

**Audit scope:** source files present on `security/staging-lockdown`  
**Purpose:** identify legacy tracking behavior and privacy-sensitive data flows before BLOCK16 is exposed to users.  
**Status:** initial static review; not a runtime network capture or a complete audit of every call site.

## Executive summary

The legacy source contains several deliberate tracking systems. Their presence is intentional in the codebase, but this alone does not establish who added each component, whether Intel personally reviewed it, or whether every integration is active in the current BLOCK16 build.

The most privacy-sensitive finding in this review is the browser tracing implementation: its default XHR span tags include the full page URL, request URL, authenticated user ID (or a guest sentinel), and browser user-agent string. The tracing implementation also supports a Lightstep tracer configured with an access token supplied through a page meta tag. This should not be enabled for BLOCK16 until the project has an authorized telemetry destination, a documented data-minimization policy, and an appropriate privacy notice.

The source also contains legacy Google Analytics integrations, signup event tracking, JavaScript error tracking, advertising conversion views, and performance telemetry settings. Their actual runtime activation depends on server-side control flow and configuration that must be verified in a controlled staging environment.

## Findings

### 1. Browser request tracing — high priority

Relevant files:

- `Website/js/robloxTracer/constants/configs.js`
- `Website/js/robloxTracer/libs/bootstrapTracer.js`
- `Website/js/robloxTracer/libs/instrumentation.js`
- `Website/js/robloxTracer/libs/tags.js`
- `Website/js/robloxTracer/libs/apiSiteRequestValidator.js`
- `Website/js/robloxTracer/robloxTracerEntry.js`

Observed behavior:

- A `roblox-tracer-meta-data` page meta element supplies the tracer-enabled flag, sample rate, service name, access token, allowed API-site list, and page-load instrumentation flag.
- Sampling can enable tracing for a configured percentage of page loads.
- The tracer implementation uses OpenTracing and the Lightstep tracer.
- Default XHR span tags include `http.method`, `http.url`, `page.name`, `page.url`, `user.id`, and `user.agent`.
- The page URL and request URL may contain query-string values. The code shown does not redact them before tagging.
- The user identifier is populated from the authenticated-user object, with `-1` as the fallback.
- The implementation has an API-site allow-list check restricted to configured Roblox hostnames.

Risk / recommendation:

- Do not enable this integration in BLOCK16 staging or production until its endpoint, access-token ownership, retention, access controls, and collected fields are understood.
- If tracing is later approved, remove or redact query strings and other sensitive URL components, avoid stable user identifiers unless strictly necessary, and document the exact telemetry fields.
- Verify that the page meta element cannot be populated from untrusted input.
- Confirm the actual Lightstep destination and account owner from authorized configuration; this static review does not establish where data would be received.

### 2. Google Analytics — high priority

Relevant files:

- `Website/UserControls/TrackingPixels/GoogleAnalytics.ascx`
- `Website/Views/Tracker/GoogleAnalytics.cshtml`
- `Website/js/GoogleAnalytics/GoogleAnalyticsEvents.js`
- `Website/WebCode/Settings/GoogleAnalytics.cs`

Observed behavior:

- The legacy control contains two hardcoded Universal Analytics property identifiers and a third account code supplied by server configuration.
- It loads the legacy Google Analytics script from Google's analytics host.
- Event helpers can send events, virtual page views, transaction totals, and transaction-item details.
- Signup-related helper code can emit signup events with age and gender parameters.
- Settings include controls for analytics sampling, content groups, performance events, and JavaScript exception logging.

Risk / recommendation:

- Treat all legacy Google Analytics properties as unapproved for BLOCK16 until ownership and authorization are confirmed.
- Do not send age, gender, transaction, account, or other user-linked values to analytics by default.
- Remove hardcoded legacy analytics property IDs from any BLOCK16 page that is intended to be user-facing.
- If analytics is approved, use a BLOCK16-owned property, collect only aggregate/minimal events, and provide clear notice and controls appropriate to the audience.

### 3. Signup and advertising tracking — high priority

Relevant files:

- `Website/js/Tracking/AsyncGoogleOnScript.js`
- `Website/js/Tracking/SignupTrackingScript.js`
- `Website/Views/Tracking/GoogleAdWordsConversionTracker.cshtml`
- `Website/Views/Tracking/VendorSpecificSignupTrackingPixel.cshtml`
- `Website/Controllers/TrackingController.cs`

Observed behavior:

- Signup helpers send an analytics event with age and gender parameters or trigger a signup event containing those values.
- The tracking controller exposes routes for event manager, Google AdWords conversion tracking, JavaScript error tracking, and vendor-specific signup tracking.
- On the audited branch, the Google AdWords conversion and vendor-specific signup views contain comments stating that legacy third-party tracking is disabled for BLOCK16.
- The controller still exposes the actions; a comment in a view is not proof that every caller or alternative tracking path is disabled.

Risk / recommendation:

- Keep advertising conversion and vendor-specific signup tracking disabled.
- Remove age and gender from analytics event payloads unless a clearly justified, approved requirement exists.
- Test the tracking routes and inspect rendered pages and network requests to confirm no third-party pixel is emitted.

### 4. JavaScript error tracking — medium priority

Relevant files:

- `Website/UserControls/TrackingPixels/JavascriptErrorTracker.ascx`
- `Website/Views/Tracking/JavascriptErrorTracker.cshtml`
- `Website/WebCode/Settings/GoogleAnalytics.cs`

Observed behavior:

- The user control initializes a JavaScript error tracker using a server-generated initialization parameter.
- Configuration includes a setting for JavaScript exception logging.

Risk / recommendation:

- Determine the destination, payload, retention, and whether stack traces or URLs can contain personal or secret information.
- Keep disabled until a BLOCK16-owned error-reporting service and redaction policy are approved.

### 5. Performance telemetry — medium priority

Relevant files:

- `Website/WebCode/Settings/PerformanceTracking.cs`
- `Assemblies/FloodCheckers/Roblox.FloodCheckers/Roblox.FloodCheckers/UIPerformanceTrackingFloodChecker.cs`
- `Assemblies/LightUtils/Roblox.LightUtils/Telemetry/Telemetry.cs`
- `Assemblies/LightUtils/Roblox.LightUtils/Extensions/TelemetryMiddlewareExtensions.cs`

Observed behavior:

- Settings expose rollout percentages, a guest-user enablement flag, user and feature whitelists, and a telemetry endpoint.
- The source contains telemetry middleware and UI-performance tracking components.
- This review did not establish the effective deployed values or the complete payload schema and destination.

Risk / recommendation:

- Keep rollout values at zero and endpoints unset in BLOCK16 until the implementation and payload are reviewed.
- Inspect all call sites and server-side configuration before enabling any collection.

## What this review does not prove

- It does not prove that Intel personally authored or reviewed these components.
- It does not prove that every tracker is active in the current build.
- It does not establish the current runtime configuration, actual network destinations, data retention, or access permissions.
- It is not a substitute for a runtime browser-network inspection and server-side configuration review.

## Required follow-up before public release

1. Inspect all layout, master-page, and page-level references to the tracking controls and scripts.
2. Review the effective staging configuration and rendered HTML for all tracking meta tags and analytics IDs.
3. Use browser developer tools in a controlled staging environment to inventory outbound requests and payload fields.
4. Confirm ownership and authorization for each destination and any access token without publishing secret values.
5. Disable integrations that are not required for BLOCK16; redact URL query strings and avoid age, gender, stable user IDs, and transaction details in telemetry.
6. Publish an understandable privacy notice before collecting any user-linked telemetry.
7. Add regression checks ensuring unapproved third-party tracking remains absent from rendered BLOCK16 pages.

## Current decision

**Do not remove or re-enable broad tracking functionality in this audit commit.** The current change is documentation-only. Any code-level disabling or removal should be a separate, narrowly scoped change after confirming call sites and compatibility.
