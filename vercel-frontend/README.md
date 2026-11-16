# BLOCK16 Vercel frontend

This folder contains a static frontend slice for Vercel, using real legacy website artwork and a static adaptation of the original Web Forms navigation structure.

## Frontend/backend boundary
- Vercel serves static HTML, CSS, images, and small client-side interactions only.
- Legacy game artwork is referenced from the repository's public raw GitHub paths for this preview.
- ASP.NET Web Forms/MVC pages, authentication, database access, membership operations, and game launching remain on a separate ASP.NET-compatible backend host.
- The Login label is intentionally non-functional. Navigation destinations are also intentionally inactive until their corresponding pages are verified and hosted. No credentials are collected and no backend endpoints are guessed or enabled.

## Legacy navigation
- The menu labels, order, and dropdown grouping are based on `Website/UserControls/Navigation/MenuRedesign.ascx`.
- The source's legacy styling reference is `Website/CSS/Base/CSS/MenuRedesign.css`; the static frontend uses a small responsive CSS adaptation rather than loading the ASP.NET-era stylesheet wholesale.
- The menu's More dropdown supports pointer, keyboard Escape, and accessible expanded-state behavior.
- The original Web Forms source contains an extra closing `</>` after the News item; this static markup uses valid HTML instead.
- The source menu also has separate anonymous and authenticated controls. Those account-specific controls are not reproduced because authentication is not connected.

## Vercel
Set the Vercel project's Root Directory to `vercel-frontend`. No framework or build command is required.

## Notes
- The homepage keeps the existing legacy game artwork and adds the source-based navigation as a separate feature.
- This is a static adaptation using the repository's legacy navigation structure, not a claim that the original ASP.NET menu can run on Vercel.
- Keep account actions, tracking pixels, advertising frames, installers, and game launching out of this static frontend until their behavior and privacy/security implications are reviewed.
