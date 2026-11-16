# BLOCK16 D1 backend migration

## Scope of this phase

This change introduces a D1 schema and an opt-in D1 data path for player profiles and the published games catalogue. It deliberately keeps the existing authentication provider in place for now. The Worker still validates sessions through the current auth provider; D1 receives the authenticated provider user ID as the stable player ID.

This is a staged migration, not a production cutover. When `env.DB` is bound, profile reads/writes and game catalogue reads use D1. Without that binding, the existing Supabase database path remains as a compatibility fallback.

## Database schema

Apply `migrations/0001_initial_schema.sql` to a new development D1 database first. It creates:

- `players`: stable player IDs and email addresses
- `profiles`: usernames, display names, avatar URLs, and bios
- `games`: game metadata and publication status
- `friendships`: player connection requests and relationships
- `game_favorites`: saved games

The first profile request for an authenticated player creates a minimal D1 player/profile row if one does not exist. It does not import other players or game records.

## Create a development database

Do this only when ready to provision a separate development database:

```sh
npx wrangler d1 create block16-dev
```

Copy the returned database ID into the Worker configuration. Add the binding (do not commit a placeholder ID):

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "block16-dev",
    "database_id": "YOUR_DEVELOPMENT_DATABASE_ID",
    "migrations_dir": "migrations"
  }
]
```

Then apply the schema to the development database:

```sh
npx wrangler d1 migrations apply block16-dev --remote
```

For local development, use `--local` instead of `--remote`.

## Data migration and cutover

No existing Supabase records are copied by this PR. Before switching a live environment:

1. Create and validate a D1 development database.
2. Export and review the existing profiles and games data.
3. Write and test an idempotent import that preserves player IDs, game IDs, slugs, and timestamps.
4. Verify row counts and representative records.
5. Configure a development Worker with the D1 binding and test all affected endpoints.
6. Plan authentication separately. This phase intentionally does not replace Supabase Auth or change signup/login behavior.
7. Only after explicit approval, schedule a production data migration and binding change.

Never place service-role credentials, passwords, access tokens, or private keys in this repository. Keep production bindings and secrets in the Cloudflare environment configuration.
