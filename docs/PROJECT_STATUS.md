# Project Status

## Project overview

Make My Marriage is a Sri Lankan wedding-planning application for couples, families, and invited collaborators. The approved MVP brings wedding workspaces, events, tasks, budgets and expenses, vendors, guests, invitations, RSVP, and documents into one place.

## Overall development status

**Application scaffold, public UI, PostgreSQL/Prisma foundation, and authentication database models complete.** Authentication API behavior, wedding-management features, other business database models, and third-party integrations have not started.

## Completed milestones

### Initial Project Scaffolding — Completed

**Summary:** Established the npm-workspaces monorepo and working frontend, backend, and shared-package foundation.

**Implemented:**

- Root npm workspaces for `apps/web`, `apps/api`, and `packages/shared`, with shared build, development, lint, and type-check scripts.
- Next.js App Router frontend in TypeScript with Tailwind CSS on port `3000`.
- Express backend in TypeScript on port `4000`, organized with configuration, middleware, and a domain health module.
- `GET /api/v1/health`, returning the shared typed and Zod-validated health response.
- Next.js `/api/v1/*` rewrite to the Express API and a browser-side health-request helper.
- Shared package exports for the application name, API base path, and health response schema/type.
- Example environment files, Git ignore rules, and ESLint/TypeScript configuration.

**Verification recorded:** workspace linting, type checking, builds, and the health endpoint were previously verified during scaffold delivery.

### Public Home Page — Completed

**Summary:** Replaced the scaffold placeholder with the responsive public Make My Marriage landing page, based on the approved Stitch visual direction and corrected to match the MVP scope.

**Implemented:**

- Server-rendered home page composed from reusable landing components.
- Responsive header with in-page navigation and a native mobile navigation menu.
- Hero workspace preview, approved MVP feature overview, planning-mode and role explanation, events/tasks/budget examples, vendor/guest/invitation/RSVP content, documents, CTA, and footer.
- Local Stitch monogram SVG asset and Plus Jakarta Sans through `next/font`.
- Accessible skip link, focus styles, reduced-motion handling, semantic headings, and account entry-point CTAs.
- Consistent fictional Sri Lankan sample data stored separately in `apps/web/src/content/landing-content.ts`.

**Important implementation notes:**

- Login and Create Your Wedding lead to the public authentication UI. They do not authenticate users or create weddings.
- The landing page has no API calls, Redux business state, backend integration, or database dependency.
- Financial examples are explicitly labelled as a fictional Owner view. Expenses and payments are described as manually recorded after payment outside the application.

**Verification recorded:** web linting, type checking, production build, and a local HTTP `200` check passed during landing-page delivery.

### Shared Authentication UI — Completed

**Summary:** Added the connected public Login, Create Account, and Forgot Password interface using the approved Stitch-derived visual direction and reusable frontend components.

**Implemented:**

- Public Next.js routes at `/login`, `/register`, and `/forgot-password` using one shared authentication layout, card, branding, footer, input styles, buttons, and responsive presentation.
- React Hook Form and Zod client-side validation with accessible labels, inline errors, keyboard focus, autocomplete attributes, and password visibility controls.
- Registration fields for first name, last name, email, password, and password confirmation. Passwords require at least 12 characters and must match; no character-composition rule is applied.
- Honest status messages for locally valid submissions. The forms make no authentication request, store no credentials or tokens, and do not simulate account creation, sign-in, redirects, or email delivery.
- Landing-page Log In and Create Your Wedding links now point to `/login` and `/register` respectively.

**Important implementation notes:**

- This is a UI-only milestone. Custom authentication, verification, password reset, JWT cookies, Session management, and wedding creation remain unimplemented.
- Password confirmation is isolated to the client-side registration form and is not prepared as a future API payload.

**Verification recorded:** web linting, type checking, and a production build completed successfully. The production route manifest contains all three public authentication routes.

### PostgreSQL + Prisma Foundation — Completed

**Summary:** Added a local PostgreSQL 17 service and connected the Express API through an API-owned Prisma 7.10 client without introducing business models.

**Implemented:**

- Local-only `docker-compose.db.yml` with PostgreSQL bound to `127.0.0.1:5433`, a health check, local development credentials, and a persistent named volume.
- Prisma 7.10 CLI, Client, PostgreSQL adapter, and `pg` driver installed only in the API workspace.
- Model-free Prisma schema and workspace-local `prisma7.config.ts`; no migration or artificial table was created.
- Validated private `DATABASE_URL`, one shared Prisma Client, database verification before Express listens, and graceful Prisma disconnection during shutdown.
- Root and API scripts for PostgreSQL lifecycle, Prisma validation and generation, connectivity checks, and future development/deployment migrations.
- Generated Prisma Client output is ignored and regenerated before API development, type checking, and builds.

**Important implementation notes:**

- The API health response remains unchanged. A separate `db:check` command executes `SELECT 1` through Prisma.
- The local host port is `5433` because an existing PostgreSQL process already uses port `5432`; PostgreSQL still uses port `5432` inside its container.
- The future AWS RDS connection will use the same private `DATABASE_URL` boundary. Production TLS and secret management remain implementation-stage decisions.
- Business database models, schema migrations, and authentication remain unimplemented.

**Verification recorded:** the PostgreSQL container reported healthy, Prisma schema validation and model-free Client generation passed, Prisma `SELECT 1` succeeded, API startup correctly failed while PostgreSQL was unavailable, the unchanged health endpoint returned HTTP 200 after reconnection, and repository linting, type checking, frontend build, and API build passed.

### Authentication Database Models — Completed

**Summary:** Added and migrated the database foundation for future registration, email verification, login, refresh-token rotation, session checks, and logout without implementing authentication APIs.

**Implemented:**

- Prisma `User`, `Session`, and `EmailVerificationToken` models with UUID primary keys, PostgreSQL timestamp and string types, mapped snake-case tables and columns, relationships, cascade deletion, unique constraints, and query indexes.
- Nullable `last_name` as specified by the approved Database Design. The `User` table has no global wedding role; roles remain wedding-scoped future data.
- Argon2id password-hash storage only. The schema has no raw-password field.
- Fixed-length SHA-256 hash storage for refresh and email-verification tokens. The schema has no raw-token fields.
- Session metadata for atomic refresh-token replacement and later stale-token handling: `refresh_token_version`, `last_rotated_at`, fixed absolute expiry, and revocation time.
- One current email-verification-token record per user, supporting 24-hour single-use tokens and invalidation of previous unused links on resend.
- Initial migration `20260921125253_init_authentication`, creating only the three authentication application tables plus Prisma's migration metadata.

**Important implementation notes:**

- Access JWTs will last 15 minutes. Refresh sessions will have a fixed seven-day absolute expiry that rotation must not extend. Email-verification tokens will last 24 hours.
- Simultaneous refresh handling, stale-token reuse behavior, protected-request Session checks, Argon2id execution, JWTs, cookies, Resend, and all authentication endpoints remain future API work.
- `PasswordResetToken`, wedding tables, and other business models were intentionally excluded.

**Verification recorded:** Prisma formatting, validation, migration status, and Client generation passed; PostgreSQL connectivity succeeded; the live catalog confirmed all tables, columns, nullability, primary keys, cascade foreign keys, unique constraints, and indexes; repository linting, type checking, frontend and API builds, and the unchanged health endpoint passed.

## Features in progress

No major feature is currently recorded as in progress.

## Planned features

The following approved MVP areas are planned but not implemented:

- Remaining approved business database models and migrations
- Custom authentication APIs, email verification behavior, password reset, JWT cookies, refresh rotation, and session enforcement
- Wedding workspace creation and wedding-scoped authorization
- Members, Owner/Admin/Family Member/Collaborator permissions, and collaborator resource assignments
- Events, tasks, budgets, expenses, vendors, Google Places discovery, guests, invitations, RSVP, and documents
- Redux Toolkit business state, API integrations, Resend email, private Amazon S3 documents, and MVP deployment infrastructure

## Important implementation notes

- The approved requirements in `PRD.md`, `System-Architecture.md`, `Database-Design.md`, and `API-Design.md` remain the source of truth.
- The six implementation-stage groups in PRD Section 41 remain the implementation-question record. Authentication lifetimes, rotation, and prompt Session revocation are now finalized there; the remaining details must be resolved before implementing affected behavior.
