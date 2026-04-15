# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Aurora Ledger** — personal finance app. Two-package monorepo (no workspaces tool):
- `backend/` — Node.js + Express + PostgreSQL (ES modules, `"type": "module"`)
- `frontend/` — React 18 + Vite + Tailwind + React Query

Live: frontend on Vercel (`aurora-ledger.vercel.app`), backend on Render, DB on Neon Postgres.

## Commands

Run from the respective subdirectory.

**Backend** (`cd backend`):
- `npm run dev` — nodemon on `server.js` (port 5000)
- `npm start` — production node
- `npm run migrate` — creates core tables (users, categories, transactions, budgets, recurring_transactions)
- Other migrations live in `backend/scripts/migrate-*.js` and must be run individually with `node scripts/<name>.js`. There is no migration runner that tracks applied state — each script is idempotent (`CREATE TABLE IF NOT EXISTS`, `ALTER ... IF NOT EXISTS`).
- `npm run seed` — `scripts/seed.js`

**Frontend** (`cd frontend`):
- `npm run dev` — Vite dev server (port 5173)
- `npm run build` — production build
- `npm run lint` — ESLint with `--max-warnings 0`
- No test runner is configured in either package.

**Env files**: copy `backend/env.example` → `backend/.env` and `frontend/env.example` → `frontend/.env`. Frontend needs `VITE_API_URL`; backend needs `DATABASE_URL`, `JWT_SECRET`, optionally `GOOGLE_CLIENT_ID/SECRET`, `EXCHANGE_RATE_API_KEY`, `SENDGRID_API_KEY`.

## Architecture

### Backend request flow
`server.js` wires every route module under `/api/<domain>` (see lines 69–87 for the full map). Auth is JWT-based: `middleware/auth.js` exports `authMiddleware`/`authenticateToken` (required on nearly every route) plus `isAdmin` / `isMod` for role gates. Routes query Postgres directly through the shared pool in `config/database.js` — there is no ORM and no service layer; SQL lives inline in route handlers.

`config/passport.js` sets up Google OAuth (used by `routes/oauth.js`). OAuth is optional and gracefully disabled when env vars are missing.

A `node-cron` job in `server.js` runs `utils/recurring-processor.js` daily at 00:05 to materialize due recurring transactions. Set `PROCESS_RECURRING_ON_STARTUP=true` to also run on boot.

### Currency system (critical — easy to break)
`backend/utils/currency.js` handles conversion via `exchangerate-api.com`, cached 24h in the `exchange_rates` table with stale-cache fallback. Two conversion paths coexist and **must not both run on the same amount**:

1. **Backend converts** (e.g. dashboard, reports) — returns already-converted numbers in the user's display currency.
2. **Frontend converts** (raw data paths) — uses `CurrencyContext` + `formatAmount()` which converts *then* formats.

When the backend has already converted, the frontend must use `formatCurrency()` (format only, no conversion), NOT `formatAmount()`. See `DOUBLE_CONVERSION_AUDIT_2025-11-04.md` for the audit trail of which endpoints return pre-converted vs raw amounts. Transactions, recurring transactions, budgets, and goals all store a per-row `currency` column; conversion targets come from the user's profile currency.

### Frontend structure
- `src/App.jsx` — routes. Auth/Dashboard/Transactions are eager-loaded; everything else is `React.lazy` (initial bundle optimization). Providers nest: `ThemeProvider > AuthProvider > CurrencyProvider > Router`.
- `src/context/` — three contexts (Auth, Currency, Theme) are the primary app-wide state. No Redux/Zustand.
- `src/lib/api.js` — single axios instance. Auto-injects JWT, auto-logs-out on 401, auto-cleans expired tokens via `utils/tokenManager.js` before the request is sent.
- `src/i18n/` — i18next with 10 locales in `locales/`. `react-i18next` hooks are used throughout; all user-facing strings should go through `t()`.
- React Query is used for server state caching (5-min default). Look for `useTransactions` in `hooks/` for the pattern.

### Data model highlights
See `backend/scripts/migrate.js` for the canonical core schema. Later additions (family sharing, invite codes, OAuth provider, password reset, saving goals, per-row currency, role column) each have their own `migrate-*.js` script. When adding a new table/column, add a new idempotent migration script rather than editing `migrate.js`.

Key tables to know: `users` (has `role`: user/mod/admin, OAuth fields), `families` + `family_members` (4-tier roles: head/manager/contributor/observer), `family_invite_codes`, `transactions`, `recurring_transactions`, `budgets`, `saving_goals`, `exchange_rates`.

## Conventions

- Backend uses ES modules (`import`/`export`) — remember `.js` extensions in imports.
- Route files export a default `express.Router()`. Mount points are in `server.js`.
- File references in markdown should use `[file.js:42](path/file.js#L42)` style (VSCode link rendering).
- CORS allowlist is hardcoded in `server.js` — add new frontend origins there.
- JWT tokens expire in 30 days; expired tokens are cleaned client-side before use (see `frontend/src/utils/tokenManager.js`).

## Deployment

GitHub Actions (`.github/workflows/deploy-production.yml`) triggers on push to `main`:
- Frontend auto-deploys via Vercel's GitHub integration (the workflow just logs it).
- Backend redeploys only when the commit message contains `[backend]` or `[deploy]`, or via `workflow_dispatch`. It calls `RENDER_DEPLOY_HOOK` secret.
- Current working branch is `master` but prod workflow watches `main` — be aware when pushing.

Production DB migrations are run manually via `backend/run-production-migration.sh` against the production `DATABASE_URL`.
