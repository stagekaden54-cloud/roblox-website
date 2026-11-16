# BLOCK16 Vercel frontend

This folder contains a static frontend slice for Vercel. The current homepage adapts the repository's legacy `Website/CSS/Base/CSS/LandingGames.css` and uses the matching artwork in `Website/Images/LandingGames/`.

## Frontend/backend boundary
- Vercel serves static HTML and CSS only.
- Legacy artwork is referenced from the repository's public raw GitHub paths for this initial slice.
- ASP.NET Web Forms/MVC pages, authentication, database access, membership operations, and game launching remain on a separate ASP.NET-compatible backend host.
- No login or signup form is submitted from this static page. Backend endpoints must not be guessed or enabled before the backend is ready.

## Vercel
Set the Vercel project's Root Directory to `vercel-frontend`. No framework or build command is required.

## Notes
- The HTML structure is a static adaptation around the real legacy stylesheet; it is not claimed to be recovered original page markup.
- The source stylesheet is preserved in `Website/CSS/Base/CSS/LandingGames.css`. The Vercel copy changes only the legacy image URL paths to the public raw repository asset URLs and adds responsive overrides.
- For a later production setup, consider serving a pinned copy of the image assets from the Vercel deployment rather than depending on raw GitHub URLs.
- Do not deploy the repository root or `Website` as a Vercel app. The legacy application requires an ASP.NET-compatible host.
