# BLOCK16 Vercel frontend

This folder is the intentionally small, static frontend slice for Vercel.

## Included
- Static homepage
- Static Windows client information page
- BLOCK16 logo and favicon
- Standalone responsive CSS

## Not included
The legacy ASP.NET WebForms/MVC application, authentication services, database access, account operations, and server-side membership logic remain outside this Vercel project.

## Vercel setup
Create or configure a Vercel project linked to this repository and set its **Root Directory** to `vercel-frontend`. No framework or build command is required; this is a static HTML/CSS site.

Do not deploy the repository root or the `Website` directory as a Vercel app. The legacy application requires an ASP.NET-compatible host.

The backend origin and any reverse-proxy routes must be configured only after the legacy backend has a confirmed public HTTPS origin. Do not point login or account links at an unverified host.
