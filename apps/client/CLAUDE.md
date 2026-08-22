# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

React + TypeScript client, built with Vite. Part of the `task-management` npm-workspaces monorepo (see root `CLAUDE.md`).

## Commands

Run from this directory, or via `npm run <script> --workspace=apps/client` from the repo root:

```bash
npm run dev       # start Vite dev server (http://localhost:5173)
npm run build     # tsc -b type-check, then vite build
npm run preview   # preview the production build
```

Linting and formatting are run from the repo root (`npm run lint`, `npm run format`), not from this package — the root ESLint config applies React/React Hooks rules to `apps/client/**/*.{ts,tsx}`.

## Architecture

- Entry point: `src/main.tsx` mounts `src/App.tsx` into `index.html`.
- No routing, state management, or API layer is set up yet — the app is currently a minimal scaffold.
- `tsconfig.json` / `tsconfig.tsbuildinfo` drive TypeScript project-reference builds used by `tsc -b`.

## Documentation maintenance

Whenever a change affects this app's architecture (routing, state management, API layer, folder structure, build config, etc.), update this file (and the root `CLAUDE.md` if the change is monorepo-wide) as part of the same change.
