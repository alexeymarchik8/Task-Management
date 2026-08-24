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

- Entry point: `src/main.tsx` mounts `src/App.tsx` into `index.html`. `App.tsx` only wraps `router/AppRouter` in `auth/AuthContext`'s `AuthProvider` — no routes or page markup live here.
- **Folder structure**:
  - `src/pages/<PageName>/` — one folder per page: `index.tsx` (the page component), `<PageName>.module.scss`, `<PageName>.test.tsx`, and page-only subcomponents under `components/` (e.g. `pages/Register/components/RegisterHeader.tsx`). A `config.ts` and/or `utils/` subfolder is added only when a page actually needs one.
  - `src/components/<ComponentName>/` — same shape as pages (`index.tsx` + `.module.scss` + `.test.tsx`). Subcomponents used only by one component are nested under that component's own `components/` folder rather than living as siblings (e.g. `components/RegistrationForm/components/{EmailField,PasswordField,FormAlert,SubmitButton}/index.tsx`).
  - `src/router/` — `routes.ts` declares the app's routes as a flat `{ path, element }[]` array (add a page by adding an entry here); `AppRouter.tsx` renders `BrowserRouter`/`Routes` from that array plus the `/` → `/dashboard` redirect.
  - `src/assets/` — static assets (images, icons, fonts); currently empty (`.gitkeep`).
  - `src/auth/`, `src/api/`, `src/store/`, `src/test/` — unchanged, see below.
- **Routing**: `react-router-dom` (`BrowserRouter`), routes declared in `src/router/routes.ts` (`/dashboard`, `/register`, `/login`) and rendered by `src/router/AppRouter.tsx`.
- **State management**: Redux Toolkit. `src/store/authSlice.ts` holds the authenticated `AuthUser` (`id`, `email`) and a `login` reducer that persists the JWT and user to `localStorage` (`token`, `user` keys); `src/store/store.ts` exports `createAppStore()`. `src/auth/AuthContext.tsx` wraps this in an `AuthProvider` (creates one store instance per mount via `Provider` from `react-redux`, reading `localStorage` at creation time) and a `useAuth()` hook (`useSelector`/`useDispatch`) — the public API (`AuthProvider`, `useAuth`) is unchanged from the previous Context-based implementation, so callers don't need to know Redux is used underneath.
- **API layer**: `src/api/authApi.ts` — thin `fetch` wrapper (`registerUser`, `loginUser`) against the server at `http://localhost:3000`; throws `ApiError` (with `status`/`message`) on non-2xx responses.
- **Registration**: `src/components/RegistrationForm/index.tsx` composes `src/components/RegistrationForm/components/{EmailField,PasswordField,FormAlert,SubmitButton}/index.tsx` (loading/disabled state, `role="alert"` error message) and is used by `src/pages/Register/index.tsx` (composing `src/pages/Register/components/RegisterHeader.tsx`), which redirects an already-authenticated user to `/dashboard`, redirects to `/dashboard` after a successful registration, and links to `/login`.
- **Login**: `src/components/LoginForm/index.tsx` (email/password fields, loading/disabled state, single generic `role="alert"` error that does not reveal whether the email or password was wrong) is used by `src/pages/Login/index.tsx`, which redirects an already-authenticated user to `/dashboard`, redirects to `/dashboard` after a successful login, and links to `/register`.
- **Dashboard**: `src/pages/Dashboard/index.tsx` — placeholder landing page shown after login/registration.
- **Styling**: SCSS Modules (`*.module.scss`, co-located with their component) plus a global `src/index.scss`; see [Frontend conventions](#frontend-conventions).
- **Testing**: Vitest + `@testing-library/react` (jsdom environment, config in `vitest.config.ts`, setup in `src/test/setup.ts`); test files live alongside source as `*.test.ts(x)`.
- `tsconfig.json` / `tsconfig.tsbuildinfo` drive TypeScript project-reference builds used by `tsc -b`.

## Frontend conventions

- **State management**: use Redux Toolkit (`@reduxjs/toolkit` + `react-redux`) for shared/global application state (e.g. auth, cross-page data). Organize as feature slices (`createSlice`) under a `src/store/` (or per-feature `slice.ts`) structure, with a single `configureStore` root store. Local/UI-only state that doesn't need to be shared still belongs in component state (`useState`/`useReducer`).
- **Component/page decomposition**: every page (`src/pages/`) and component (`src/components/`) is a folder named after it, containing `index.tsx`, a co-located `*.module.scss`, a `*.test.tsx`, and (only when actually needed) a `config.ts` and/or `utils/` subfolder. Avoid large files mixing many JSX elements/responsibilities — split into small, focused pieces composed together. A subcomponent used by only one parent is nested under that parent's own `components/` folder, not placed as a sibling.
- **Routing**: add a new page by adding an `{ path, element }` entry to `src/router/routes.ts` — do not add routes directly in `App.tsx`.
- **Styling**: use a CSS preprocessor (Sass/SCSS) for stylesheets — `.scss` files, one per component (co-located next to the component, e.g. `ComponentName/ComponentName.module.scss`), using SCSS features (nesting, variables, mixins) instead of plain CSS.

## Documentation maintenance

Whenever a change affects this app's architecture (routing, state management, API layer, folder structure, build config, etc.), update this file (and the root `CLAUDE.md` if the change is monorepo-wide) as part of the same change.
