# Make My Marriage

## Purpose and source of truth

Make My Marriage is a responsive Sri Lankan wedding-planning application for couples, families, and invited collaborators. It brings wedding workspaces, events, tasks, budgets, expenses, vendors, guests, invitations, RSVP, and documents into one place.

Before implementing a feature, read only the relevant sections of these approved documents in `docs/`:

- [PRD](docs/PRD.md)
- [System Architecture](docs/System-Architecture.md)
- [Database Design](docs/Database-Design.md)
- [API Design](docs/API-Design.md)

These documents are the source of truth. Finalized decisions override older illustrative examples. Raise a contradiction or an implementation-stage question before changing affected behavior. Do not add features outside the approved MVP.

## Stack and repository

- Use TypeScript throughout.
- This is one npm-workspaces monorepo: `apps/web` (Next.js), `apps/api` (Express), and `packages/shared` (genuinely shared types, constants, and Zod schemas).
- Frontend: Next.js App Router, React, Tailwind CSS, Redux Toolkit, React Hook Form, and Zod. Use Redux Toolkit for application-wide client state; do not replace it with another state-management library. Do not use shadcn/ui.
- Backend: Node.js, Express, TypeScript, REST under `/api/v1`, Zod, Prisma, and PostgreSQL. Do not replace Express with NestJS or PostgreSQL with MongoDB.
- Use npm and the root `package-lock.json`; do not introduce pnpm, Yarn, Turborepo, or Nx.
- Keep the backend a modular monolith organized by business domain. Within a module use routes, controllers, services, repositories, and schemas. Controllers handle HTTP, services hold business logic, repositories use Prisma, and Zod validates inputs.
- Keep shared code small. Do not place database access, secrets, or server-only business logic in `packages/shared`.

## Architecture and integrations

- PostgreSQL is the relational database and Prisma is its only application ORM.
- Authentication is custom email/password with Argon2id, JWT access and refresh tokens in HttpOnly cookies, and a Session table that stores refresh-token hashes. Never put tokens in Redux, localStorage, or sessionStorage.
- Use Resend for verification and password-reset emails.
- Store documents in private Amazon S3 and use authorized presigned upload/download URLs.
- Use Google Places only for simple vendor discovery; vendors do not have application accounts.
- The approved learning deployment target is two Vercel Hobby projects (`apps/web` and `apps/api`) with one Neon Free PostgreSQL project, as defined in [Vercel and Neon Deployment](docs/Deployment-Vercel-Neon.md). AWS EC2/RDS/ECR and production Docker deployment are postponed. Logging remains `console.log` and `console.error`; never log passwords, hashes, tokens, or connection strings.
- Do not introduce microservices, Redis, Kafka, Kubernetes, Cognito, ECS, Fargate, GraphQL, WebSockets, or other unnecessary infrastructure.

## Authorization and data protection

- A valid JWT alone never permits another wedding's data. For every wedding-scoped request, enforce active membership and query resources with both the resource ID and wedding ID.
- Roles are scoped to `WeddingMember`, never global user types. Any verified user may own one wedding and be a Collaborator in another.
- Owners have full wedding access. Only Owners can add, remove, or demote Owners. Every wedding must retain at least one active Owner, including during concurrent membership changes.
- Admins operate only within their authorized side and delegated capabilities; they cannot manage ownership or grant a permission or resource scope they do not possess.
- Family Members have only their granted capabilities and applicable side access.
- Collaborators require both the relevant capability and an explicit assignment to each event, task, vendor, or document. An event assignment never grants access to its related tasks, vendors, documents, guests, expenses, or financial information.
- Apply authorization before list pagination, search, aggregation, nested data, dashboard summaries, and writes. The frontend is not the security boundary.
- Keep financial response projection server-side. `BUDGET_VIEW` and `BUDGET_MANAGE` are separate. Expense, payer, and vendor financial values require the documented expense permissions. Never return restricted fields and merely hide them in the UI.
- Guests use secure invitation tokens to view invitations and submit event-level RSVP without application accounts. Return invitation-safe data only.
- Validate request bodies, parameters, and important query values with Zod. Rate-limit sensitive endpoints. Never commit secrets; keep real `.env` files ignored.

## Development workflow

- Before starting a major new feature, read [Project Status](docs/PROJECT_STATUS.md) alongside the relevant approved documentation.
- Maintain `docs/PROJECT_STATUS.md` as the central record of significant delivery progress. When a major feature or milestone is implemented, update its existing entry with the feature name, implementation summary, relevant technical details, and verification status.
- Mark a feature **Completed** only after verifying its implementation. If it is partially implemented, mark it **In Progress** and state the remaining work. Preserve existing milestones and update an existing entry for significant improvements instead of creating duplicates.
- Do not update project status for every small code change, styling adjustment, or minor bug fix. Keep it synchronized with the actual codebase as part of the normal workflow; focus on major features and significant milestones.
- Before each significant change, explain what will be built and which existing modules will be affected.
- Implement one feature at a time in small, reviewable steps. Keep code simple, modular, and understandable.
- Do not silently alter approved architecture decisions. Discuss alternatives first if a documented decision cannot support a requirement.
- After changes, run relevant linting, type checks, builds, tests, and focused runtime checks where available. State failures, skipped checks, and limitations accurately.
- At the end of each task, identify changed files, explain why, and give practical verification steps so the user can follow the implementation.
- Do not commit or push to GitHub unless the user explicitly instructs it.

## Current scope boundary

The initial scaffold exists. Do not add database models, Prisma migrations, authentication, wedding features, Redux business slices, Google Places, Resend, AWS deployment, Docker configuration, or landing-page work unless the current task explicitly requests them.

The remaining implementation-stage questions in PRD Section 41 stay open until explicitly resolved. Do not silently choose a behavior that expands the MVP.
