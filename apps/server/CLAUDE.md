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

## Environment variables

Copy `.env.example` to `.env` and fill in real values for local development (`.env` is gitignored). `src/index.ts` loads it via `dotenv/config` as its first import, before anything reads `process.env`. Variables: `PORT` (default `3000`), `CLIENT_ORIGIN` (default `http://localhost:5173`), `DATABASE_URL` (Postgres connection string used by Prisma), `JWT_SECRET` (JWT signing secret).

## Architecture

- `src/app.ts` builds and exports the Express `app` (middleware + routes) without starting a listener, so tests can import it directly via `supertest`. `src/index.ts` loads `.env` (`dotenv/config`), imports `app`, and calls `.listen()`.
- **CORS**: `cors` middleware allows the client dev origin (`CLIENT_ORIGIN` env var, defaults to `http://localhost:5173`) so the browser-based client can call the API cross-origin.
- `GET /health` returns `{ status: 'ok' }`. Port is read from `process.env.PORT`, defaulting to `3000`.
- **Folder structure** — each domain lives in `src/modules/<name>/`, split into layers:
  - `routes.ts` — `Router()` wiring only: maps `path -> controller function` (plus `middleware/verifyToken` where the route is protected). No validation or business logic.
  - `controller.ts` — reads/validates `req`, calls `repository`/`services`, writes the `res.status().json()` response. Handler signatures use `AuthenticatedRequest` (from `middleware/verifyToken.ts`) for protected routes.
  - `repository.ts` — the module's only Prisma access (`prisma.*` calls), no HTTP or validation concerns.
  - `types.ts` — the module's request-body/response TS interfaces.

  `src/services/` holds logic shared across modules/middleware: `tokenService.ts` (JWT `generateToken`/`verifyToken`, wraps `jsonwebtoken`), `passwordService.ts` (`hashPassword`/`comparePassword`, wraps `bcryptjs`), `projectCodeService.ts` (`generateUniqueProjectCode`, retrying on collision, with an injectable `codeGenerator` for tests). `src/middleware/verifyToken.ts` is the only Express middleware; it exports `verifyToken` and the `AuthenticatedRequest` type (adds `userId`) used by every protected controller. `src/db/prisma.ts` is unchanged (shared Prisma client).

- **Database**: PostgreSQL via Prisma ORM (`prisma/schema.prisma`). Models: `User` (`id`/`email`/`password`/`createdAt`), `Project` (`id`/`name`/`code` unique 8-char alphanumeric/`ownerId`/`createdAt`), `ProjectMember` (`id`/`userId`/`projectId`/`role`: `owner`|`member`/`createdAt`, unique on `[userId, projectId]`) linking users to the projects they belong to, `JoinRequest` (`id`/`userId`/`projectId`/`status`: `pending`|`approved`|`rejected` (default `pending`)/`createdAt`) tracking requests to join a project by its code, and `Task` (`id`/`title`/`description?`/`status`: `backlog`|`todo`|`in_progress`|`in_review`|`done` (default `backlog`)/`priority`: `low`|`medium`|`high` (default `medium`)/`dueDate?`/`assigneeId?`/`projectId`/`createdAt`/`updatedAt`) belonging to a `Project` and optionally assigned to a `User`. Prisma Client is generated to `src/generated/prisma` (gitignored) using the `provider = "prisma-client-js"` generator, and instantiated in `src/db/prisma.ts` with the `@prisma/adapter-pg` driver adapter over `DATABASE_URL`. Run `npx prisma migrate dev` from this directory after schema changes.
- **Auth** (`src/modules/auth/`): `POST /auth/register` (`controller.ts#register`) validates email format and password length (≥8 chars), hashes the password via `services/passwordService.ts`, enforces email uniqueness (Prisma `P2002` → 409) through `repository.ts#createUser`, and returns `{ id, email, token }` where `token` comes from `services/tokenService.ts#generateToken`. `POST /auth/login` (`controller.ts#login`) looks up the user by email (`repository.ts#findUserByEmail`) and verifies the password via `services/passwordService.ts#comparePassword`; on success it returns `{ id, email, token }` the same way, and on any failure (unknown email or wrong password) it returns an identical `401` error so the response never reveals which factor was wrong. `middleware/verifyToken.ts` reads the `Authorization: Bearer <token>` header, verifies it via `services/tokenService.ts#verifyToken`, and sets `req.userId`, returning `401` when the header is missing or the token is invalid/mis-signed.
- **Projects** (`src/modules/projects/`): routes mounted at the root in `src/app.ts` and protected by `verifyToken`. `POST /projects` (`controller.ts#createProject`) validates a required `name`, generates a unique 8-character alphanumeric code via `services/projectCodeService.ts`, and creates the `Project` plus an `owner` `ProjectMember` row for the creator in a single transaction (`repository.ts#createProjectWithOwner`), returning `201` with `{ id, name, code }` (or `400` if `name` is missing). `GET /projects` (`controller.ts#listProjects`) returns the projects where the current user has a `ProjectMember` row (as owner or member).
- **Join requests** (`src/modules/join-requests/`): routes mounted at the root in `src/app.ts` and protected by `verifyToken`. `POST /projects/join` (`controller.ts#joinProject`) accepts a `code`, looks up the `Project` by it (`404` "Проект не найден" if missing), rejects with `400` if the current user is already a `ProjectMember` ("Вы уже в проекте") or already has a `pending` `JoinRequest` for that project ("Заявка уже отправлена"), and otherwise creates a `pending` `JoinRequest`, returning `201` with `{ id, userId, projectId, status }`. `GET /join-requests` returns all `JoinRequest` rows belonging to the current user. `DELETE /join-requests/:id` deletes a `JoinRequest` owned by the current user only if its status is `rejected` (`404` if it doesn't exist or belongs to someone else, `400` if not rejected). `GET /join-requests/pending` returns `pending` `JoinRequest` rows for projects owned by the current user, each including its `user: { id, email }`. `GET /join-requests/pending/count` returns `{ count }` of the same set. `POST /join-requests/:id/approve` and `POST /join-requests/:id/reject` require the current user to be the owner of the request's project (`404` if the request doesn't exist, `403` if not the owner, `400` if the request isn't `pending`); approve atomically (via `prisma.$transaction` in `repository.ts#approveJoinRequest`) sets the request to `approved` and creates a `member`-role `ProjectMember` for the applicant, while reject just sets the request to `rejected`.
- **Tasks** (`src/modules/tasks/`): routes mounted at the root in `src/app.ts` and protected by `verifyToken`. `POST /projects/:projectId/tasks` (`controller.ts#createTask`) and `GET /projects/:projectId/tasks` (`controller.ts#listTasks`) both first check the current user has a `ProjectMember` row for `:projectId` (`repository.ts#findMembership`), returning `403` otherwise. Create validates a required `title`, an optional `priority` (must be `low`/`medium`/`high`), and an optional `dueDate` (must parse as a date), returning `400` on any failure; on success it creates the `Task` (defaulting `status` to `backlog`, `priority` to `medium`) and returns `201` with the full row. List returns all `Task` rows for the project, unfiltered by status. `PATCH /tasks/:id` (`controller.ts#updateTask`) and `DELETE /tasks/:id` (`controller.ts#deleteTask`) look the task up first (`404` if missing), then check membership via the task's own `projectId` (`403` if not a member); update accepts any subset of `title`/`description`/`status`/`priority`/`dueDate`/`assigneeId` (same validation as create, plus `status` must be one of the 5 `TaskStatus` values — this is how a card moves between board columns) and returns `200` with the updated row; delete removes the row and returns `200` with `{ id }`.
- **Testing**: Vitest + supertest E2E tests (`src/**/*.test.ts`, co-located with the module/service/middleware they cover) run against the real PostgreSQL database (reachable via the pre-configured SSH tunnel to `localhost:5432`); each test resets relevant tables in `beforeEach`. `vitest.config.ts` disables file parallelism so tests sharing the database don't race.

## Documentation maintenance

Whenever a change affects this app's architecture (routing, database/persistence layer, middleware, folder structure, build config, etc.), update this file (and the root `CLAUDE.md` if the change is monorepo-wide) as part of the same change.
