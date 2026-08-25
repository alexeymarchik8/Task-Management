# Plan: User Registration

**PRD:** [docs/prd-user-registration.md](prd-user-registration.md)  
**Date:** 2026-08-23

## Implementation Phases

### Phase 1: Database Schema & Basic Registration Endpoint (Tracer Bullet)

**Goal:** Minimal working registration endpoint that creates a user record and returns a response.  
**Touches:** backend (database + API)  
**Rationale:** Establishes the core infrastructure (Prisma User model, endpoint structure) so subsequent phases can add validation and security.

**Tasks:**

- [ ] Create Prisma User model with `email`, `password` (for now, unencrypted), and `id` fields
- [ ] Run Prisma migration to create users table in PostgreSQL
- [ ] Create POST `/auth/register` endpoint in Express that accepts `email` and `password`
- [ ] Implement basic flow: accept request → create user record → return user ID and email (no validation yet)
- [ ] **E2E Tests (using supertest):**
  - [ ] POST `/auth/register` with valid email/password returns 201 and user ID
  - [ ] User record created in database with correct email
  - [ ] Response includes `id` and `email` fields

**Ready when:** Endpoint accepts requests, creates user records in database, returns successful HTTP responses; E2E tests verify the full HTTP flow and database persistence.

---

### Phase 2: Validation & Security (Email Format, Password Hash, Uniqueness)

**Goal:** Secure the registration endpoint with input validation and password hashing.  
**Touches:** backend (API + database)  
**Rationale:** Protects against invalid input and ensures passwords are never stored in plaintext.

**Tasks:**

- [ ] Implement email format validation (reject invalid email addresses)
- [ ] Implement password length validation (minimum length enforcement)
- [ ] Integrate bcrypt (or argon2) for password hashing; hash password before saving to database
- [ ] Add unique constraint on email column and check for existing email before creating user; return appropriate error if duplicate
- [ ] **E2E Tests (using supertest):**
  - [ ] POST with invalid email returns 400, no user created
  - [ ] POST with password shorter than minimum returns 400, no user created
  - [ ] POST with duplicate email returns 409/400, no second user created
  - [ ] POST with valid email/password creates user and returns 201
  - [ ] Verify password stored as hash (bcrypt/argon2), not plaintext in database

**Ready when:** All validation rules enforced via HTTP; passwords hashed in database; duplicate emails rejected; E2E tests verify all validation scenarios and database state.

---

### Phase 3: JWT Token Generation & Return

**Goal:** Generate and return a JWT token upon successful registration for immediate authorization.  
**Touches:** backend (API)  
**Rationale:** Completes the registration flow; user receives an authentication token immediately.

**Tasks:**

- [ ] Create JWT token generation utility (sign with JWT_SECRET from environment variables)
- [ ] Include user ID in the JWT payload
- [ ] Return JWT token in the response body on successful registration
- [ ] Add environment variable `JWT_SECRET` to configuration
- [ ] **E2E Tests (using supertest):**
  - [ ] POST with valid email/password returns 201 with `token` in response body
  - [ ] Token is a valid JWT (can be decoded)
  - [ ] Token payload contains user ID from created user
  - [ ] Token is signed with JWT_SECRET (verify signature validation works)
  - [ ] Invalid/tampered tokens fail signature verification

**Ready when:** Successful registration HTTP response includes valid JWT; token payload contains user ID; E2E tests verify token generation, structure, and validation via HTTP requests.

---

## Coverage of Readiness Criteria

- ✓ Phase 1–2–3: `POST /auth/register` with valid email/password creates user and returns JWT
- ✓ Phase 2: Password stored as hash, not plaintext
- ✓ Phase 2: Duplicate email returns error, no second record created
- ✓ Phase 2: Invalid email/short password returns validation error, no user created
- ✓ Phase 3: Returned JWT is properly signed, contains user ID

## Notes

- **TDD + E2E testing:** All phases require test-driven development. Write E2E tests first (using supertest), verify they fail, then implement code to make them pass.
- **E2E test approach:** Each phase includes E2E tests that make actual HTTP POST requests to `/auth/register`, verify response status/body, and check database state.
- **Test client:** Use `supertest` (or similar) to test Express endpoints; reset database before each test to ensure isolation.
- No frontend required for these phases (registration endpoint is backend-only; frontend can be added later to call this endpoint).
- Phases are independent: Phase 2 extends Phase 1, Phase 3 extends Phase 2, but each gives a complete, deployable increment.
