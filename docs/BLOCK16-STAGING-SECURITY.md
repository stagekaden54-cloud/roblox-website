# BLOCK16 staging security status

This document describes the deliberately restricted configuration on the
`security/staging-lockdown` branch. It is not a production deployment guide.

## Current safeguards

- Account creation in `RobloxMembershipProvider.CreateUser` fails closed.
- Password reset and password change are not implemented; do not enable them.
- The legacy administration path is explicitly denied to all users in
  `Website/Web.config`.
- Game joining and the listed game-join processors are disabled in
  `Roblox.GameLaunch.Properties.Settings.config`.
- The tracked environment API key is blank.
- Legacy service domains and the installer host use reserved `.invalid`
  placeholders. These are intentionally non-routable and must not be replaced
  with third-party endpoints without authorization.
- The tracked machine-key file uses `AutoGenerate,IsolateApps`, suitable only
  for a single IIS host. Multi-node deployments require a separately managed,
  shared key supplied through a secret store, never committed here.
- The CI workflow checks these staging defaults before building.

## Credential incident response

The prior revision contained a non-empty `EnvironmentApiKey` value and fixed
machine-key material. Removing values from the current branch does not remove
them from Git history, forks, downloaded artifacts, or caches.

A repository/service owner should:
1. Determine whether the old values were active credentials or only placeholders.
2. Revoke or rotate any active credential with its issuing service.
3. Generate new machine-key material for the actual hosting environment.
4. Store credentials in the host's secret-management facility.
5. Avoid posting credentials in issues, pull requests, chat, logs, or source files.

History rewriting is not a substitute for rotating exposed credentials.

## Authentication work still required

The legacy membership provider is not a production-ready BLOCK16 identity
system. It delegates password validation to legacy platform services and has
unimplemented account-management operations. Account creation currently fails
closed. Do not enable registration, password changes, password reset, or
self-service account recovery until a BLOCK16-owned identity service is
designed, implemented, independently reviewed, and tested.

A safe replacement needs, at minimum:
- A maintained password-hashing library using a modern password KDF with
  per-account salts and configurable work factors.
- Rate limiting and abuse controls for sign-in and recovery.
- Secure, single-use, expiring recovery tokens.
- Email verification without account-enumeration leaks.
- Session rotation after authentication and privilege changes.
- CSRF protection for state-changing requests.
- Audited role assignment with deny-by-default authorization.
- Tests for account takeover, session handling, authorization boundaries,
  password storage, and recovery flows.

Do not attempt to retrofit password hashing by simply changing the legacy
provider's `PasswordFormat` property; the backing credential service must be
designed and migrated consistently.

## Role and administration work still required

The legacy role provider has incomplete management methods and depends on
legacy platform role services. The administration route stays blocked. A
future BLOCK16 admin system must use server-side role checks tied to a
BLOCK16-controlled data source, least privilege, audit logging, and tests
proving ordinary users cannot access administrator functions. Never reopen
the route with an authenticated-user-only rule.

## Service and domain migration

Before enabling any integration, inventory the code paths that call each
external service, identify the owner and license/permission basis, and decide
whether BLOCK16 will replace or intentionally retain that dependency. Configure
only domains and credentials controlled by BLOCK16 or explicitly authorized
for this project. Keep unknown services disabled.

The current `.invalid` values are placeholders. Replace them only after the
real BLOCK16 domain, CDN, download host, and service architecture are approved.

## Deployment gate

Do not publish this legacy ASP.NET Framework application to the public
internet based only on a successful compile. It requires a compatible,
maintained Windows/IIS host, private staging, dependency review, security
testing, and an adult/qualified operator responsible for hosting and credentials.
