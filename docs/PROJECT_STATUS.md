# Project Status

## Project overview

Make My Marriage is a Sri Lankan wedding-planning application for couples, families, and invited collaborators. The approved MVP brings wedding workspaces, events, tasks, budgets and expenses, vendors, guests, invitations, RSVP, and documents into one place.

## Overall development status

**Foundation, public home page, and shared authentication UI complete.** Core wedding-management features, persistence, authentication backend behavior, and third-party integrations have not started.

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

## Features in progress

No major feature is currently recorded as in progress.

## Planned features

The following approved MVP areas are planned but not implemented:

- PostgreSQL and Prisma database setup, models, and migrations
- Custom authentication, email verification, password reset, JWT cookies, and session management
- Wedding workspace creation and wedding-scoped authorization
- Members, Owner/Admin/Family Member/Collaborator permissions, and collaborator resource assignments
- Events, tasks, budgets, expenses, vendors, Google Places discovery, guests, invitations, RSVP, and documents
- Redux Toolkit business state, API integrations, Resend email, private Amazon S3 documents, and MVP deployment infrastructure

## Important implementation notes

- The approved requirements in `PRD.md`, `System-Architecture.md`, `Database-Design.md`, and `API-Design.md` remain the source of truth.
- The current `README.md` still describes the original placeholder home page and should be refreshed in a separate documentation task.
- The six implementation-stage questions in PRD Section 41 remain unresolved and must be addressed before implementing the affected behavior.
