# Vercel and Neon Deployment

## Approved learning deployment

- Two Vercel Hobby projects from this npm-workspaces repository: `apps/web` and `apps/api`.
- One Neon Free PostgreSQL project.
- A stable production `*.vercel.app` hostname for the web project.
- Browser API traffic remains on `/api/v1/*`; Next.js rewrites it to the API project.
- Node.js 22.x for both Vercel projects.
- No authenticated preview environment, paid services, custom domain, AWS, or production Docker deployment.

This decision supersedes the AWS EC2, RDS, ECR, Nginx, and production Docker deployment sections in the older architecture documents. Local PostgreSQL through Docker remains supported.

## Vercel project settings

Create both projects from the same repository and enable access to source files outside each Root Directory so the applications can build `packages/shared`.

| Project | Root Directory | Framework | Build command |
| --- | --- | --- | --- |
| Web | `apps/web` | Next.js | `npm run vercel-build` |
| API | `apps/api` | Express | `npm run vercel-build` |

Use Node.js 22.x. Keep preview deployments unauthenticated; do not point preview builds at the production API or database.

## Environment configuration

Web production:

- `API_ORIGIN`: stable HTTPS URL of the API Vercel project. It is server-only and must not use a `NEXT_PUBLIC_` prefix.

API production:

- `DATABASE_URL`: Neon pooled connection string for application traffic.
- `WEB_ORIGIN`: exact stable HTTPS URL of the web Vercel project, without a trailing slash.
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`: distinct cryptographically random secrets of at least 32 characters.
- `RESEND_API_KEY`: private Resend key.
- `AUTH_EMAIL_FROM`: sender accepted by Resend.

Store database credentials, JWT secrets, and the Resend key as sensitive Vercel environment variables. Never place them in source files or `NEXT_PUBLIC_` variables.

For permitted self-testing without a verified domain, keep the existing Resend development sender and send only to the address allowed by the Resend account. Email verification remains mandatory. A verified sending domain is required before sending verification messages to other recipients.

## Database and migrations

- Runtime code reads the pooled Neon URL from `DATABASE_URL`.
- Prisma CLI configuration reads `DIRECT_URL` when present and falls back to `DATABASE_URL` for existing local development.
- Keep `DIRECT_URL` outside the Vercel runtime project unless a controlled migration job explicitly needs it.
- Apply committed migrations with `npm run db:migrate:deploy` from a trusted local or CI environment before deploying API code that requires them.
- Never run `prisma migrate dev` against production and never run production migrations automatically in a Vercel build.

The `auth_rate_limit_buckets` migration must be applied before the prepared API is used. Authentication limits fail closed if their table is unavailable.

## Production checks

Deploy the API first, then configure `API_ORIGIN` and deploy the web project. Verify the health route, registration and self-test verification email, verification, login, refresh, logout, Secure HttpOnly cookies, and an authentication rate-limit response through the web hostname.
