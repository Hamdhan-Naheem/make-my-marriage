# Make My Marriage frontend

Created with the official `create-next-app` empty App Router template. Uses Next.js,
React, TypeScript, Tailwind CSS, and the standard Next.js ESLint configuration.

Run commands from the repository root so the shared package is built first:

```bash
npm install
npm run dev:web
```

Open http://localhost:3000. The placeholder is in `src/app/page.tsx`.

Run `npm run dev` from the root to start the API as well. Requests to `/api/v1/*`
are forwarded to Express on port 4000. `src/lib/api.ts` provides a browser-side
health helper with shared Zod validation; the placeholder does not call the API.

Optional server-only configuration belongs in `.env.local`; see `.env.example`.
Do not put credentials in `NEXT_PUBLIC_*` variables or Next.js `env` configuration.
Restart development after changing the API origin. Rebuild for a changed origin
when using the production Next.js build, because rewrites are generated at build time.

See the [root README](../../README.md) for all commands and project boundaries.
