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

## Static games catalogue preview
- `games.html` is a static Vercel page linked from the homepage Games navigation item.
- Its two named game tiles use the repository's verified legacy Crossroads and Swordfight artwork from the `2016` source branch; the "See more games" artwork is presented separately as a legacy visual element, not mislabeled as a game.
- Layout and hover-sprite behavior are adapted from `Website/CSS/Base/CSS/LandingGames.css`. The original games-page CSS documents the legacy game-item dimensions and layout, but the original JavaScript requests server-rendered game rows from ASP.NET endpoints. That runtime has not been ported to Vercel.
- Tiles are intentionally non-launching. No game IDs, play URLs, live filters, analytics, account forms, or backend endpoints are fabricated.
- The page is a source-based static preview, not the original ASP.NET Games page running unchanged.

## Static legacy genre browsing
- The Games page now exposes genre names based on the verified Website/Images/GenreIcons assets in the repository's 2016 branch: Adventure, Castle, City, Classic, Cthulu, FPS, Fantasy, Funny, LOL, Modern Military, Ninja, Pirate, RPG, Scary, Sci-Fi, Skatepark, Sports, Town and City, Tutorial, War, and Wild West.
- Genre icons are loaded from those matching legacy asset paths. The genre chips, genre selector, search box, reset control, and name sort run entirely in games.js against the two preview entries.
- Crossroads and Swordfight are the only entries currently present in the static preview and are labeled Classic. Other genres correctly show an empty-state message until real game records are supplied.
- Sorting is explicitly limited to name A–Z / Z–A. The 2016 GamesListBehavior.js and GamesPageContainerBehavior.js depend on server-rendered /games/moreresultscached and /games/moreresultsuncached responses plus legacy filter state; those endpoints are not called or copied into this static page.
- Live popularity, ratings, time windows, search across the full catalogue, pagination, and game launch remain backend responsibilities. No fake ratings, play counts, game IDs, or endpoints are introduced.
