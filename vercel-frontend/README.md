# BLOCK16 Vercel frontend

This folder contains a static frontend slice for Vercel. The page uses the repository's legacy `Website/CSS/Base/CSS/LandingGames.css` styling and the matching artwork in `Website/Images/LandingGames/`.

## Frontend/backend boundary
- Vercel serves static HTML and CSS only.
- Legacy game artwork is referenced from the repository's public raw GitHub paths for this initial slice.
- ASP.NET Web Forms/MVC pages, authentication, database access, membership operations, and game launching remain on a separate ASP.NET-compatible backend host.
- The Login label is intentionally non-functional. No login or signup form is submitted from this static page, and no backend endpoints are guessed or enabled.

## Vercel
Set the Vercel project's Root Directory to `vercel-frontend`. No framework or build command is required.

## Notes
- The static page removes the generated preview panel and generic marketing copy. It presents the original game artwork as a simple classic-style game strip.
- This is a static adaptation using the repository's real legacy assets and stylesheet, not a claim that the original page markup has been recovered.
- The Vercel stylesheet preserves the legacy image dimensions and sprite positioning, with responsive sizing for narrow screens.
- For production, serve a pinned copy of the image assets from the Vercel deployment rather than depending on raw GitHub URLs.
- Do not deploy the repository root or `Website` as a Vercel app. The legacy application requires an ASP.NET-compatible host.
