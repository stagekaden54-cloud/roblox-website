# BLOCK16 Original Website Recovery

## Goal

Use the repository's existing legacy ASP.NET website as the implementation foundation. Do not continue expanding the separate AI-styled `vercel-frontend` mockup as the product website. Preserve the existing source and make bounded compatibility/security changes only after each area has been inspected.

## What the repository actually contains

- The repository README describes this as a Roblox website recreation and identifies **2016 as the main recreation target**, with 2013 as an earlier starting point. It does not establish that these files are Roblox Corporation's original proprietary source code.
- The legacy website is an ASP.NET Web Forms / ASP.NET MVC application targeting **.NET Framework 4.7.2**.
- `Website/Roblox.Master` is the Web Forms master page. It wires in the navigation, footer, client installer, place launcher, and modal controls.
- `Website/UserControls/Navigation/MenuRedesign.ascx` contains the legacy navigation structure and links to Home, Games, Catalog, Build, Membership, Forum, and additional sections.
- `Website/CSS/Base/CSS/MenuRedesign.css`, `Navigation2014.css`, the `App_Themes/RobloxV*` stylesheets, and the existing `Website/Images` assets are part of the legacy visual system and should be reused rather than replaced with newly invented styling.
- The repository contains substantial legacy assets and scripts. The recursive tree contains 13,310 entries, including 2,884 under `Website/`; the tree also includes generated Visual Studio cache files under `Assemblies/.vs` that should not be treated as application source.
- The project README's build instructions call for Windows, the .NET Framework developer pack, Visual Studio, and ASP.NET/IIS. The website project file targets .NET Framework 4.7.2 and enables IIS Express.

## Important gaps found during initial inspection

- `Website/Default.aspx` currently contains a custom BLOCK16 landing layout with inline CSS and newly written copy. It is not evidence of an intact original 2016 homepage.
- `Website/Views/Home/Index.cshtml` is currently only a small BLOCK16 placeholder.
- `Website/Controllers/GamesController.cs` has its former implementation commented out, and `Website/Views/Build/Games.cshtml` is empty. The navigation's Games link therefore does not by itself prove that a working games browser exists.
- `Website/My/Home.aspx` currently contains placeholder text.
- `Website/Roblox.Website.csproj` includes references to DLLs through relative paths outside the repository tree. Those dependencies must be inventoried before a complete Windows/IIS runtime can be expected to work.
- The standalone `vercel-frontend/` directory is a separate static mockup. It is not the legacy ASP.NET application and cannot run its Web Forms/MVC server-side code.

## Hosting constraint

Vercel's standard static/frontend hosting cannot execute ASP.NET Web Forms or the .NET Framework 4.7.2 application. Keep the legacy app as the source of truth and plan for a compatible Windows/IIS host for the application runtime. Vercel may still serve static assets or a separately designed frontend if that is useful, but it must not be mistaken for the original ASP.NET application.

## Recovery rules

1. Do not overwrite or delete legacy pages, stylesheets, scripts, or assets simply to make the static mockup look closer.
2. Map each desired page to its existing Web Forms/MVC implementation and dependencies before changing it.
3. Reuse existing page markup, user controls, CSS, JavaScript, and images wherever their provenance and licensing permit.
4. Do not reactivate account creation, password reset, admin functions, game launching, telemetry, ad tracking, or external service calls until their dependencies, authorization, privacy, and security have been reviewed.
5. Preserve the existing fail-closed security changes in `Web.config` and `Website/App_Data/Configuration`.
6. Make compatibility fixes in small isolated commits and verify them with the Windows/.NET Framework build workflow.
7. Keep the Vercel mockup separate until a hosting architecture is chosen; do not represent it as a working recreation of the legacy website.

## Next inspection targets

- Trace how `Roblox.Master` chooses Web Forms versus MVC navigation and which bundles/styles are loaded.
- Inventory the actual 2016-era page markup and its linked CSS/JS/image dependencies.
- Map Games, Catalog, Profile, Login, and Home routes to real controllers/pages, and record which are complete, placeholders, or disconnected.
- Inventory unavailable external DLL references, database/service dependencies, and legacy URLs without restoring live credentials or unsafe integrations.
- Decide on a Windows/IIS staging environment before attempting to expose the legacy application publicly.
