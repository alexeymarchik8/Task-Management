# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Playwright end-to-end test suite. Part of the `task-management` npm-workspaces monorepo (see root `CLAUDE.md`). Drives the real client (`apps/client`, Vite dev server) against the real server (`apps/server`) and the real PostgreSQL database — no mocking. This is the "full user journey across the whole stack" layer, distinct from `apps/client`'s component-level Vitest/RTL tests and `apps/server`'s per-module Vitest/supertest API tests.

## Commands

Run from this directory, or via `npm run test --workspace=apps/e2e` from the repo root (also included in the root `npm test`):

```bash
npx playwright test              # run the full suite headless
npx playwright test --ui         # interactive UI mode
npx playwright test --headed     # watch the browser
npx playwright show-report       # open the HTML report from the last run
```

**Prerequisites**: both dev servers must already be running (`npm run dev:client` and `npm run dev:server` from the repo root) and reachable at `http://localhost:5173` / `http://localhost:3000`, with the database migrated. `playwright.config.ts` does not start them for you.

## Architecture

- `playwright.config.ts` — `baseURL: http://localhost:5173`, single `chromium` project, `workers: 1` (tests share the real dev database — the server's own Vitest suite disables parallelism for the same reason, see `apps/server/CLAUDE.md`).
- `tests/helpers.ts` — `uniqueEmail(prefix)` (timestamp+random, avoids the `409 email already registered` collision across runs/tests since nothing resets this database between runs), `registerUser(page, email, password?)`, `createProject(page, name)`.
- Each spec file registers its own fresh user(s) per test via `uniqueEmail` rather than relying on any fixture/seed data, so tests are independent and safe to re-run without resetting the database.
- `tests/auth.spec.ts` — registration redirects to `/homepage`; logging in with valid credentials redirects to `/homepage` and with an incorrect password shows a generic error and stays on `/login` (both via a separate `browser.newContext()` registered in one context, then logged into fresh in another, since there is no logout UI to reuse a single context); unauthenticated access to `/homepage` and `/dashboard/:id` redirects to `/login`.
- `tests/project-dashboard.spec.ts` — create a task from the Kanban board, move it between columns, filter/search the board (status filter + title search, both reflected in the URL and surviving a reload), drag a card to another column (via raw `page.mouse` events — dnd-kit's PointerSensor doesn't respond to Playwright's high-level `dragTo()`), edit its title/description/priority/due date (note: `getByLabel('Приоритет', { exact: true })` — without `exact`, Playwright's substring match also picks up the filter bar's "Фильтр по приоритету"), assign it to a project member (shows their email on the card), delete it.
- `tests/sidebar-people.spec.ts` — the owner's role renders consistently as "Владелец" in both the People list and the Info panel; a second user (separate `browser.newContext()`, since `localStorage` — and therefore the JWT — is per-origin, not per-tab) joins by the project's code, and the owner either approves the request (new member appears in the People list) or rejects it (applicant sees "Отклонена" in their own join-requests list); a member (non-owner) sees "Участник" in the People list and Info panel and never sees the "Заявки на вступление" section, since `GET /join-requests/pending` only returns requests for projects the current user owns.
- `tests/home-analytics.spec.ts` — a created task is reflected in `/homepage`'s summary and per-project breakdown, clicking a project navigates to its dashboard, and a user with no projects gets the empty state instead of an error.
- `tests/project-settings.spec.ts` — the owner renames the project, removes a member (note: the settings panel and the People list can both render the same member email at once, so the test closes the settings panel before asserting the email is gone, and uses `{ exact: true }` on "Удалить"/"Выйти" since the confirm dialog's button text is a substring of "Удалить проект"/"Выйти из проекта"), and deletes the project (redirects to `/homepage`); a member leaves the project (also redirects to `/homepage`).

## Documentation maintenance

Whenever a change affects this suite's architecture (new helpers, new spec files' scope, config changes), update this file (and the root `CLAUDE.md` if the change is monorepo-wide) as part of the same change.
