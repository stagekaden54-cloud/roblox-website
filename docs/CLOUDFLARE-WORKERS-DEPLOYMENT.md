# Cloudflare Workers deployment

BLOCK16's current frontend is a static HTML/CSS/JavaScript site in
`vercel-frontend/`. The ASP.NET backend is not part of this deployment and
must remain hosted separately.

## Worker configuration

The repository-root `wrangler.jsonc` configures the existing Cloudflare Worker
named `roblox-website` to serve the contents of `./vercel-frontend` as
Workers Static Assets.

This is an assets-only Worker configuration: it intentionally has no
`main` entrypoint and no `ASSETS` binding. Cloudflare documents that the
binding is unnecessary when there is no Worker script.

## Workers Builds settings

After this pull request has been reviewed and merged, connect the GitHub
repository to the existing Worker in Cloudflare's Workers Builds settings and
use:

- Repository: `stagekaden54-cloud/roblox-website`
- Production branch: `block16-rebrand`
- Root directory: repository root (`.`)
- Build command: leave empty (the frontend has no build step)
- Deploy command: `npx wrangler deploy`
- Preview command: keep Cloudflare's provided default unless Cloudflare's UI
  indicates a required value
- Preview builds: enable if you want branch previews

Do not select the repository's default branch: it is `2016`, not
`block16-rebrand`.

## Important deployment boundary

Adding this configuration does not deploy anything or change the existing
Worker. Do not run a deployment until the pull request is reviewed and merged
and the GitHub connection/branch settings have been checked. The first
successful deployment will replace the Worker’s current starter response with
the static BLOCK16 frontend.

This frontend deployment does not add authentication, registration, account
recovery, payments, membership purchases, or game launching. Those features
remain unavailable until a separate backend implementation is ready and
reviewed.

## References

- [Workers Static Assets configuration](https://developers.cloudflare.com/workers/static-assets/binding/)
- [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)
- [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
