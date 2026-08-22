# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Task Management is an npm-workspaces monorepo with two apps:

- `apps/client` — React + TypeScript + Vite
- `apps/server` — Express.js + TypeScript

See `apps/client/CLAUDE.md` and `apps/server/CLAUDE.md` for per-app details.

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

There are no test scripts defined yet in this repository.

## Architecture

- npm workspaces: root `package.json` declares `apps/*` as workspaces; each app has its own `package.json`, `tsconfig.json`, and independently manages its own dependencies/build.
- Linting is centralized: a single root `eslint.config.js` applies different rule sets by path glob — browser globals + React/React Hooks rules for `apps/client/**/*.{ts,tsx}`, and Node globals for `apps/server/**/*.ts` — then disables stylistic rules via `eslint-config-prettier` so Prettier owns formatting.
- Prettier/formatting is also centralized at the root (`.prettierrc.json`, `.prettierignore`) and applies across both apps.
- The two apps are otherwise fully independent (separate builds, no shared package/lib between them yet).

## Documentation maintenance

Whenever a change affects the project architecture (new services/packages, changed data flow, new shared libraries, routing/build changes, etc.), update this `CLAUDE.md` and the relevant per-app `CLAUDE.md` to reflect the new state as part of the same change.
