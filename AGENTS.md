# AGENTS.md

## Cursor Cloud specific instructions

### Overview

HeyAnna is a **Next.js 16** prediction markets trading terminal frontend. It communicates with two external hosted APIs (`api.heyanna.trade` and `api2.heyanna.trade`) and uses Neon serverless Postgres for invite codes. There is no backend code in this repo.

### Dev commands

| Task | Command |
|------|---------|
| Install deps | `npm install --legacy-peer-deps` |
| Dev server | `npm run dev` (port 3000) |
| Lint | `npm run lint` |
| Build | `npm run build` |

### Key caveats

- **`--legacy-peer-deps` is required** for `npm install` due to peer dependency conflicts (see `vercel.json` for the canonical install command).
- The landing page (`/`) works without any external services or env vars. Dashboard routes (`/dashboard/*`) and onboarding (`/onboarding`) require the external APIs.
- There is a dev login bypass: navigate to `/onboarding?dev=true` to show a manual login form, but it still requires `api2.heyanna.trade` to issue a JWT.
- ESLint exits with code 1 due to pre-existing warnings/errors in the codebase; the lint tooling itself is working correctly.
- `DATABASE_URL` env var is needed for invite-code validation (Neon Postgres). Without it, invite code submission on the onboarding page will fail with a connection error.
- The app uses Turbopack for dev and build (default in Next.js 16).
