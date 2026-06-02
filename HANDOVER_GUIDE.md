# 🎯 Developer Handover Guide - Banking Reconciliation SaaS Platform

## 📋 Quick Start for New AI Agent/Developer

### **ESSENTIAL FILES TO READ FIRST (in order):**

1. **This file** - HANDOVER_GUIDE.md
2. **System Overview** - `docs/SYSTEM_OVERVIEW.md` or `UPDATED_SYSTEM_OVERVIEW.md`
3. **Environment Setup** - `.env.example`
4. **Local Setup** - `RUN_LOCALLY.md`
5. **Architecture** - `docs/TYPESCRIPT_NESTJS_IMPLEMENTATION.md`

---

## 🏗️ ARCHITECTURE OVERVIEW

### **Technology Stack:**
- **Backend:** NestJS (TypeScript) - Microservices Architecture
- **Frontend:** React 19 + TypeScript + Vite + Ant Design
- **Database:** PostgreSQL with TypeORM
- **Testing:** Jest (backend), No tests yet (frontend)
- **Authentication:** JWT with Passport
- **API Documentation:** Swagger/OpenAPI

### **System Structure:**
```
banking-reconcilation/
├── banking-reconciliation-system/    # BACKEND (23+ microservices)
├── banking-recon-frontend/           # FRONTEND (React + Vite)
├── docs/                             # Documentation
├── monitoring/                       # Grafana, Prometheus configs
├── k8s/                             # Kubernetes deployment
├── .env.example                      # Environment template
└── START_ALL_SERVICES.bat/sh        # Startup scripts
```

---

## 🔑 CRITICAL CONFIGURATION FILES

### **1. Environment Configuration**
```
📁 .env.example                          # Template - COPY to .env
📁 .env                                  # Local config (NOT in git)
📁 banking-recon-frontend/.env.local     # Frontend env vars
```

**Key Variables:**
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- `JWT_SECRET` (32+ chars, MUST be secure)
- `NODE_ENV` (development/production)
- `AUTH_SERVICE_PORT=3001`
- `DATA_PREP_SERVICE_PORT=3003`

### **2. Package Dependencies**
```
📁 banking-reconciliation-system/package.json   # Backend deps & scripts
📁 banking-recon-frontend/package.json          # Frontend deps & scripts
```

### **3. Database Configuration**
```
📁 banking-reconciliation-system/data-source.ts        # TypeORM config
📁 banking-reconciliation-system/migrations/           # DB migrations
```

### **4. NestJS Monorepo Configuration**
```
📁 banking-reconciliation-system/nest-cli.json         # Monorepo structure
📁 banking-reconciliation-system/tsconfig.json         # TypeScript config
```

---

## 🎯 BACKEND - MICROSERVICES (NestJS)

### **Core Services Location:**
```
banking-reconciliation-system/apps/
├── auth-service/                    # Port 3001 - Authentication, Users, Tenants
├── data-prep-service/              # Port 3003 - File upload, parsing, validation
├── match-orchestrator/             # Port 3004 - Coordinates matching process
├── state-manager-service/          # Manages reconciliation state
├── learning-service/               # ML-based learning from user decisions
├── question-manager-service/       # Handles user questions/clarifications
└── mt-01 to mt-16/                # 16 Matching Technique Services
```

### **Key Backend Files to Understand:**

#### **Auth Service (Port 3001):**
```
apps/auth-service/src/
├── main.ts                          # Entry point, CORS, security config
├── auth.module.ts                   # Module definition
├── auth.controller.ts               # Routes: /register, /login, /logout
├── auth.service.ts                  # Business logic
├── jwt.strategy.ts                  # JWT authentication
└── entities/
    ├── user.entity.ts              # User model
    └── tenant.entity.ts            # Multi-tenant model
```

#### **Data Prep Service (Port 3003):**
```
apps/data-prep-service/src/
├── main.ts
├── data-prep.controller.ts         # Routes: /upload, /parse, /validate
├── data-prep.service.ts            # File processing logic
└── parsers/
    ├── csv.parser.ts               # CSV parsing
    └── excel.parser.ts             # Excel parsing
```

#### **Match Orchestrator (Port 3004):**
```
apps/match-orchestrator/src/
├── main.ts
├── match-orchestrator.controller.ts
├── match-orchestrator.service.ts    # Coordinates matching workflow
└── strategies/
    └── matching.strategy.ts         # Matching logic
```

#### **Shared Libraries:**
```
libs/shared/src/
├── config/
│   └── security.config.ts           # ⚠️ IMPORTANT: CORS, Helmet, Security
├── entities/                        # Shared database entities
├── dto/                            # Data Transfer Objects
└── guards/                         # Auth guards
```

### **Database Migrations:**
```
banking-reconciliation-system/migrations/
└── *.ts                            # Run with: npm run migration:run
```

### **NPM Scripts (Backend):**
```bash
npm run start:auth:dev              # Start auth service only
npm run start:data-prep:dev         # Start data prep only
npm run start:orchestrator:dev      # Start orchestrator only
npm run build                       # Build all services
npm run migration:run               # Run DB migrations
npm test                           # Run Jest tests
npm run test:cov                   # Test coverage
```

---

## 🎨 FRONTEND (React + Vite)

### **Project Structure:**
```
banking-recon-frontend/src/
├── main.tsx                        # Entry point
├── App.tsx                         # Root component
├── api/
│   ├── client.ts                   # ⚠️ CRITICAL: Axios config, base URLs
│   ├── auth.ts                     # Auth API calls
│   └── reconciliation.ts           # Reconciliation API calls
├── pages/
│   ├── Auth/
│   │   ├── Login.tsx              # Login page
│   │   └── Register.tsx           # Registration page
│   ├── Dashboard/
│   │   └── Dashboard.tsx          # Main dashboard
│   └── Reconciliation/
│       ├── UploadFiles.tsx        # File upload
│       ├── ColumnMapping.tsx      # Column mapping
│       └── Processing.tsx         # Match results
├── components/
│   ├── Layout/
│   │   └── MainLayout.tsx         # App layout
│   └── ProtectedRoute.tsx         # Route guard
├── store/
│   ├── index.ts                   # Redux store
│   └── slices/
│       ├── auth.slice.ts          # Auth state
│       └── reconciliation.slice.ts
└── types/
    └── index.ts                   # TypeScript types
```

### **Key Frontend Files:**

#### **1. API Client Configuration (CRITICAL):**
```typescript
📁 src/api/client.ts
// Default ports for local dev:
- apiClient → http://localhost:3001 (auth-service)
- dataPrepClient → http://localhost:3003 (data-prep-service)
```

#### **2. Authentication:**
```typescript
📁 src/api/auth.ts              # login(), register(), getProfile()
📁 src/store/slices/auth.slice.ts   # Auth state management
📁 src/components/ProtectedRoute.tsx # Route protection
```

#### **3. Main Pages:**
```
📁 src/pages/Auth/Login.tsx         # User login
📁 src/pages/Auth/Register.tsx      # New user registration
📁 src/pages/Dashboard/Dashboard.tsx # Main dashboard after login
📁 src/pages/Reconciliation/        # Reconciliation workflow
```

### **NPM Scripts (Frontend):**
```bash
npm run dev                        # Start dev server (port 5173)
npm run build                      # Production build
npm run preview                    # Preview production build
npm run lint                       # Run ESLint
```

---

## 🗄️ DATABASE

### **Schema Location:**
```
banking-reconciliation-system/apps/*/src/entities/
└── *.entity.ts                    # TypeORM entities define schema
```

### **Key Entities:**
- `User` - User accounts
- `Tenant` - Multi-tenant organizations
- `Transaction` - Bank/ledger transactions
- `Match` - Matched transaction pairs
- `ReconciliationSession` - Reconciliation runs

### **Database Commands:**
```bash
# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show

# Connect to database
psql -U postgres -d banking_reconciliation
```

---

## 🚀 STARTUP SCRIPTS

### **Quick Start (3 Essential Services):**
```bash
START_LOCAL.bat                    # Windows
./START_LOCAL.sh                   # Mac/Linux
```
Starts: auth-service, data-prep-service, match-orchestrator, frontend

### **Full Start (All 23+ Services):**
```bash
START_ALL_SERVICES.bat             # Windows
./START_ALL_SERVICES.sh            # Mac/Linux
```
⚠️ Requires 16GB RAM recommended

### **Manual Start:**
```bash
# Terminal 1: Backend
cd banking-reconciliation-system
npm run start:auth:dev

# Terminal 2: Frontend
cd banking-recon-frontend
npm run dev

# Access: http://localhost:5173
```

---

## 🐛 COMMON ISSUES & FIXES

### **Issue 1: Port Already in Use**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3001 | xargs kill -9
```

### **Issue 2: CORS Error**
```
Location: banking-reconciliation-system/libs/shared/src/config/security.config.ts
Fix: Add frontend URL to allowedOrigins array
Current: ['http://localhost:5173'] ✅
```

### **Issue 3: Wrong API Port**
```
Location: banking-recon-frontend/src/api/client.ts
Fix: Check BASE_URL defaults to 3001, not 3004 or 3000
```

### **Issue 4: Database Connection Failed**
```bash
# Check PostgreSQL is running
# Windows: Check Services
# Mac: brew services start postgresql@15
# Linux: sudo systemctl start postgresql

# Verify credentials in .env match database
```

### **Issue 5: Module Not Found**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 DOCUMENTATION FILES

### **Deployment:**
```
📁 DEPLOY_NOW.md                   # Oracle Cloud deployment
📁 ORACLE_CLOUD_DEPLOYMENT.md      # Detailed OCI guide
📁 OCI_QUICK_START.md             # 30-min quick start
📁 OCI_DEPLOYMENT_CHECKLIST.md    # Step-by-step checklist
📁 RUN_LOCALLY.md                 # Local setup guide (detailed)
```

### **Architecture & Design:**
```
📁 docs/SYSTEM_OVERVIEW.md         # System architecture
📁 docs/TYPESCRIPT_NESTJS_IMPLEMENTATION.md
📁 docs/MATCHING_STRATEGY_QUICK_REFERENCE.md
📁 docs/ENHANCED_LEARNING_SERVICE.md
```

### **Testing:**
```
📁 TESTING_GUIDE.md               # Testing strategies
📁 banking-reconciliation-system/test/  # Test files
```

---

## 🎯 COMMON DEVELOPMENT TASKS

### **1. Add New API Endpoint (Backend):**
```typescript
// Example: apps/auth-service/src/auth.controller.ts
@Post('new-endpoint')
async newEndpoint(@Body() dto: NewDto) {
  return this.authService.handleNew(dto);
}
```

### **2. Add New Frontend Page:**
```typescript
// 1. Create component: src/pages/NewPage/NewPage.tsx
// 2. Add route: src/App.tsx or router config
// 3. Add API call: src/api/newApi.ts
```

### **3. Update Database Schema:**
```bash
# 1. Modify entity: apps/*/src/entities/*.entity.ts
# 2. Generate migration (manual or auto)
# 3. Run migration: npm run migration:run
```

### **4. Fix CORS Issue:**
```typescript
// File: libs/shared/src/config/security.config.ts
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',  // Add new origins here
  'https://yourdomain.com',
];
```

### **5. Add New Microservice:**
```bash
# 1. Use NestJS CLI
nest generate app new-service-name

# 2. Add to nest-cli.json projects
# 3. Add start script to package.json
# 4. Add to startup scripts
```

---

## 🔐 SECURITY CONSIDERATIONS

### **Critical Security Files:**
```
📁 libs/shared/src/config/security.config.ts   # CORS, Helmet, CSP
📁 apps/auth-service/src/jwt.strategy.ts       # JWT validation
📁 .env                                         # NEVER commit this
```

### **Security Checklist:**
- ✅ JWT_SECRET is 32+ characters, random, secure
- ✅ .env files are in .gitignore
- ✅ CORS allowedOrigins is configured correctly
- ✅ Helmet security headers enabled
- ✅ Input validation with class-validator
- ✅ Password hashing with bcrypt
- ✅ SQL injection protection (TypeORM parameterized queries)

---

## 📊 MONITORING & OBSERVABILITY

### **Monitoring Stack (Docker Compose):**
```bash
docker-compose up -d

# Access dashboards:
Grafana:    http://localhost:3000  (admin/admin)
Prometheus: http://localhost:9090
Kibana:     http://localhost:5601
Jaeger:     http://localhost:16686
```

### **Configuration:**
```
📁 monitoring/                     # Monitoring configs
📁 docker-compose.yml             # Docker services
```

---

## 🧪 TESTING

### **Backend Tests:**
```bash
npm test                          # All tests
npm run test:watch               # Watch mode
npm run test:cov                 # Coverage report
npm run test:e2e                 # E2E tests
```

### **Test Files Location:**
```
📁 banking-reconciliation-system/apps/*/test/
📁 banking-reconciliation-system/test/
```

### **Frontend Tests:**
❌ Not configured yet - needs Vitest setup

---

## 🔄 GIT WORKFLOW

### **Current Branch:**
```
claude/saas-implementation-step-111-01Jyfpi1APeHV1huPKneDSrb
```

### **Important Branches:**
- `master` - Main branch with full codebase
- `claude/*` - Feature branches

### **Key Git Files:**
```
📁 .gitignore                     # Ignores .env, node_modules, dist, etc.
```

---

## 📞 QUICK REFERENCE COMMANDS

### **Setup (First Time):**
```bash
# 1. Clone & install
git clone <repo>
cd banking-reconcilation
npm install # Will fail - run in subdirectories

# 2. Setup backend
cd banking-reconciliation-system
npm install
cp ../.env.example ../.env
# Edit .env with database credentials

# 3. Setup database
createdb banking_reconciliation
npm run migration:run

# 4. Build backend
npm run build

# 5. Setup frontend
cd ../banking-recon-frontend
npm install

# 6. Start services
cd ..
./START_LOCAL.bat  # or .sh
```

### **Daily Development:**
```bash
# Start services
START_LOCAL.bat

# Run tests
cd banking-reconciliation-system && npm test

# View logs
# Check terminal windows where services are running
```

---

## 🎓 LEARNING RESOURCES

### **NestJS:**
- [Official Docs](https://docs.nestjs.com/)
- Microservices architecture
- TypeORM integration
- JWT authentication

### **React + Vite:**
- [React Docs](https://react.dev/)
- [Vite Docs](https://vitejs.dev/)
- Redux Toolkit for state management
- Ant Design components

### **PostgreSQL + TypeORM:**
- [TypeORM Docs](https://typeorm.io/)
- Entity definitions
- Migrations
- Relations

---

## 🆘 WHEN STUCK

### **1. Check Logs:**
```bash
# Backend logs: Terminal where service is running
# Frontend logs: Browser console (F12)
# Database logs: Check PostgreSQL logs
```

### **2. Health Checks:**
```bash
# Auth service
curl http://localhost:3001

# Frontend
curl http://localhost:5173
```

### **3. Database:**
```bash
# Connect and inspect
psql -U postgres -d banking_reconciliation
\dt  # List tables
\d users  # Describe users table
```

### **4. Common File Issues:**
- Can't find module → Check tsconfig.json paths
- Port in use → Kill process or change port
- CORS error → Update security.config.ts
- 404 on API → Check controller routes and ports

---

## ✅ HANDOVER CHECKLIST

Before starting development, ensure:

- [ ] Read this entire HANDOVER_GUIDE.md
- [ ] Read RUN_LOCALLY.md
- [ ] Understand folder structure
- [ ] Know where key files are located
- [ ] Can start all services locally
- [ ] Can access frontend (http://localhost:5173)
- [ ] Can register/login successfully
- [ ] Understand CORS configuration
- [ ] Know how to run tests
- [ ] Know how to run migrations
- [ ] Understand multi-tenant architecture
- [ ] Know where to find logs

---

## 📁 FILES BY IMPORTANCE (PRIORITY ORDER)

### **CRITICAL (Must Read First):**
1. `HANDOVER_GUIDE.md` (this file)
2. `RUN_LOCALLY.md`
3. `.env.example`
4. `banking-reconciliation-system/package.json`
5. `banking-recon-frontend/src/api/client.ts`
6. `libs/shared/src/config/security.config.ts`

### **HIGH PRIORITY:**
7. `apps/auth-service/src/main.ts`
8. `apps/auth-service/src/auth.controller.ts`
9. `banking-recon-frontend/src/App.tsx`
10. `nest-cli.json`
11. `data-source.ts`

### **MEDIUM PRIORITY:**
12. All `*.entity.ts` files
13. All `*.controller.ts` files
14. All `*.service.ts` files
15. Frontend pages in `src/pages/`
16. Documentation in `docs/`

### **LOW PRIORITY (When Needed):**
17. Test files
18. Deployment configs
19. Monitoring configs
20. K8s configs

---

## 🎯 IMMEDIATE NEXT STEPS FOR NEW DEVELOPER

**Day 1:**
1. Read HANDOVER_GUIDE.md (this file)
2. Read RUN_LOCALLY.md
3. Set up local environment
4. Start services and access frontend
5. Test registration/login

**Day 2:**
6. Read architecture docs
7. Explore codebase structure
8. Run tests
9. Make a small change (e.g., add console.log)
10. Understand git workflow

**Day 3+:**
11. Pick up assigned tasks
12. Ask questions when stuck
13. Reference this guide frequently

---

## 📝 NOTES

- **System is in active development** - expect some incomplete features
- **Multi-tenant architecture** - all data is tenant-isolated
- **23+ microservices** - can be resource intensive locally
- **No frontend tests yet** - test framework needs to be added
- **CORS issues are common** - check security.config.ts first

---

**Last Updated:** 2026-06-02
**Project:** Banking Reconciliation SaaS Platform
**Repository:** https://github.com/aaanandan/banking-reconcilation
**Session:** 01Jyfpi1APeHV1huPKneDSrb

---

**Good luck! 🚀**
