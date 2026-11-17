# BLOCK16 static frontend

This directory contains BLOCK16's static HTML, CSS, JavaScript, and image assets. It is served by **Cloudflare Workers Static Assets**; the historical directory name `vercel-frontend` is retained for now to avoid a broad asset-path rename.

There is no Vercel runtime, Vercel Function, or Vercel proxy required by this project.

## Cloudflare hosting

- `wrangler.jsonc` is the existing production Worker configuration. Its Worker name remains `block16`.
- `wrangler.preview.jsonc` is an isolated development configuration for `block16-auth-preview`. It binds the development D1 database `block16-accounts-dev` and serves this same static asset directory.
- `worker/index.mjs` handles `/api/*` before static asset serving. The D1 username/password endpoints are available at `/api/v2/auth/*`.
- `account-d1.html` is the development account page. It calls `/api/v2/auth/*` on the same host, so browser requests and HttpOnly session cookies stay same-origin.

To deploy the isolated preview from a local checkout after authenticating Wrangler with the appropriate Cloudflare account:

```sh
npx wrangler deploy --config wrangler.preview.jsonc
```

This command targets `block16-auth-preview`, not the production Worker. Do not use the production configuration for account-auth testing until the migration has been reviewed and separately approved.

## Frontend/backend boundary

- Static pages and assets are served by Workers Static Assets.
- API requests are handled by the Cloudflare Worker.
- The D1 account preview is separate from the existing Supabase authentication routes.
- The account preview does not migrate or modify existing accounts.
- Membership, payments, game launching, and unfinished navigation remain non-functional until their backend behavior is implemented and reviewed.

## Legacy-inspired pages

- The navigation structure is adapted from `Website/UserControls/Navigation/MenuRedesign.ascx` and its corresponding legacy CSS.
- The Games page uses verified Crossroads and Swordfight artwork and clearly limits the current catalogue to those preview entries.
- Genre browsing is local to the preview data; live popularity, ratings, pagination, and game launching are not fabricated.
- The Catalog page uses verified legacy category artwork. It does not invent item listings, prices, creator identities, or purchase actions.
- The Membership page is a visual concept only and does not offer real plans, billing, or subscriptions.
- Original BLOCK16 vector artwork is documented in `docs/BLOCK16-ORIGINAL-ARTWORK.md`.

## Asset and rights notes

The source repository does not provide a general license for all legacy assets. Any individual permission for specific images applies only to those identified files and does not establish permission for unrelated assets, contributor work, Roblox trademarks, or other intellectual property. Preserve the original written permission record with the project documentation.
