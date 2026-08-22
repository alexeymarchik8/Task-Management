# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Express.js + TypeScript server. Part of the `task-management` npm-workspaces monorepo (see root `CLAUDE.md`).

## Commands

Run from this directory, or via `npm run <script> --workspace=apps/server` from the repo root:

```bash
npm run dev     # tsx watch src/index.ts — runs the server with hot reload (http://localhost:3000)
npm run build   # tsc -b — type-check and compile to dist/
npm run start   # node dist/index.js — run the compiled build
```

Linting and formatting are run from the repo root (`npm run lint`, `npm run format`), not from this package — the root ESLint config applies Node globals to `apps/server/**/*.ts`.

## Architecture

- Single-file entry point: `src/index.ts` creates the Express app, registers `express.json()` middleware, and exposes a `GET /health` endpoint returning `{ status: 'ok' }`.
- Port is read from `process.env.PORT`, defaulting to `3000`.
- No routing modules, database layer, or additional middleware exist yet — the server is currently a minimal scaffold.

## Documentation maintenance

Whenever a change affects this app's architecture (routing, database/persistence layer, middleware, folder structure, build config, etc.), update this file (and the root `CLAUDE.md` if the change is monorepo-wide) as part of the same change.
