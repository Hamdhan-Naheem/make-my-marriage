# Project Status

## Project overview

Make My Marriage is a Sri Lankan wedding-planning application for couples, families, and invited collaborators. The approved MVP brings wedding workspaces, events, tasks, budgets and expenses, vendors, guests, invitations, RSVP, and documents into one place.

## Overall development status

**Application scaffold, public UI, PostgreSQL/Prisma foundation, authentication, email verification, wedding onboarding, wedding workspace creation/settings, and end-to-end Events management are complete.** Password recovery, remaining business models, and third-party integrations remain pending.

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

**Summary:** Added the initial public Login, Create Account, and Forgot Password interface using the approved Stitch-derived visual direction and reusable frontend components.

**Implemented:**

- Public Next.js routes at `/login`, `/register`, and `/forgot-password` using one shared authentication layout, card, branding, footer, input styles, buttons, and responsive presentation.
- React Hook Form and Zod client-side validation with accessible labels, inline errors, keyboard focus, autocomplete attributes, and password visibility controls.
- Registration fields for first name, last name, email, password, and password confirmation. Passwords require at least 12 characters and must match; no character-composition rule is applied.
- Honest status messages for locally valid submissions in the initial UI milestone.
- Landing-page Log In and Create Your Wedding links now point to `/login` and `/register` respectively.

**Important implementation notes:**

- This milestone began as UI-only. Registration and Sign In were connected in the later Authentication Integration and Sessions milestone; Forgot Password remains UI-only.
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

### Registration API — Completed

**Summary:** Added `POST /api/v1/auth/register` for creating an unverified user. The Register UI was connected in the later Authentication Integration and Sessions milestone.

**Implemented:**

- Modular Express authentication route, controller, service, repository, schema, and reusable password-hashing module.
- Strict Zod validation for required names, normalized email, and an exact 12–128 character password; unsupported account properties are rejected.
- Explicit Argon2id hashing with 19 MiB memory, two iterations, parallelism one, and library-generated cryptographically secure salts.
- Normalized-email duplicate detection backed by PostgreSQL's unique constraint, including safe concurrent-registration handling.
- At this milestone, a safe `201 Created` response stated that verification was required and no verification email was sent; the later Email Verification milestone replaced this with the generic `202 Accepted` delivery flow.
- Route-specific in-memory rate limiting at 10 attempts per IP per 15 minutes, standard rate-limit headers, bounded JSON bodies, and safe validation, duplicate, oversized-body, rate-limit, and unexpected-error responses.
- Isolated test-database configuration plus focused Node test-runner and Supertest coverage.

**Important implementation notes:**

- At this milestone, registration created only an unverified `User`; token creation and email delivery were added later.
- The temporary `409 EMAIL_ALREADY_REGISTERED` behavior was replaced by the generic registration response in the Email Verification milestone.
- The in-memory limiter matches the single-process MVP. Nginx proxy-trust configuration remains deployment-stage work.
- `argon2` 0.44.0 is used because 0.45.1 fell back to native compilation on the current Windows/Node environment and the required Visual Studio C++ toolchain is unavailable.

**Verification recorded:** six unit tests and seven HTTP integration tests passed against a separate migrated PostgreSQL test database. Repository linting, application and test type checks, frontend and API production builds, concurrent duplicate registration, Argon2id verification, rate limiting, data isolation from Session/verification-token records, body-size enforcement, and the unchanged health endpoint all passed.

### Authentication Integration and Sessions — Completed

**Summary:** Connected Sign Up and Sign In end to end, implemented secure database-backed browser sessions, and added a minimal authenticated account screen without introducing wedding features.

**Implemented:**

- Connected `/register` to the real Registration API with loading, disabled, field-error, duplicate-email, rate-limit, server-error, and honest success states. `confirmPassword` remains client-only.
- Added `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `POST /api/v1/auth/refresh`, and `POST /api/v1/auth/logout` in the modular Express authentication domain.
- Exact email normalization and password preservation, Argon2id verification, generic invalid-credential responses, and a 10-attempts-per-IP/15-minute in-memory login limiter.
- Separate HS256 access and refresh JWT secrets; strict signature, algorithm, issuer, audience, expiry, and token-type validation. Access tokens last 15 minutes and fixed Session expiry is seven days.
- HttpOnly, SameSite=Lax access and refresh cookies; production cookies are Secure. Tokens are not returned in JSON or stored in Redux, `localStorage`, or `sessionStorage`.
- SHA-256 refresh-token hashes in PostgreSQL, atomic hash/version rotation, Session checks on every protected request, prompt logout revocation, and cookie clearing.
- Concurrent refresh handling through one conditional-update winner. A losing request within five seconds receives `409 REFRESH_ALREADY_ROTATED` without clearing cookies; later stale-token reuse revokes the Session.
- Exact trusted-Origin checks on cookie-setting and cookie-changing authentication routes. Browser requests use the existing same-origin Next.js API rewrite without permissive CORS.
- `/account` loads the safe user through `/auth/me`, performs at most one shared refresh before one retry, displays name/email/verification state, and provides working logout. It is not a wedding dashboard.
- Added a Redux Toolkit authentication slice and root provider that bootstrap the safe current user from `/auth/me`; access and refresh tokens remain exclusively in HttpOnly cookies.
- Made the landing-page navigation and primary account CTAs session-aware: guests see Log In/Create Your Wedding, while authenticated users see My Account linking to `/account`.
- Added client route guards so authenticated users cannot reopen `/login` or `/register`, and guests visiting `/account` are redirected to `/login?returnTo=%2Faccount` without rendering private account details.
- Logout now revokes the existing backend Session, clears the shared frontend user state, and updates protected navigation immediately. Returning home from `/account` preserves the session.

**Important implementation notes:**

- Local JWT secrets are generated into ignored `apps/api/.env`; tracked files contain placeholders only. Access and refresh secrets must differ.
- Email verification and Resend were completed in the later Email Verification milestone. The temporary unverified-development bypass was removed.
- Forgot Password remains UI-only. No password-reset model or endpoint was added.
- `/account` remains the temporary authenticated destination until the approved wedding dashboard is implemented. Registration still creates an unverified account without creating a session or claiming that an email was sent.
- The current in-memory rate limiters suit the single-process MVP. Nginx proxy trust and distributed limiting remain deployment work.
- The production dependency audit still reports four pre-existing high advisories in the Prisma CLI dependency chain. The reported fixes require changing the approved Prisma version and were not applied automatically.

**Verification recorded:** 16 unit tests and 14 HTTP integration tests passed against the separate migrated test database. Repository linting and type checks passed, frontend and API production builds passed, and a live Next.js-rewrite flow returned health 200, registration 201, login 200, current user 200, refresh 200, logout 204, and post-logout current user 401. The generated live-test account was removed from the test database. Authentication-aware navigation subsequently passed focused web linting, type checking, and a production build containing `/`, `/account`, `/login`, and `/register`.

### Email Verification with Resend — Completed

**Summary:** Completed registration verification delivery, secure token consumption, resend recovery, and the matching public frontend flow without adding password recovery.

**Implemented:**

- Registration creates the unverified `User` and one 24-hour verification-token record atomically, stores only a SHA-256 hash, and sends the raw 256-bit token only through the Resend adapter.
- New and duplicate registrations return the same conditional `202 Accepted` response without claiming that an account or email was created or sent.
- `POST /api/v1/auth/verify-email` atomically verifies the user and consumes the token once. Expired, invalid, replaced, and reused tokens share a safe error.
- `POST /api/v1/auth/resend-verification` uses an enumeration-safe response, replaces previous unused links, enforces IP and persistent per-account cooldowns, and permits immediate retry after delivery failure.
- Resend delivery failures preserve the account and remove the unusable token so the resend path is immediately available.
- Added `/verify-email` and `/resend-verification` using the existing authentication layout, plus registration and login links into the verification flow.
- Removed `AUTH_ALLOW_UNVERIFIED_DEV`. Unverified users cannot sign in, and any existing unverified Session is rejected and revoked on protected access or refresh.
- Added private `RESEND_API_KEY` and `AUTH_EMAIL_FROM` configuration. Automated tests inject a fake sender and never contact Resend.

**Important implementation notes:**

- No Prisma schema change or migration was required; the existing `EmailVerificationToken` model supports the complete flow.
- Email delivery acceptance does not guarantee inbox delivery, so the UI always provides a safe resend path.
- Forgot Password, Reset Password, and `PasswordResetToken` remain outside this milestone.

**Verification recorded:** 19 unit tests and 22 HTTP integration tests passed against the isolated migrated test database, including token hashing, single use, expiry, resend invalidation, concurrent consumption, enumeration-safe responses, delivery-failure recovery, rate limits, and mandatory verification for sessions. API and web linting, type checks, and production builds passed. API startup and health checking succeeded with private Resend configuration loaded; no real test email was sent.

### Wedding Onboarding Frontend — Completed

**Summary:** Added the authenticated, responsive three-step wedding-onboarding interface and the reusable first-wedding dashboard empty state from the approved Stitch designs. This milestone is frontend-only.

**Implemented:**

- Authenticated `/weddings/new` route using the existing `/auth/me` bootstrap and cookie-session refresh flow.
- Wedding Setup, Wedding Details, and Review and Create steps with accessible keyboard controls, step-level Zod validation, Back/Continue navigation, and preserved form values.
- Bride Side and Groom Side automatically assign the matching creator side; Joint asks the creator to choose Bride, Groom, or Both. The review keeps Owner role separate from creator side.
- Required bride, groom, and editable suggested workspace names, plus an optional undecided wedding date.
- Reusable loading, pending, error, and success presentation states for later API integration.
- Responsive empty-dashboard component populated from entered onboarding details, with honest zero-data sections and Create your first event as the primary future action.
- A clearly labelled dashboard preview from the review step and an account-page entry link to onboarding.

**Important implementation notes:**

- This milestone began as a frontend-only flow. Its Create Wedding action and empty dashboard were connected to persisted data in the later Wedding Creation Backend and Integration milestone.
- The optional preview remains local and clearly labelled; no premature Redux wedding slice was added.

**Verification recorded:** frontend linting and type checking passed. The production build passed and includes the static `/weddings/new` route. Responsive behavior is implemented for mobile and desktop layouts; backend persistence was intentionally not exercised because no wedding API exists.

### Wedding Creation Backend and Integration — Completed

**Summary:** Added the first wedding-scoped database models and APIs, connected onboarding to persisted wedding creation, and routed authenticated users to the correct real workspace state.

**Implemented:**

- Additive `Wedding` and `WeddingMember` Prisma models and migration with UUID keys, approved management/role/side enums, nullable main wedding date, lifecycle timestamps, membership constraints, and query indexes. Budget and currency remain deferred.
- Atomic creation of a Wedding and its first active `OWNER` membership. Creator side is fixed for Bride/Groom Side workspaces and selected independently from the Owner role for Joint workspaces.
- Authenticated `POST /api/v1/weddings`, `GET /api/v1/weddings`, and `GET /api/v1/weddings/:weddingId` endpoints using routes, controllers, services, repositories, shared Zod contracts, Session-backed authentication, trusted-Origin protection for creation, and active-membership filtering.
- Wedding detail lookup returns the same not-found result for unknown or unauthorized IDs and exposes only the current member's non-financial workspace context.
- `/weddings/new` now saves through the real API, displays loading and safe errors, records the current wedding selection, and opens the persisted empty dashboard.
- `/weddings` resolves membership after login: no weddings open onboarding, while one or more active memberships appear in the wedding chooser. Selecting a wedding opens only that workspace, and a visible Create New Wedding action opens `/weddings/new`. `/account` remains the profile route.
- The dashboard empty state renders the real wedding name, couple names, type, side, optional date, and Owner identity without fake events, guests, vendors, or financial totals.
- The existing dashboard account dropdown links to My Account and Switch Wedding and performs logout through the shared session logout flow; the sidebar identity card remains role-and-side context for the selected wedding.
- Optional wedding dates are validated consistently in the browser and API as Sri Lankan calendar dates that must be today or later, while the undecided option remains available.
- Suggested workspace names continue following bride/groom name changes until the user customizes the suggestion; later name edits never overwrite a customized workspace name.

**Important implementation notes:**

- Current-wedding selection stores only a wedding UUID in browser storage; every API request still authenticates the Session and verifies active membership in PostgreSQL.
- Events, invitations, archiving, member management, permissions beyond active membership, and budget/currency are outside this milestone.

**Verification recorded:** the additive migration was inspected before use, applied first to the guarded `make_my_marriage_test` database, and then deployed to the development database without resetting existing data. All 28 API unit tests and 27 HTTP integration tests passed, including atomic Owner creation, active-membership isolation, optional and past-date validation, deferred-field rejection, and health regression coverage. Repository linting, type checks, and production builds passed; the build route manifest includes `/account`, `/weddings`, `/weddings/new`, and `/weddings/[weddingId]`.

### Events Management — Completed

**Summary:** Added PostgreSQL-backed, wedding-scoped Event creation, listing, details, and editing through the approved responsive frontend and modular Express API.

**Implemented:**

- Authenticated Overview, Create, Details, and Edit routes under `/weddings/:weddingId/events`, using the selected wedding context and real saved Event data.
- A shared responsive wedding workspace shell for the existing dashboard and Events routes, including mobile navigation, account controls, and direct Dashboard/Events navigation.
- A reusable React Hook Form and Zod Event form with required custom names, optional description/date/times/location, same-day time validation, preserved values, and accessible errors and focus states.
- Fixed read-only BRIDE/GROOM sides for Bride Side and Groom Side weddings; accessible BRIDE/GROOM/BOTH radios for Joint weddings, with no Create default and the saved side selected during Edit.
- Prisma `Event` storage with nullable PostgreSQL date/time and location fields, creator audit ownership, wedding/date indexes, composite wedding/Event uniqueness, and restrictive foreign keys.
- Modular Event routes, controllers, service, repository, and Zod schemas for `POST/GET /weddings/:weddingId/events` and `GET/PATCH /weddings/:weddingId/events/:eventId`.
- Backend enforcement of active Owner membership, trusted-origin writes, Event Side rules, same-day scheduling, strict supported fields, and resource queries scoped by both wedding and Event IDs.
- Real empty and populated Overview states, API-backed Details and Edit loading/error states, saved-data navigation, and terminal-session redirect handling.

**Important implementation notes:**

- Event deletion, budgets, coordinates, and related tasks, guests, vendors, documents, and expenses remain outside this milestone.
- Owner-only access is the approved initial backend policy. The long-term Admin, Family Member, and Collaborator role model remains unchanged and requires capability, side, and explicit assignment infrastructure before those roles receive Event access.
- No Stitch simulator controls or scripts were copied into production code.

**Verification recorded:** migration `20260923135614_add_events` contains only additive Event table, index, and foreign-key operations and is applied to both isolated test and development databases. Event unit and HTTP integration coverage verifies Create → List → Get → Edit, optional scheduling, side rules, Owner-only access, trusted-origin writes, and cross-wedding isolation. Repository regression tests, linting, type checking, and production builds passed.

### Wedding Settings — Completed

**Summary:** Added Owner-only editing for wedding workspace names, couple names, and the optional main wedding date without changing wedding type, membership, or Event schedules.

**Implemented:**

- `PATCH /api/v1/weddings/:weddingId` with strict shared Zod validation, trusted-origin enforcement, active Owner checks, and an Owner-scoped database update.
- Responsive `/weddings/:weddingId/settings` UI using the existing workspace shell, real wedding data, accessible validation, loading/error/success states, and a read-only management type.
- Wedding Settings navigation from the existing authenticated workspace on desktop and mobile.
- Setting, changing, and clearing `mainWeddingDate`; Event dates remain independent and unchanged.

**Verification recorded:** focused shared validation, service, HTTP integration, and frontend form-schema tests passed. Repository linting, type checking, regression tests, and production builds passed. No schema migration was required because the approved nullable wedding-date column already existed.

## Features in progress

No major feature is currently recorded as in progress.

## Planned features

The following approved MVP areas are planned but not implemented:

- Remaining approved business database models and migrations
- Forgot Password, Reset Password, and the password-reset database model
- Members, Owner/Admin/Family Member/Collaborator permissions, and collaborator resource assignments
- Tasks, budgets, expenses, vendors, Google Places discovery, guests, invitations, RSVP, and documents
- Redux Toolkit business state, remaining API integrations, private Amazon S3 documents, and MVP deployment infrastructure

## Important implementation notes

- The approved requirements in `PRD.md`, `System-Architecture.md`, `Database-Design.md`, and `API-Design.md` remain the source of truth.
- The six implementation-stage groups in PRD Section 41 remain the implementation-question record. Authentication lifetimes, rotation, concurrent/stale-token handling, trusted-Origin CSRF defense, and prompt Session revocation are now finalized there; the remaining details must be resolved before implementing affected behavior.
