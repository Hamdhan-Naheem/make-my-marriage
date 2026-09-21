# Make My Marriage

Make My Marriage is an npm-workspaces monorepo with a Next.js frontend, an Express
API, and a shared package. The public home page and authentication UI are present.
Registration, Sign In, database-backed sessions, refresh rotation, logout, and the
frontend authentication flow are implemented. Email verification, password recovery,
wedding features, and the remaining business models are still pending.

## Requirements

- Node.js 22.12 or newer (validated with 22.12.0).
- npm 10 or newer (validated with 10.9.0).
- Docker Desktop with Docker Compose for the local PostgreSQL service.
- Run installation and the commands below from the repository root.

The official Next.js scaffold selected Next.js 16.3.5 and React 19.2.8.
TypeScript stays on the compatible 5.9 line used by the scaffold and ESLint tooling.
`typescript-eslint` is pinned to 8.55.0 across workspaces: later versions pull in a
visitor dependency requiring Node 22.13+, above the installed 22.12.0. ESLint 9 follows
the official scaffold and remains compatible here, although npm marks that release
line as deprecated. Revisit these lint-tool versions when the Node baseline is upgraded.
`package-lock.json` records exact installed dependency versions across all workspaces.

## Structure

```text
make-my-marriage/
├── apps/
│   ├── web/                 # Next.js App Router, port 3000
│   │   ├── src/app/         # Public, authentication, and account routes
│   │   └── src/lib/api.ts   # Same-origin browser API client
│   └── api/                 # Express, port 4000
│       ├── prisma/          # Authentication schema and committed migration
│       ├── prisma7.config.ts
│       └── src/
│           ├── app.ts       # Middleware and route composition
│           ├── server.ts    # Environment, listener, shutdown
│           ├── config/      # Zod environment validation
│           ├── middleware/  # Safe errors and missing routes
│           ├── modules/     # Authentication and health domains
│           └── shared/      # Backend-only HTTP response types
├── packages/shared/         # Shared constants and health response schema/type
├── docs/                    # Existing finalized documents, preserved
├── AGENTS.md
├── package.json
├── package-lock.json
├── eslint.config.mjs
├── docker-compose.db.yml    # Local PostgreSQL 17
├── .gitignore
├── .env.example
└── README.md
```

The existing documentation directory is `docs/`, not `doc/`. It has not been renamed
or duplicated. Read [AGENTS.md](AGENTS.md) and the relevant [PRD](docs/PRD.md),
[architecture](docs/System-Architecture.md), [database design](docs/Database-Design.md),
and [API design](docs/API-Design.md) before implementing features.

## Install and run

```bash
npm install
npm run db:up
npm run db:check
npm run dev
```

Before running the database or API commands, create the ignored API environment file:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
```

On macOS or Linux, use `cp apps/api/.env.example apps/api/.env`.

For repeatable installation from the lockfile, use `npm ci` instead of `npm install`.
There is one root lockfile. Do not install dependencies independently inside each app.

| Root command | Purpose |
| --- | --- |
| `npm run dev` | Watch the shared package and run both applications |
| `npm run dev:web` | Watch shared code and run only Next.js on port 3000 |
| `npm run dev:api` | Build shared code and run only Express on port 4000 |
| `npm run build` | Build shared code first, then Next.js and Express |
| `npm run typecheck` | Build shared declarations and type-check all workspaces |
| `npm run lint` | Run configured ESLint checks in all workspaces |
| `npm test` | Migrate only the separate test database, then run API unit and HTTP integration tests |
| `npm run start:web` | Run the built Next.js app on port 3000 |
| `npm run start:api` | Run the built Express API on port 4000 |
| `npm run db:up` | Start the local PostgreSQL 17 container |
| `npm run db:down` | Stop PostgreSQL while preserving its named volume |
| `npm run db:status` | Show the local PostgreSQL container status |
| `npm run db:logs` | Show PostgreSQL container logs |
| `npm run db:check` | Execute `SELECT 1` through Prisma |
| `npm run db:test:setup` | Safely create the configured local test database if it is missing |
| `npm run db:test:migrate` | Provision the test database and apply committed migrations to it |
| `npm run prisma:validate` | Validate the Prisma schema |
| `npm run prisma:generate` | Regenerate the ignored Prisma Client output |

Use separate terminals for the two production start commands after `npm run build`.
Stop development processes with Ctrl+C. npm workspaces handle the package links. If
you change `packages/shared` while using `dev:api`, run `npm run build:shared` again.

## Environment and API communication

The API requires a PostgreSQL connection. Copy `apps/api/.env.example` to
`apps/api/.env` for the approved local Docker configuration.

| Local file | Variable | Purpose/default |
| --- | --- | --- |
| `apps/api/.env` | `PORT` | `4000` |
| `apps/api/.env` | `DATABASE_URL` | Required; the example targets `127.0.0.1:5433` |
| `apps/api/.env` | `TEST_DATABASE_URL` | Required for tests; must point to a separate database |
| `apps/api/.env` | `WEB_ORIGIN` | Trusted browser origin; `http://localhost:3000` locally |
| `apps/api/.env` | `JWT_ACCESS_SECRET` | Required random secret of at least 32 characters |
| `apps/api/.env` | `JWT_REFRESH_SECRET` | Required separate random secret of at least 32 characters |
| `apps/api/.env` | `AUTH_ALLOW_UNVERIFIED_DEV` | `false`; enable only for intentional local testing |
| `apps/web/.env.local` | `API_ORIGIN` | `http://localhost:4000` |

The root `.env.example` is a reference; root `.env` is not loaded automatically. Do
not use a root `PORT` variable to configure both apps. Next.js stays on port 3000 via
its scripts. `DATABASE_URL` is private API configuration and must never use a
`NEXT_PUBLIC_` prefix.

Next.js forwards `/api/v1/*` to Express using a rewrite. Browser authentication uses
same-origin requests and HttpOnly cookies, so no permissive CORS configuration or
public environment variable is needed. State-changing authentication requests must
match `WEB_ORIGIN`. `API_ORIGIN` is server configuration, not a place to embed
credentials. Restart development after changing it; rebuild Next.js when changing the
origin for a production build.

Generate two different cryptographically random JWT secrets rather than keeping the
example placeholders, and store them only in ignored `apps/api/.env`. Never commit or
log secret values. The unverified-email bypass is rejected unless the database and web
origin use confirmed local development settings; production startup rejects it.

Environment files, dependency folders, generated declarations/output, Next.js build
files, and logs are ignored by Git. Example environment files remain trackable.

## Shared package

`@make-my-marriage/shared` exports the application name, API base path, and a health
response Zod schema with its inferred TypeScript type. It contains no server secrets,
database code, or business models. Both applications consume the package by name.

Shared TypeScript compiles to ESM JavaScript and declarations in `dist/`. Root
development/build/typecheck commands build it before consumers need it. Development
commands watch shared changes; direct workspace commands assume it is already built.

The health module uses routes, a controller, and a service. Its response contract is
unchanged. The API verifies PostgreSQL connectivity before listening, while the
separate `db:check` command performs an explicit `SELECT 1` through Prisma.

## Local database and Prisma

`docker-compose.db.yml` runs PostgreSQL 17 on `127.0.0.1:5433` and stores its data in
a named Docker volume. Port 5433 avoids the existing local PostgreSQL service on port
5432. `npm run db:down` does not delete the volume.

Prisma 7.10 is configured in `apps/api/prisma7.config.ts`. The schema currently contains
only `User`, `Session`, and `EmailVerificationToken`; wedding and password-reset models
remain future work. Client generation runs before API development, builds, and type
checks. Generated client files are ignored by Git.

When approved models are added later, create and apply a development migration with:

```bash
npm run db:migrate:dev
```

Enter a descriptive migration name when Prisma prompts, then review and commit the
generated SQL. Future deployment pipelines will apply committed migrations with
`npm run db:migrate:deploy`; do not create migrations directly against production.

Tests use `apps/api/prisma7.test.config.ts` and `TEST_DATABASE_URL`. The setup and
migration commands refuse to run unless this URL names a database ending in `_test`
and its database name is distinct from `DATABASE_URL`. They never reset or drop a
database.

For a fresh local setup, start PostgreSQL and provision the isolated database before
running its committed migrations:

```bash
npm run db:up
npm run db:test:setup
npm run db:test:migrate
```

`db:test:setup` creates `make_my_marriage_test` when it is missing and is safe to run
again. Automatic creation is limited to PostgreSQL on localhost; a remote test database
must be provisioned separately. `npm test` runs `db:test:migrate` automatically before
the API test suite, so the same checks protect normal test runs. Keep both URLs in the
ignored `apps/api/.env` file, using the development database for `DATABASE_URL` and the
separate test database for `TEST_DATABASE_URL`.

## Authentication flow

- `/register` creates an unverified account and honestly states that no verification
  email was sent.
- `/login` creates a fixed seven-day Session and sets 15-minute access and rotating
  refresh JWTs in HttpOnly, SameSite=Lax cookies. Production cookies are Secure.
- `/account` loads the safe current-user response from `/api/v1/auth/me` and provides
  logout. The browser performs at most one shared refresh attempt before retrying `/me`.
- Tokens are never returned in JSON or stored in Redux, `localStorage`, or
  `sessionStorage`. PostgreSQL stores only the SHA-256 refresh-token hash.

Email verification is still required by the product. Until that milestone is built,
local testing may explicitly set `AUTH_ALLOW_UNVERIFIED_DEV=true`. This never changes
`emailVerifiedAt` and cannot be enabled with production or remote service settings.

## Verify the scaffold

```bash
npm ls --workspaces --depth=0
npm run db:up
npm run db:status
npm run prisma:validate
npm run prisma:generate
npm run db:check
npm test
npm run typecheck
npm run lint
npm run build
npm run dev
```

Open http://localhost:3000 to see **Make My Marriage**. Check both the direct API
and the frontend rewrite in another terminal:

```bash
curl http://localhost:4000/api/v1/health
curl http://localhost:3000/api/v1/health
```

On Windows PowerShell, use `curl.exe` or `Invoke-RestMethod` for those URLs.
Both should respond with HTTP 200 and:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "make-my-marriage-api"
  }
}
```

An unknown API URL returns a JSON 404, not an HTML error page. API unit and HTTP
integration tests run against the separate test database and cover registration,
authentication, sessions, cookie behavior, refresh races, revocation, and logout.

## Scope

Redux Toolkit remains the approved state-management library; authentication tokens are
never Redux state. Email verification, password recovery, remaining business models,
integrations, application containerization, AWS deployment, and all wedding features
remain separate tasks. Do not use shadcn/ui, alternative package managers, or monorepo
orchestration frameworks. Do not commit or push automatically.
