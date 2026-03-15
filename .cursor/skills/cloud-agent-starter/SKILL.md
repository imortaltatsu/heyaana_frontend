# Cloud Agent Starter Skill (HeyAnna Next.js)

Use this skill when you need to quickly run, debug, and test this repo in Cursor Cloud without rediscovering basic setup each time.

## 1) Quick-start checklist (do this first)

1. Install deps:
   - `npm ci`
2. Create local env:
   - `cp .env.local.example .env.local` (if an example exists)
   - If no example exists, create `.env.local` manually with:
     - `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=heyanna_ai_bot`
     - `DATABASE_URL=...` (required for invite-code routes)
     - `DEV_API_KEY=...` (optional, enables secure dev manual login proxy header)
     - `INVITE_ADMIN_KEY=...` (only needed for invite code generation endpoint)
3. Start the app:
   - `npm run dev`
4. Open:
   - `http://localhost:3000`

Notes:
- App is a Next.js frontend with Route Handlers under `src/app/api/*`.
- Most trading/profile data is fetched from remote APIs (`api.heyanna.trade`, `api2.heyanna.trade`).
- Invite validation/redeem depends on Postgres via `DATABASE_URL`.

## 2) Auth + onboarding area (`/onboarding`)

### What matters in this area
- Primary login is Telegram widget / mini-app flow.
- Fast dev login path exists and is hidden unless query param `?dev=true` is present.
- Session token is stored in localStorage key `heyanna_token`.
- Invite code flow uses local API routes (`/api/invite/*`) and requires DB access.

### Fast workflows

#### A) Fastest local auth path (recommended for Cloud agents)
1. Open: `http://localhost:3000/onboarding?dev=true`
2. Go to step 1 (Connect) and use **Dev Login** box.
3. Enter a test Telegram user id (for environments where `/auth/manual` is enabled).
4. Confirm redirect/progression continues after login.

If dev login fails with auth error:
- Check `DEV_API_KEY` in `.env.local` (if backend requires it).
- Fall back to token bootstrap (workflow C below) if you already have a valid JWT.

#### B) Full invite flow (requires DB)
1. Start on onboarding step 0.
2. Submit invite code.
3. Confirm `/api/invite/validate` succeeds.
4. Login (Telegram or dev).
5. Confirm `/api/invite/redeem` succeeds and onboarding advances.

#### C) Token bootstrap bypass (for UI debugging only)
1. Open any app URL with token query param:
   - `http://localhost:3000/dashboard?token=<jwt>`
2. App provider stores token to localStorage and reloads.
3. Confirm you remain authenticated and `AuthGuard` allows dashboard routes.

Use this only when testing non-onboarding UI behavior quickly.

### Testing workflow (auth/onboarding)
- Terminal checks:
  - `curl -i http://localhost:3000/api/invite/validate -X POST -H 'content-type: application/json' -d '{"code":"TESTCODE"}'`
  - Expect `503` when DB is missing, or validation response when configured.
- Manual checks:
  - Onboarding step transitions: Invite -> Connect -> Dashboard.
  - `?dev=true` reveals Dev Login panel.
  - Invalid token forces redirect back to `/onboarding`.

## 3) Dashboard + markets area (`/dashboard`, `/dashboard/markets`, `/dashboard/market`)

### What matters in this area
- Protected by `AuthGuard`.
- Heavy use of SWR and remote APIs through `src/lib/api.ts`.
- Market/event feeds come from `/api/gamma` (proxy to Polymarket Gamma API).
- Trading/profile actions call `api2.heyanna.trade` and need a valid token.

### Fast workflows

#### A) Smoke-check dashboard shell
1. Ensure auth token exists (via onboarding or token bootstrap).
2. Open `/dashboard`.
3. Confirm:
   - Page renders without redirect loop.
   - Feed loads (or displays friendly failure state, not crash).
   - Banner/summary/sidebar render.

#### B) Markets/event flow
1. Open `/dashboard/markets` or `/dashboard`.
2. Toggle Events/Markets views in feed.
3. Open a market/event detail page.
4. Confirm chart/trades tabs render and refresh behavior works.

#### C) Trade-adjacent UI checks (safe)
1. Open `/dashboard/market?...`.
2. Interact with trade panel inputs only (do not submit real trades unless explicitly requested).
3. Verify validations and loading states.

### Testing workflow (dashboard/markets)
- Terminal checks:
  - `curl -i 'http://localhost:3000/api/gamma?active=true&closed=false&limit=2'`
  - Expect JSON response with event data.
- Manual checks:
  - Authenticated user can open dashboard routes.
  - Market cards/details load.
  - Error states are visible and non-blocking when upstream APIs fail.

## 4) API route + DB area (`src/app/api/*`)

### Route groups
- Auth proxy routes:
  - `/api/auth/manual`
  - `/api/auth/telegram-widget`
- Invite routes (DB-backed):
  - `/api/invite/validate`
  - `/api/invite/redeem`
  - `/api/invite/has-access`
  - `/api/invite/generate`
- Public proxy route:
  - `/api/gamma`

### Practical checks
- Auth/manual proxy:
  - Verify `DEV_API_KEY` behavior by checking response shape for success vs unauthorized.
- Invite routes:
  - Without DB: should return explicit `503`/error JSON, not crash.
  - With DB: validate/redeem lifecycle should behave atomically.
- Gamma route:
  - Verify pass-through JSON and non-200 propagation.

### Testing workflow (api routes)
- `curl -i http://localhost:3000/api/gamma?limit=1&active=true&closed=false`
- `curl -i -X POST 'http://localhost:3000/api/auth/manual?user_id=1'`
- `curl -i -X POST http://localhost:3000/api/invite/validate -H 'content-type: application/json' -d '{"code":"ABCD1234"}'`

## 5) Feature flags, toggles, and common mocks

This repo has lightweight runtime toggles rather than a formal flag service:

- `?dev=true` on `/onboarding` enables Dev Login UI.
- `?token=<jwt>` / `?access_token=<jwt>` / `?jwt=<jwt>` bootstraps local session token.
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` controls Telegram widget bot name.
- Missing `DATABASE_URL` intentionally places invite features in degraded mode.

Mocking tips:
- For frontend-only debugging, bypass invite + login with token bootstrap.
- For invite route work, use a test DB and seed `invite_codes` table.
- For API-unavailable scenarios, verify components show fallback/empty states instead of throwing.

## 6) How to update this skill (keep it useful)

When you discover a new testing trick or runbook fix:

1. Add it to the correct area section above (auth, dashboard, or api routes).
2. Include one copy-paste command and one expected outcome.
3. Note prerequisites (token, env var, DB required, etc.).
4. Remove stale steps that no longer match current code paths.
5. Keep this file short; prefer practical actions over explanation.

Update goal: a new Cloud agent should be able to run and test the right area in under 5 minutes using only this file.
