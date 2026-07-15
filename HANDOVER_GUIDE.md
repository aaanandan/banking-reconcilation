# 🎯 Developer Handover Guide - Banking Reconciliation SaaS Platform

**This version was corrected after actually running the application** (both via
direct Node processes and via static verification of the Docker build/compose
files). The original guide contained several claims that don't match the code
on `master` — those are called out explicitly below rather than silently
removed, so you know what changed and why.

**What "verified" means below:** register (201) and login (JWT returned) were
tested end-to-end for auth-service, data-prep-service, and match-orchestrator
running as plain Node processes against a real Postgres 15 instance, in an
environment with no Docker daemon available. The Docker-specific fixes in this
guide (Dockerfile, docker-compose.full.yml) were verified by careful static
reading of every port/env-var reference against the actual source code — not
by an actual `docker compose up`, since no Docker binary is available in the
environment this guide was authored in. If something below is marked
"unverified," treat it as high-confidence but not proven end-to-end.

---

## 🐳 DOCKER SETUP (Recommended path)

### Which compose file to use

There are **two** compose files at the repo root and they do different things:

| File | What it actually contains |
|---|---|
| `docker-compose.yml` | **Infrastructure only** — Postgres + Prometheus/Grafana/Jaeger/ELK monitoring stack. **No application services at all.** This is why you saw a Postgres container but no app containers — this file was never going to produce them. |
| `docker-compose.full.yml` | Postgres + a subset of the backend microservices + frontend + the same monitoring stack. This is the one you want. It is also **incomplete as shipped** — see "Known gaps" below. |

### Fixes applied in this session (already committed to this checkout)

The following were broken in the repo as cloned from `master` and would have
prevented `docker compose -f docker-compose.full.yml up --build` from working
even for the core services. All are now fixed in this checkout:

1. **`banking-reconciliation-system/Dockerfile` build step would fail immediately.**
   It ran `npm run build:${SERVICE_NAME}` (e.g. `build:auth-service`), but
   `package.json` only defines short aliases for *some* services
   (`build:data-prep`, `build:orchestrator`, `build:state-manager`, `build:mt-01`,
   `build:mt-02`) and has no script at all for `auth-service`,
   `learning-service`, or `question-manager-service`. Building auth-service
   would fail with `npm error Missing script: "build:auth-service"`.
   **Fix:** the Dockerfile now runs `npx nest build ${SERVICE_NAME}` directly,
   which works for every service unconditionally since `SERVICE_NAME` always
   matches a project key in `nest-cli.json`.

2. **`match-orchestrator` hardcoded `app.listen(3005)`**, ignoring
   `docker-compose.full.yml`'s `ORCHESTRATOR_PORT=3004` env var entirely and
   the `"3004:3004"` port mapping. The container would run fine internally on
   3005, but the host mapping to 3004 would reach nothing.
   **Fix:** `apps/match-orchestrator/src/main.ts` now reads
   `process.env.ORCHESTRATOR_PORT`, defaulting to 3005 if unset (so it still
   behaves the same way when run outside Docker).

3. **`data-prep-service` hardcoded `app.listen(3001)`**, colliding directly
   with auth-service's port. **Fix:** now reads `DATA_PREP_SERVICE_PORT`,
   defaulting to 3003.

4. **Dockerfile `HEALTHCHECK` was broken for every service.** It hit
   `http://localhost:$PORT/api/health` — but `PORT` isn't the env var name any
   of these services actually use (`AUTH_SERVICE_PORT`, `DATA_PREP_SERVICE_PORT`,
   `ORCHESTRATOR_PORT`, or nothing at all), and **none of these services expose
   a `/api/health` route.** auth-service's only health route,
   `/admin/health`, requires a valid JWT + AdminGuard, so it can't be used as
   an unauthenticated container healthcheck at all. data-prep-service's real
   health route is `/data-prep/health`; match-orchestrator's is
   `/orchestrate/health`.
   **Fix:** the Dockerfile's generic healthcheck now does a plain TCP connect
   against a new `HEALTH_CHECK_PORT` env var (works regardless of auth or
   route naming). `docker-compose.full.yml` sets `HEALTH_CHECK_PORT` for
   auth-service, data-prep-service, and match-orchestrator, and gives
   data-prep-service and match-orchestrator explicit `healthcheck:` blocks
   pointed at their real routes.

5. **`ALLOWED_ORIGINS` was never set for the auth-service container.** The
   code's hardcoded CORS fallback (`libs/shared/src/config/security.config.ts`)
   does **not** include `http://localhost:5173` — the guide previously claimed
   it did. **Fix:** `docker-compose.full.yml` now sets `ALLOWED_ORIGINS`
   explicitly for auth-service, including `:5173`.

6. **Frontend Vite env vars were set the wrong way and with the wrong names.**
   `docker-compose.full.yml` set `VITE_API_BASE_URL`, `VITE_AUTH_SERVICE_URL`,
   `VITE_DATA_PREP_URL`, `VITE_ORCHESTRATOR_URL` under the frontend
   container's `environment:` block. Two problems: (a) the frontend code
   (`src/api/client.ts`) only ever reads `VITE_API_URL` and
   `VITE_DATA_PREP_URL` — the other two names are never read anywhere; (b)
   more fundamentally, this is a **static Nginx-served production build** —
   Vite bakes `VITE_*` vars into the JS bundle at **build time**; setting them
   as container `environment:` has **zero effect** at runtime. They must be
   Docker build args. On top of that, the default value for
   `VITE_DATA_PREP_URL` had a spurious `/api` suffix that doesn't match any
   real route (routes are `/data-prep/health`, not `/api/data-prep/health`).
   **Fix:** `banking-recon-frontend/Dockerfile` now declares `ARG VITE_API_URL`
   and `ARG VITE_DATA_PREP_URL` (correct names, no `/api` suffix), and
   `docker-compose.full.yml`'s frontend service passes them under `build: args:`
   instead of `environment:`.

7. **Two entity files had duplicate index declarations** (one at class level,
   one on the property) that make TypeORM's schema sync crash with
   `relation "..." already exists`: `libs/shared/src/entities/onboarding-checklist.entity.ts`
   and `libs/shared/src/entities/feature-flag.entity.ts`. Both fixed by
   removing the redundant property-level `@Index()`.

8. **`user.entity.ts`'s `tenant` relation had no `@JoinColumn`.** TypeORM
   silently repurposed the existing string `tenantId` business-ID column as a
   UUID foreign key, which crashes every registration with
   `invalid input syntax for type uuid`. **Fix:** added
   `@JoinColumn({ name: 'tenant_fk_id' })` so the relation gets its own
   physical column, separate from the string `tenantId`.

9. **`user.entity.ts`'s `firstName`/`lastName` columns were non-nullable**,
   but `auth.service.ts`'s `register()` only ever populates `name` — every
   registration failed with a NOT NULL violation. Made both nullable.

10. **`auth.service.ts`'s `register()` never linked the new user to the
    saved `Tenant` object** (only set the string `tenantId`), so
    `login()`'s `user.tenant.status` check crashed with
    `Cannot read properties of null`. Fixed by setting `tenant: tenant` when
    creating the user.

11. **Missing npm packages.** `prom-client`, `@willsoto/nestjs-prometheus`,
    `speakeasy`, and `qrcode` are imported in auth-service source but were
    never added to `package.json` — TypeScript compilation failed with
    `Cannot find module`. Added all four (plus `@types/speakeasy`,
    `@types/qrcode`).

### Known gaps NOT fixed (need your decision before relying on them)

`docker-compose.full.yml` only defines containers for 8 of the 23 backend
services described elsewhere in this guide: `auth-service`, `data-prep-service`,
`match-orchestrator`, `state-manager-service`, `learning-service`,
`question-manager-service`, `mt-01-exact-match`, `mt-02-near-exact`. The file
itself says `# Add MT-03 through MT-16 similarly (ports 3012-3025) — Abbreviated
for brevity` — **they were never actually added.** If you need the full
matching pipeline (MT-03 through MT-16), those container definitions don't
exist yet and would need to be written.

Of the 8 services that *are* defined, several have the same class of bug I
fixed for match-orchestrator and data-prep-service (hardcoded internal port
that ignores the env var docker-compose sets), and I deliberately **did not**
fix these, because doing so touches many files and a couple of them collide
with each other in ways that need a real decision about a port scheme, not a
mechanical patch:

| Service | Compose host port | Env var compose sets | What the code actually does | Result |
|---|---|---|---|---|
| auth-service | 3001 | `AUTH_SERVICE_PORT` | reads it, defaults 3001 | ✅ works |
| data-prep-service | 3003 | `DATA_PREP_SERVICE_PORT` | reads it (fixed this session) | ✅ works |
| match-orchestrator | 3004 | `ORCHESTRATOR_PORT` | reads it (fixed this session), defaults 3005 | ✅ works |
| state-manager-service | 3005 | `STATE_MANAGER_PORT` | **ignores it — hardcoded `app.listen(3002)`** | ❌ dead mapping; also 3002 collides with billing-service's declared port |
| learning-service | 3006 | `LEARNING_SERVICE_PORT` | **ignores it — reads generic `PORT`, defaults 3004** | ❌ dead mapping; real default 3004 collides with mt-02's hardcoded 3004 |
| question-manager-service | 3007 | `QUESTION_MANAGER_PORT` | **ignores it — reads generic `PORT`, defaults 3005** | ❌ dead mapping; real default 3005 collides with match-orchestrator's real default |
| mt-01-exact-match | 3010 | (none — `SERVICE_PORT` set but unused) | hardcoded `app.listen(3003)` | ❌ dead mapping; also 3003 collides with data-prep-service |
| mt-02-near-exact | 3011 | (none — `SERVICE_PORT` set but unused) | hardcoded `app.listen(3004)` | ❌ dead mapping |

**Practical takeaway:** the four services that matter for the actual
user-facing flow — register, login, upload, reconciliation — are
auth-service, data-prep-service, match-orchestrator, and the frontend. Those
four are fixed and internally consistent. state-manager, learning-service,
question-manager, and the MT-0x services are auxiliary/advanced features and
are not reachable via their documented Docker ports as shipped.

### Bringing up the working subset

```bash
# From the repo root
cp .env.example .env   # then edit DB creds / JWT secret if you want non-defaults

docker compose -f docker-compose.full.yml up -d --build \
  postgres auth-service data-prep-service match-orchestrator frontend
```

This starts only the four working app containers plus Postgres (Docker Compose
automatically includes `depends_on` targets). Wait about a minute for the
first build (each backend image compiles the shared lib + its own service).

Migrations run automatically as long as you keep `synchronize` behavior as
configured in `libs/shared/src/shared.module.ts` — see "Database schema" below
for why this matters.

### Verifying it came up

```bash
curl http://localhost:3001            # auth-service root
curl http://localhost:3003/data-prep/health
curl http://localhost:3004/orchestrate/health
curl http://localhost:5173            # frontend (should return HTML)

# Register — note the real DTO field names (differs from earlier versions
# of this guide, which used firstName/lastName/email only):
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"companyName":"Test Co","companyEmail":"test@test.com","name":"John Doe","email":"test@test.com","password":"Test123!@#"}'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!@#"}'
```

A successful register returns `201` with `accessToken`/`refreshToken`/`user`.
A successful login returns the same shape. This exact flow was verified
end-to-end (register → login) with the fixes above applied — just not through
Docker specifically, since no Docker daemon was available to test with
directly. The application code path is identical either way.

### Database schema: synchronize vs. migrations

The codebase has **both** TypeORM migrations (`banking-reconciliation-system/migrations/`)
**and** `synchronize: true` on the shared TypeORM config
(`libs/shared/src/shared.module.ts`), which is a conflicting setup:
`synchronize` tries to reconcile the schema against entity decorators on every
boot, independently of what migrations already did. Running multiple services
with `synchronize: true` concurrently against the same fresh database races
and throws `relation "..." already exists` errors. There's also at least one
entity (`FeatureFlag`) with **no migration at all** — it only ever gets
created via `synchronize`.

What actually works, verified: start with an **empty** database and a single
service first (letting `synchronize: true` build the complete schema once,
unraced), *then* start the rest of the services. If you instead run
`npm run migration:run` first and leave `synchronize: true` on, you will hit
the race condition on first concurrent boot. This repo's docker startup order
(`depends_on: postgres: condition: service_healthy`) does **not** sequence the
app services relative to each other, so if you bring up all four at once
against a freshly-created empty database, you may hit this race on the very
first `docker compose up`. If that happens: `docker compose down -v` (wipes
the Postgres volume) and try `docker compose up -d postgres`, wait for it to
be healthy, bring up just `auth-service` alone first and wait for
`Nest application successfully started` in its logs, then bring up the rest.

---

## 📋 Quick Start for New AI Agent/Developer (original content, corrected inline)

### **ESSENTIAL FILES TO READ FIRST (in order):**

1. **This file** - HANDOVER_GUIDE.md
2. **System Overview** - `docs/UPDATED_SYSTEM_OVERVIEW.md` (note: `docs/SYSTEM_OVERVIEW.md` doesn't exist on `master` — only the `UPDATED_` version does)
3. **Environment Setup** - `.env.example` (root) and `banking-reconciliation-system/.env.example` — **these are two different files with different contents**, don't confuse them
4. ~~`RUN_LOCALLY.md`~~ — **this file does not exist in the repo on `master`**, despite being referenced here and in the priority list below. Use this guide's Docker section, or the npm-based steps further down, instead.
5. **Architecture** - `docs/TYPESCRIPT_NESTJS_IMPLEMENTATION.md`

---

## 🏗️ ARCHITECTURE OVERVIEW

### **Technology Stack:**
- **Backend:** NestJS (TypeScript) - Microservices Architecture
- **Frontend:** React 19 + TypeScript + Vite + Ant Design
- **Database:** PostgreSQL with TypeORM
- **Testing:** Jest (backend) — **123 of 124 tests currently fail** with
  NestJS dependency-injection errors in `TestingModule` setups across almost
  every spec file (missing repository providers). This is pre-existing and
  unrelated to the fixes in this guide. Frontend has no test framework
  configured.
- **Authentication:** JWT with Passport
- **API Documentation:** Swagger/OpenAPI

### **System Structure:**
```
banking-reconcilation/
├── banking-reconciliation-system/    # BACKEND (23 microservices defined in nest-cli.json;
│                                      #           only 8 have Docker container definitions)
├── banking-recon-frontend/           # FRONTEND (React + Vite)
├── docs/                             # Documentation
├── monitoring/                       # Grafana, Prometheus configs
├── k8s/                              # Kubernetes deployment
├── docker-compose.yml                # Infra only (Postgres + monitoring) — NOT the app
├── docker-compose.full.yml           # App + infra, 8 of 23 services, corrected this session
├── .env.example                      # Root env template (Slack/Sentry/DB — different from backend's)
└── START_ALL_SERVICES.bat/sh         # Non-Docker startup scripts (23 services)
```

---

## 🔑 CRITICAL CONFIGURATION FILES

### **1. Environment Configuration**
```
📁 .env.example                                   # ROOT template — Slack, Sentry, POSTGRES_* only
📁 banking-reconciliation-system/.env.example     # BACKEND template — DB_*, JWT_SECRET, ALLOWED_ORIGINS, etc.
📁 banking-reconciliation-system/.env             # Local backend config (NOT in git)
📁 banking-recon-frontend/.env.local              # Frontend env vars (VITE_API_URL, VITE_DATA_PREP_URL)
```

**Key Variables (backend `.env`):**
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- `JWT_SECRET` (32+ chars)
- `NODE_ENV`
- `AUTH_SERVICE_PORT=3001`
- `DATA_PREP_SERVICE_PORT=3003`
- `ORCHESTRATOR_PORT` — **not present in `.env.example` at all; the app now
  reads it (fixed this session) but you must add it yourself if you want
  anything other than the default of 3005**
- `ALLOWED_ORIGINS` — **the hardcoded fallback in `security.config.ts` does
  NOT include `http://localhost:5173`. You must set this explicitly or the
  frontend gets CORS errors.**

### **2. Package Dependencies**
```
📁 banking-reconciliation-system/package.json   # Backend deps & scripts
📁 banking-recon-frontend/package.json          # Frontend deps & scripts
```

### **3. Database Configuration**
```
📁 banking-reconciliation-system/data-source.ts        # TypeORM config for migration CLI
📁 banking-reconciliation-system/migrations/            # DB migrations (incomplete — see "Database schema" above)
```

### **4. NestJS Monorepo Configuration**
```
📁 banking-reconciliation-system/nest-cli.json         # Monorepo structure — 22 services + shared lib
📁 banking-reconciliation-system/tsconfig.json         # TypeScript config
```

---

## 🎯 BACKEND - MICROSERVICES (NestJS)

### **Core Services Location & REAL ports (verified against source, not assumed):**
```
banking-reconciliation-system/apps/
├── auth-service/                    # Port 3001 (env AUTH_SERVICE_PORT) - Authentication, Users, Tenants
├── data-prep-service/               # Port 3003 (env DATA_PREP_SERVICE_PORT, fixed this session) - File upload, parsing, validation
├── match-orchestrator/              # Port 3005 default / 3004 if ORCHESTRATOR_PORT set (fixed this session)
│                                     #   ⚠️ every other doc in this repo says 3004 — that was never true until this session's fix
├── state-manager-service/           # Hardcoded 3002 — ignores STATE_MANAGER_PORT
├── learning-service/                # Defaults 3004 (generic PORT env) — ignores LEARNING_SERVICE_PORT
├── question-manager-service/        # Defaults 3005 (generic PORT env) — ignores QUESTION_MANAGER_PORT
└── mt-01 to mt-16/                  # 16 Matching Technique Services — see port table above, several hardcoded
                                      #   and colliding with core services' real ports
```

#### **Auth Service (Port 3001):**
```
apps/auth-service/src/
├── main.ts                          # Entry point, reads AUTH_SERVICE_PORT
├── auth.module.ts
├── auth.controller.ts               # Routes: POST /auth/register, POST /auth/login
├── auth.service.ts                  # Business logic (fixed: tenant relation, see above)
└── (entities are NOT here — see below)
```

**Correction:** the entities are not under `apps/auth-service/src/entities/` as
previously stated — they're all in the shared library:
```
📁 banking-reconciliation-system/libs/shared/src/entities/user.entity.ts
📁 banking-reconciliation-system/libs/shared/src/entities/tenant.entity.ts
```

**Correction — actual `RegisterDto` fields** (`apps/auth-service/src/dto/register.dto.ts`):
```typescript
{
  companyName: string;   // required
  companyEmail: string;  // required, must be valid email
  name: string;          // required — the user's full name, NOT firstName/lastName
  email: string;         // required, must be valid email
  password: string;      // required, min 8 chars
}
```

#### **Data Prep Service (Port 3003):**
```
apps/data-prep-service/src/
├── main.ts                          # now reads DATA_PREP_SERVICE_PORT (fixed this session)
├── data-prep.controller.ts          # Real route: GET /data-prep/health, plus /data-prep/analyze-multi-bank, /data-prep/validate-and-prepare
├── data-prep.service.ts
```

#### **Match Orchestrator (Port 3005 by default, 3004 if you set ORCHESTRATOR_PORT):**
```
apps/match-orchestrator/src/
├── main.ts                          # now reads ORCHESTRATOR_PORT (fixed this session)
├── match-orchestrator.controller.ts # Real route: GET /orchestrate/health, POST /orchestrate/reconcile
├── match-orchestrator.service.ts
```

#### **Shared Libraries:**
```
libs/shared/src/
├── config/
│   └── security.config.ts           # ⚠️ CORS: reads ALLOWED_ORIGINS env var; hardcoded
│                                     #   fallback does NOT include :5173 — set the env var explicitly
├── entities/                        # All shared database entities (user, tenant, and more)
├── dto/
├── guards/
└── shared.module.ts                 # ⚠️ synchronize: false currently — see "Database schema" section
```

### **NPM Scripts (Backend) — for non-Docker use:**
```bash
npm run start:auth:dev              # Start auth service only
npm run start:data-prep:dev         # Start data prep only
npm run start:orchestrator:dev      # Start orchestrator only
npm run build                       # Builds ONLY the default root app — does NOT build all 22 services
npm run migration:run               # Run DB migrations (see "Database schema" caveat above)
npm test                            # Run Jest tests — expect ~123/124 to fail, pre-existing
```

---

## 🎨 FRONTEND (React + Vite)

### **Key Frontend Files — corrected:**

#### **API Client Configuration (CRITICAL):**
```typescript
📁 src/api/client.ts
// The ONLY two Vite env vars the code actually reads:
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
// ...
baseURL: import.meta.env.VITE_DATA_PREP_URL || 'http://localhost:3003',
```
Any other `VITE_*` name (`VITE_API_BASE_URL`, `VITE_AUTH_SERVICE_URL`,
`VITE_ORCHESTRATOR_URL`) is dead configuration — the frontend never reads them,
even though earlier versions of `docker-compose.full.yml` set them.

### **NPM Scripts (Frontend):**
```bash
npm run dev                        # Start dev server (port 5173)
npm run build                      # Production build — env vars must be present as VITE_* at build time
```

---

## 🐛 COMMON ISSUES & FIXES (corrected + expanded)

### **Issue 1: CORS Error**
```
Location: banking-reconciliation-system/libs/shared/src/config/security.config.ts
The code reads ALLOWED_ORIGINS from env. The hardcoded fallback array does
NOT include :5173 (contrary to what earlier guide versions claimed). Set
ALLOWED_ORIGINS explicitly in .env (non-Docker) or in docker-compose.full.yml's
auth-service environment block (already done in this checkout).
```

### **Issue 2: Wrong API Port / 404 on register**
```
Location: banking-recon-frontend/src/api/client.ts
BASE_URL defaults to 3001 — correct. Just confirm VITE_API_URL isn't set to
something else in your .env.local or Docker build args.
```

### **Issue 3: Register returns 400**
```
The DTO requires companyName, companyEmail, name, email, password — NOT
firstName/lastName. See the corrected curl example above.
```

### **Issue 4: bcrypt native compile fails**
```
bcrypt needs node-gyp + Python + a C compiler at npm install time. In a
network-restricted environment, node-gyp's attempt to download Node headers
from nodejs.org and bcrypt's prebuilt-binary download from GitHub releases
can both be blocked, forcing a source build that then also fails to fetch
headers. Workaround if you hit this: point node-gyp at locally-installed
headers instead of downloading them:
  npm_config_nodedir=/usr npm install
This will not be an issue on a normal machine with unrestricted internet
access (which is what the Docker build assumes).
```

### **Issue 5: Port Already in Use**
```bash
# Linux/Mac
lsof -ti:3001 | xargs kill -9
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### **Issue 6: "relation ... already exists" on startup**
```
See "Database schema: synchronize vs. migrations" above. This is a real,
reproducible bug in how this repo mixes migrations and synchronize=true, not
a transient issue.
```

---

## 🔐 SECURITY CONSIDERATIONS

- `JWT_SECRET` must be 32+ characters
- `.env` files are gitignored — verify before committing
- `ALLOWED_ORIGINS` must be set explicitly (see Issue 1)
- Password hashing via bcrypt — confirmed working once installed (Issue 4)
- TypeORM parameterized queries — no changes needed here

---

## 🧪 TESTING

```bash
npm test          # Expect ~123/124 failing — TestingModule setups are missing
                   # repository providers across almost every spec file. This
                   # is a pre-existing gap in the test suite itself, not
                   # something introduced by the fixes in this guide.
```

---

## ✅ HANDOVER CHECKLIST (updated)

- [ ] Read this entire HANDOVER_GUIDE.md, including the Docker section at the top
- [ ] Understand `docker-compose.yml` (infra only) vs `docker-compose.full.yml` (app + infra, partial)
- [ ] Know that only 4 of 8 defined app containers are actually reachable on their documented ports (auth, data-prep, orchestrator, frontend)
- [ ] Know that 15 of 23 services (MT-03 through MT-16) have no Docker container definitions at all
- [ ] Can bring up the working subset via the `docker compose ... up -d --build postgres auth-service data-prep-service match-orchestrator frontend` command above
- [ ] Can register/login successfully using the correct DTO fields
- [ ] Understand the synchronize-vs-migrations schema race condition and how to avoid it
- [ ] Know where to find logs: `docker compose -f docker-compose.full.yml logs -f <service>`

---

**Last Updated:** 2026-07-15 (this session)
**Project:** Banking Reconciliation SaaS Platform
**Repository:** https://github.com/aaanandan/banking-reconcilation
**Corrections made by:** Claude, after actually running the application and
statically verifying the Docker build/compose configuration against the real
source code.
