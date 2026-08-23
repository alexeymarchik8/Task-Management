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
npm test        # vitest run — E2E tests (supertest) against the real PostgreSQL database
```

Linting and formatting are run from the repo root (`npm run lint`, `npm run format`), not from this package — the root ESLint config applies Node globals to `apps/server/**/*.ts` and ignores the generated Prisma client (`src/generated/**`).

## Architecture

- `src/app.ts` builds and exports the Express `app` (middleware + routes) without starting a listener, so tests can import it directly via `supertest`. `src/index.ts` imports `app` and calls `.listen()`.
- **CORS**: `cors` middleware allows the client dev origin (`CLIENT_ORIGIN` env var, defaults to `http://localhost:5173`) so the browser-based client can call the API cross-origin.
- `GET /health` returns `{ status: 'ok' }`. Port is read from `process.env.PORT`, defaulting to `3000`.
- **Database**: PostgreSQL via Prisma ORM (`prisma/schema.prisma`). Models: `User` (`id`/`email`/`password`/`createdAt`), `Project` (`id`/`name`/`code` unique 8-char alphanumeric/`ownerId`/`createdAt`), `ProjectMember` (`id`/`userId`/`projectId`/`role`: `owner`|`member`/`createdAt`, unique on `[userId, projectId]`) linking users to the projects they belong to, and `JoinRequest` (`id`/`userId`/`projectId`/`status`: `pending`|`approved`|`rejected` (default `pending`)/`createdAt`) tracking requests to join a project by its code. Prisma Client is generated to `src/generated/prisma` (gitignored) using the `provider = "prisma-client-js"` generator, and instantiated in `src/db/prisma.ts` with the `@prisma/adapter-pg` driver adapter over `DATABASE_URL`. Run `npx prisma migrate dev` from this directory after schema changes.
- **Auth**: `POST /auth/register` (`src/auth/register.ts`) validates email format and password length (≥8 chars), hashes the password with `bcryptjs`, enforces email uniqueness (Prisma `P2002` → 409), and returns `{ id, email, token }` where `token` is a JWT signed with `JWT_SECRET` (`src/auth/jwt.ts`) containing the user id. `POST /auth/login` (`src/auth/login.ts`) looks up the user by email and verifies the password with `bcrypt.compare`; on success it returns `{ id, email, token }` the same way, and on any failure (unknown email or wrong password) it returns an identical `401` error so the response never reveals which factor was wrong. `verifyToken` middleware (`src/auth/verifyToken.ts`) reads the `Authorization: Bearer <token>` header, verifies it with `JWT_SECRET`, and sets `req.userId`, returning `401` when the header is missing or the token is invalid/mis-signed.
- **Projects**: Routes in `src/projects/projects.ts`, mounted at the root in `src/app.ts` and protected by `verifyToken`. `POST /projects` validates a required `name`, generates a unique 8-character alphanumeric code (`src/projects/generateProjectCode.ts`, retrying on collision), and creates the `Project` plus an `owner` `ProjectMember` row for the creator in a single transaction, returning `201` with `{ id, name, code }` (or `400` if `name` is missing). `GET /projects` returns the projects where the current user has a `ProjectMember` row (as owner or member).
- **Join requests**: Routes in `src/join-requests/joinRequests.ts`, mounted at the root in `src/app.ts` and protected by `verifyToken`. `POST /projects/join` accepts a `code`, looks up the `Project` by it (`404` "Проект не найден" if missing), rejects with `400` if the current user is already a `ProjectMember` ("Вы уже в проекте") or already has a `pending` `JoinRequest` for that project ("Заявка уже отправлена"), and otherwise creates a `pending` `JoinRequest`, returning `201` with `{ id, userId, projectId, status }`. `GET /join-requests` returns all `JoinRequest` rows belonging to the current user. `DELETE /join-requests/:id` deletes a `JoinRequest` owned by the current user only if its status is `rejected` (`404` if it doesn't exist or belongs to someone else, `400` if not rejected).
- **Testing**: Vitest + supertest E2E tests (`src/**/*.test.ts`) run against the real PostgreSQL database (reachable via the pre-configured SSH tunnel to `localhost:5432`); each test resets relevant tables in `beforeEach`. `vitest.config.ts` disables file parallelism so tests sharing the database don't race.

## Documentation maintenance

Whenever a change affects this app's architecture (routing, database/persistence layer, middleware, folder structure, build config, etc.), update this file (and the root `CLAUDE.md` if the change is monorepo-wide) as part of the same change.
