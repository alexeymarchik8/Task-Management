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
npm test          # vitest run — component/unit tests (jsdom)
```

Linting and formatting are run from the repo root (`npm run lint`, `npm run format`), not from this package — the root ESLint config applies React/React Hooks rules to `apps/client/**/*.{ts,tsx}`.

## Architecture

- Entry point: `src/main.tsx` mounts `src/App.tsx` into `index.html`.
- **Routing**: `react-router-dom` (`BrowserRouter`), routes declared in `src/App.tsx` (`/dashboard`, `/register`).
- **State management**: `src/auth/AuthContext.tsx` — React Context holding the authenticated `AuthUser` (`id`, `email`); `login()` persists the JWT and user to `localStorage` (`token`, `user` keys) and restores that state on load.
- **API layer**: `src/api/authApi.ts` — thin `fetch` wrapper (`registerUser`) against the server at `http://localhost:3000`; throws `ApiError` (with `status`/`message`) on non-2xx responses.
- **Registration**: `src/components/RegistrationForm.tsx` (email/password fields, inline submit handling, loading/disabled state, `role="alert"` error message) is used by `src/pages/Register.tsx`, which redirects an already-authenticated user to `/dashboard` and redirects to `/dashboard` after a successful registration.
- **Testing**: Vitest + `@testing-library/react` (jsdom environment, config in `vitest.config.ts`, setup in `src/test/setup.ts`); test files live alongside source as `*.test.ts(x)`.
- `tsconfig.json` / `tsconfig.tsbuildinfo` drive TypeScript project-reference builds used by `tsc -b`.

## Documentation maintenance

Whenever a change affects this app's architecture (routing, state management, API layer, folder structure, build config, etc.), update this file (and the root `CLAUDE.md` if the change is monorepo-wide) as part of the same change.
