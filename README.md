# Make My Marriage

Initial npm monorepo scaffold. The frontend has a placeholder homepage; the backend
has a health endpoint. No database, authentication, wedding features, deployment,
or third-party service integrations are implemented yet.

## Requirements

- Node.js 22.12 or newer (validated with 22.12.0).
- npm 10 or newer (validated with 10.9.0).
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
│   │   ├── src/app/         # Placeholder, layout, Tailwind CSS
│   │   └── src/lib/api.ts   # Browser-side health request helper
│   └── api/                 # Express, port 4000
│       └── src/
│           ├── app.ts       # Middleware and route composition
│           ├── server.ts    # Environment, listener, shutdown
│           ├── config/      # Zod environment validation
│           ├── middleware/  # Safe errors and missing routes
│           ├── modules/health/
│           └── shared/      # Backend-only HTTP response types
├── packages/shared/         # Shared constants and health response schema/type
├── docs/                    # Existing finalized documents, preserved
├── AGENTS.md
├── package.json
├── package-lock.json
├── eslint.config.mjs
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
npm run dev
```

For repeatable installation from the lockfile, use `npm ci` instead of `npm install`.
There is one root lockfile. Do not install dependencies independently inside each app.

| Root command | Purpose |
| --- | --- |
| `npm run dev` | Watch the shared package and run both applications |
| `npm run dev:web` | Watch shared code and run only Next.js on port 3000 |
| `npm run dev:api` | Watch shared code and run only Express on port 4000 |
| `npm run build` | Build shared code first, then Next.js and Express |
| `npm run typecheck` | Build shared declarations and type-check all workspaces |
| `npm run lint` | Run configured ESLint checks in all workspaces |
| `npm run start:web` | Run the built Next.js app on port 3000 |
| `npm run start:api` | Run the built Express API on port 4000 |

Use separate terminals for the two production start commands after `npm run build`.
Stop development processes with Ctrl+C. `concurrently` runs the watchers together;
it is not a build system. npm workspaces handle the package links.

## Environment and API communication

No environment files or credentials are required to run the defaults.

| Optional local file | Variable | Default |
| --- | --- | --- |
| `apps/api/.env` | `PORT` | `4000` |
| `apps/web/.env.local` | `API_ORIGIN` | `http://localhost:4000` |

Copy the corresponding app's `.env.example` only if you need overrides. The root
`.env.example` is a reference; root `.env` is not loaded automatically. Do not use a
root `PORT` variable to configure both apps. Next.js stays on port 3000 via its scripts.

Next.js forwards `/api/v1/*` to Express using a rewrite. Browser requests use a
relative URL, so no permissive CORS configuration or public environment variable is
needed. `API_ORIGIN` is server configuration, not a place to embed credentials.
Restart development after changing it; rebuild Next.js when changing the origin
for a production build. No authentication or business proxy logic is present.

Environment files, dependency folders, generated declarations/output, Next.js build
files, and logs are ignored by Git. Example environment files remain trackable.

## Shared package

`@make-my-marriage/shared` exports the application name, API base path, and a health
response Zod schema with its inferred TypeScript type. It contains no server secrets,
database code, or business models. Both applications consume the package by name.

Shared TypeScript compiles to ESM JavaScript and declarations in `dist/`. Root
development/build/typecheck commands build it before consumers need it. Development
commands watch shared changes; direct workspace commands assume it is already built.

The health module uses routes, a controller, and a service. No empty repository or
Prisma setup is added because the health check does not access a database.

## Verify the scaffold

```bash
npm ls --workspaces --depth=0
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

An unknown API URL returns a JSON 404, not an HTML error page. There is no automated
unit-test suite yet; the commands and HTTP checks above verify this initial scaffold.
Future features should add relevant tests with their implementation.

## Scope

Redux Toolkit remains the approved state-management library; no business state is
needed in this scaffold. Prisma/PostgreSQL, authentication, integrations, Docker,
AWS deployment, and all wedding features remain separate tasks. Do not use shadcn/ui,
alternative package managers, or monorepo orchestration frameworks. Do not commit
or push automatically.
