# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Task Management is an npm-workspaces monorepo with three apps:

- `apps/client` — React + TypeScript + Vite
- `apps/server` — Express.js + TypeScript
- `apps/e2e` — Playwright end-to-end tests, driving the real client against the real server/database

See `apps/client/CLAUDE.md`, `apps/server/CLAUDE.md`, and `apps/e2e/CLAUDE.md` for per-app details.

## Commands (run from repo root)

```bash
npm install

npm run dev:client   # start client dev server (http://localhost:5173)
npm run dev:server   # start server dev process (http://localhost:3000)

npm run lint         # lint the whole monorepo
npm run lint:fix
npm run format       # run Prettier
npm run format:check
```

```bash
npm test             # run tests in all workspaces (client: vitest; server: vitest + supertest; e2e: playwright)
```

`npm test`'s e2e portion (`apps/e2e`) requires both dev servers already running — see `apps/e2e/CLAUDE.md`.

## Development Approach

**Test-Driven Development (TDD) is mandatory** for all new features, bug fixes, and refactoring. See `.agents/skills/test-driven-development/` for complete TDD guidelines.

All production code must be implemented after a failing test is written and verified. No exceptions without explicit approval.

## UI feedback with Playwright MCP

The Playwright MCP server is configured in `.mcp.json` for visual/UI verification (screenshots, page snapshots, console checks) against the running dev servers. It writes all output (screenshots, traces) to the `.playwright-mcp/` directory at the repo root — this directory is gitignored and should never be committed; treat it as scratch space, safe to delete between sessions.

## Architecture

- npm workspaces: root `package.json` declares `apps/*` as workspaces; each app has its own `package.json`, `tsconfig.json`, and independently manages its own dependencies/build.
- Linting is centralized: a single root `eslint.config.js` applies different rule sets by path glob — browser globals + React/React Hooks rules for `apps/client/**/*.{ts,tsx}`, and Node globals for `apps/server/**/*.ts` and `apps/e2e/**/*.ts` — then disables stylistic rules via `eslint-config-prettier` so Prettier owns formatting.
- Prettier/formatting is also centralized at the root (`.prettierrc.json`, `.prettierignore`) and applies across all apps.
- The apps are otherwise fully independent (separate builds, no shared package/lib between them), except `apps/e2e` which drives `apps/client` and `apps/server` at runtime (over HTTP) without importing their code.

### Server (apps/server)

- **Database**: PostgreSQL with Prisma ORM and `@prisma/adapter-pg` driver; database URL via `DATABASE_URL` environment variable. Schema lives in `apps/server/prisma/schema.prisma`; generated client output goes to `apps/server/src/generated/prisma` (gitignored).
- **Authentication**: User registration via `POST /auth/register` with email format validation, password length validation (≥8 chars), bcryptjs password hashing, and JWT token generation (`JWT_SECRET` from env).
- **Testing**: Vitest + supertest for E2E integration tests; all tests run against PostgreSQL with database reset between runs.

## Documentation maintenance

Whenever a change affects the project architecture (new services/packages, changed data flow, new shared libraries, routing/build changes, etc.), update this `CLAUDE.md` and the relevant per-app `CLAUDE.md` to reflect the new state as part of the same change.
