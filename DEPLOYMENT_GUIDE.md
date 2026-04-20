# 🚀 Banking Reconciliation SaaS Platform - Deployment Guide

## Quick Start (5 Minutes)

This guide will get you running the complete platform locally with all services.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** (check: `node --version`)
- **PostgreSQL 15+** (check: `psql --version`)
- **Docker & Docker Compose** (check: `docker --version`, `docker-compose --version`)
- **npm** or **yarn** (check: `npm --version`)
- **Git** (check: `git --version`)

### Installing Prerequisites

**macOS:**
```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@18

# Install PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# Install Docker Desktop
brew install --cask docker
```

**Ubuntu/Debian:**
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL 15
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get install postgresql-15

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose
```

---

## 📁 Project Structure

```
banking-reconcilation/
├── banking-reconciliation-system/  # Backend microservices (NestJS)
│   ├── apps/                       # 23 microservices
│   │   ├── auth-service/          # Port 3001 - Authentication
│   │   ├── data-prep-service/     # Port 3003 - File upload
│   │   ├── match-orchestrator/    # Port 3004 - Orchestration
│   │   ├── state-manager-service/ # Port 3005 - State management
│   │   ├── learning-service/      # Port 3006 - ML learning
│   │   ├── question-manager-service/ # Port 3007 - User Q&A
│   │   ├── mt-01-exact-match/     # Port 3010 - Exact matching
│   │   ├── mt-02-near-exact/      # Port 3011 - Near-exact
│   │   └── ... (mt-03 through mt-16)
│   ├── libs/shared/               # Shared entities, DTOs, utils
│   └── migrations/                # Database migrations
├── banking-recon-frontend/        # Frontend (React + Vite)
├── services/billing-service/      # Stripe billing (Express)
├── monitoring/                    # Monitoring configs
├── docker-compose.yml             # Monitoring stack
└── docs/                          # Documentation

```

---

## 🔧 Step 1: Environment Setup

### 1.1 Clone the Repository (if not already done)

```bash
git clone <repository-url>
cd banking-reconcilation
```

### 1.2 Create Environment File

```bash
# Copy the example environment file
cp .env.example .env
```

### 1.3 Configure .env File

Edit `.env` with your actual values:

```bash
# Required: Database Configuration
POSTGRES_DB=banking_reconciliation
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here

# Required: Auth Service
AUTH_SERVICE_PORT=3001
NODE_ENV=development
JWT_SECRET=your-very-long-secret-key-minimum-32-characters-change-in-production

# Optional: Slack Notifications (for monitoring)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Optional: Sentry Error Tracking
SENTRY_DSN=https://your-key@o0.ingest.sentry.io/0

# Optional: Stripe Billing (for payment testing)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

**Important:** For local development, you only need to configure the database settings. Other services are optional.

---

## 🗄️ Step 2: Database Setup

### 2.1 Start PostgreSQL

**macOS:**
```bash
brew services start postgresql@15
```

**Ubuntu/Linux:**
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2.2 Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# In PostgreSQL prompt:
CREATE DATABASE banking_reconciliation;
\q
```

**Alternative (one-liner):**
```bash
psql -U postgres -c "CREATE DATABASE banking_reconciliation;"
```

### 2.3 Run Database Migrations

```bash
cd banking-reconciliation-system
npm install
npm run migration:run
```

**Expected output:**
```
Migration CreateUsersTable1234567890123 has been executed successfully.
Migration CreateTenantsTable1234567890124 has been executed successfully.
Migration CreateReconciliationsTable1234567890125 has been executed successfully.
...
```

### 2.4 Verify Database Setup

```bash
npm run migration:show
```

You should see all migrations marked as "X" (executed).

---

## 🔨 Step 3: Build and Start Backend Services

### 3.1 Install Dependencies

```bash
cd banking-reconciliation-system
npm install
```

### 3.2 Build All Services

```bash
# Build the entire monorepo
npm run build

# Or build specific services:
npm run build:auth          # Auth service
npm run build:data-prep     # Data prep service
npm run build:orchestrator  # Match orchestrator
```

### 3.3 Start Services

**Option A: Start All Services (Development Mode)**

```bash
# Start all services in watch mode
npm run start:dev
```

This starts:
- auth-service (port 3001)
- data-prep-service (port 3003)
- match-orchestrator (port 3004)
- state-manager-service (port 3005)
- learning-service (port 3006)
- question-manager-service (port 3007)
- All 16 matching services (mt-01 through mt-16, ports 3010-3025)

**Option B: Start Individual Services**

```bash
# Terminal 1: Auth Service
npm run start:auth:dev

# Terminal 2: Data Prep Service
npm run start:data-prep:dev

# Terminal 3: Match Orchestrator
npm run start:orchestrator:dev

# Terminal 4: State Manager
npm run start:state-manager:dev
```

### 3.4 Verify Backend Services

Open your browser and check:

- Auth Service: http://localhost:3001/api/health
- Data Prep: http://localhost:3003/api/health
- Orchestrator: http://localhost:3004/api/health
- Prometheus Metrics: http://localhost:3001/metrics

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-16T12:00:00.000Z"
}
```

---

## 🎨 Step 4: Start Frontend Application

### 4.1 Install Frontend Dependencies

```bash
cd ../banking-recon-frontend
npm install
```

### 4.2 Configure Frontend Environment

Create `.env.local` in the frontend directory:

```bash
cat > .env.local << 'EOF'
VITE_API_BASE_URL=http://localhost:3001
VITE_AUTH_SERVICE_URL=http://localhost:3001/api/auth
VITE_DATA_PREP_URL=http://localhost:3003/api
VITE_ORCHESTRATOR_URL=http://localhost:3004/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
EOF
```

### 4.3 Start Frontend Dev Server

```bash
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.x:5173/
```

### 4.4 Access the Application

Open your browser and navigate to:

**http://localhost:5173**

You should see the login page.

---

## 💳 Step 5: Start Billing Service (Optional)

### 5.1 Install Billing Service Dependencies

```bash
cd ../services/billing-service
npm install
```

### 5.2 Configure Stripe

Edit `.env` in the billing service directory:

```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
PORT=3002
```

### 5.3 Start Billing Service

```bash
npm start
```

**Expected output:**
```
Billing service listening on port 3002
```

### 5.4 Verify Billing Service

```bash
curl http://localhost:3002/health
```

---

## 📊 Step 6: Start Monitoring Stack (Optional)

### 6.1 Start Docker Compose Services

```bash
cd ../..  # Back to root directory
docker-compose up -d
```

This starts:
- **PostgreSQL** (port 5432) - Database
- **Prometheus** (port 9090) - Metrics collection
- **Grafana** (port 3000) - Dashboards
- **Alertmanager** (port 9093) - Alert management
- **Jaeger** (port 16686) - Distributed tracing
- **Elasticsearch** (port 9200) - Log storage
- **Logstash** (port 5000) - Log processing
- **Kibana** (port 5601) - Log visualization
- **Filebeat** - Log forwarding

### 6.2 Verify Monitoring Services

```bash
docker-compose ps
```

**Expected output:**
```
       Name                     Command               State           Ports
----------------------------------------------------------------------------------
alertmanager         /bin/alertmanager --config ...   Up      0.0.0.0:9093->9093/tcp
elasticsearch        /usr/local/bin/docker-entr ...   Up      0.0.0.0:9200->9200/tcp
grafana              /run.sh                          Up      0.0.0.0:3000->3000/tcp
jaeger               /go/bin/all-in-one-linux         Up      0.0.0.0:16686->16686/tcp
kibana               /usr/local/bin/kibana-docker     Up      0.0.0.0:5601->5601/tcp
logstash             /usr/local/bin/docker-entr ...   Up      0.0.0.0:5000->5000/tcp
postgres             docker-entrypoint.sh postgres    Up      0.0.0.0:5432->5432/tcp
prometheus           /bin/prometheus --config.f ...   Up      0.0.0.0:9090->9090/tcp
```

### 6.3 Access Monitoring Dashboards

- **Grafana:** http://localhost:3000 (admin/admin)
- **Prometheus:** http://localhost:9090
- **Kibana:** http://localhost:5601
- **Jaeger:** http://localhost:16686
- **Alertmanager:** http://localhost:9093

---

## 🧪 Step 7: Test the Complete Platform

### 7.1 Create a Test Tenant

**Option A: Using the Frontend**

1. Go to http://localhost:5173
2. Click "Sign Up"
3. Fill in the registration form:
   - Company Name: "Test Company"
   - Email: test@example.com
   - Password: Test123!@#
   - Plan: Professional

**Option B: Using API (cURL)**

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User",
    "companyName": "Test Company",
    "plan": "professional"
  }'
```

### 7.2 Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

**Expected response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "...",
  "user": {
    "id": "...",
    "email": "test@example.com",
    "tenantId": "..."
  }
}
```

### 7.3 Test Reconciliation Workflow

**Step 1: Create a Reconciliation**

```bash
export TOKEN="your_access_token_from_login"

curl -X POST http://localhost:3004/api/reconciliations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "January 2026 Reconciliation",
    "description": "Test reconciliation"
  }'
```

**Step 2: Upload Bank Statement**

```bash
curl -X POST http://localhost:3003/api/bank-files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./test-data/sample-bank-statement.csv" \
  -F "reconciliationId=<reconciliation_id>"
```

**Step 3: Upload Ledger File**

```bash
curl -X POST http://localhost:3003/api/ledger-files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./test-data/sample-ledger.csv" \
  -F "reconciliationId=<reconciliation_id>"
```

**Step 4: Start Matching**

```bash
curl -X POST http://localhost:3004/api/reconciliations/<id>/start-matching \
  -H "Authorization: Bearer $TOKEN"
```

**Step 5: Check Results**

```bash
curl http://localhost:3004/api/reconciliations/<id>/results \
  -H "Authorization: Bearer $TOKEN"
```

### 7.4 Test Frontend Workflow

1. **Login** at http://localhost:5173
2. **Dashboard**: View overview and statistics
3. **New Reconciliation**: Click "New Reconciliation"
4. **Upload Files**: Upload bank and ledger CSV files
5. **Column Mapping**: Map columns to standard fields
6. **Date Range**: Select date range (optional)
7. **Start Processing**: Click "Start Matching"
8. **View Results**: See matched, unmatched, and suggestions
9. **Review Matches**: Accept/reject match suggestions
10. **Export**: Download reconciliation report

---

## 📚 Step 8: View Documentation

### 8.1 Documentation Structure

All documentation is in the `docs/` folder:

```bash
cd docs
ls -la
```

**Key Documentation:**

- **README.md** - Master documentation index
- **architecture/** - System architecture and design
- **api/** - API reference and examples
- **deployment/** - Production deployment guides
- **monitoring/** - Monitoring and alerting setup
- **security/** - Security best practices
- **user-guides/** - End-user documentation
- **operations/** - Operational runbooks

### 8.2 View Documentation Locally

```bash
# Install a simple HTTP server
npm install -g http-server

# Serve docs
cd docs
http-server -p 8080

# Open browser to http://localhost:8080
```

---

## 🔍 Step 9: Troubleshooting

### Common Issues

#### Issue 1: Database Connection Failed

**Symptom:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Verify port 5432 is listening
netstat -an | grep 5432
```

#### Issue 2: Port Already in Use

**Symptom:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**
```bash
# Find process using the port
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or change the port in .env
AUTH_SERVICE_PORT=3011
```

#### Issue 3: Migration Failed

**Symptom:**
```
QueryFailedError: relation "users" already exists
```

**Solution:**
```bash
# Revert all migrations
npm run migration:revert

# Run migrations again
npm run migration:run
```

#### Issue 4: Frontend Can't Connect to Backend

**Symptom:**
```
Network Error: Failed to fetch
```

**Solution:**
```bash
# Check backend is running
curl http://localhost:3001/api/health

# Check CORS settings in backend
# File: banking-reconciliation-system/apps/auth-service/src/main.ts
# Ensure: app.enableCors()

# Check frontend .env.local has correct API URL
cat banking-recon-frontend/.env.local
```

#### Issue 5: Docker Compose Services Won't Start

**Symptom:**
```
ERROR: for elasticsearch  Cannot start service elasticsearch: driver failed
```

**Solution:**
```bash
# Increase Docker memory limit (Mac/Windows)
# Docker Desktop → Settings → Resources → Memory: 4GB+

# On Linux, increase vm.max_map_count
sudo sysctl -w vm.max_map_count=262144

# Restart Docker
docker-compose down
docker-compose up -d
```

---

## 🚀 Step 10: Production Deployment

For production deployment, see:

- **Docker Deployment:** `docs/deployment/docker-deployment.md`
- **Kubernetes Deployment:** `docs/deployment/kubernetes-deployment.md`
- **AWS Deployment:** `docs/deployment/aws-deployment.md` (optional)
- **Security Hardening:** `docs/security/production-security.md`
- **Monitoring Setup:** `docs/monitoring/production-monitoring.md`

### Quick Production Checklist

- [ ] Change JWT_SECRET to a strong random string (min 32 chars)
- [ ] Use production database credentials
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS for production domain
- [ ] Set NODE_ENV=production
- [ ] Enable rate limiting
- [ ] Set up database backups
- [ ] Configure monitoring alerts
- [ ] Set up log aggregation
- [ ] Enable Sentry error tracking
- [ ] Configure Stripe webhooks (for billing)
- [ ] Set up CDN for frontend assets
- [ ] Enable database connection pooling
- [ ] Configure auto-scaling
- [ ] Set up CI/CD pipeline

---

## 📞 Support and Resources

### Getting Help

- **Documentation:** http://localhost:8080 (when running docs server)
- **API Documentation:** http://localhost:3001/api/docs (Swagger)
- **GitHub Issues:** https://github.com/yourcompany/banking-reconciliation/issues
- **Support Email:** support@yourcompany.com

### Useful Commands

```bash
# Backend
npm run start:dev              # Start all services in dev mode
npm run build                  # Build all services
npm run test                   # Run all tests
npm run migration:run          # Run database migrations
npm run migration:revert       # Revert last migration

# Frontend
npm run dev                    # Start dev server (port 5173)
npm run build                  # Build for production
npm run preview                # Preview production build
npm run test                   # Run tests

# Docker
docker-compose up -d           # Start monitoring stack
docker-compose down            # Stop all services
docker-compose logs -f         # View logs
docker-compose ps              # Check service status

# Database
npm run migration:show         # Show migration status
npm run seed                   # Seed test data
psql -U postgres -d banking_reconciliation  # Connect to database
```

---

## 🎉 You're All Set!

Your Banking Reconciliation SaaS Platform is now running locally!

**What's Running:**

- ✅ Backend API (23 microservices) - http://localhost:3001-3025
- ✅ Frontend Application - http://localhost:5173
- ✅ Database (PostgreSQL) - localhost:5432
- ✅ Monitoring Stack - http://localhost:3000 (Grafana)
- ✅ Billing Service - http://localhost:3002
- ✅ API Documentation - http://localhost:3001/api/docs

**Next Steps:**

1. Explore the frontend at http://localhost:5173
2. View API docs at http://localhost:3001/api/docs
3. Check monitoring at http://localhost:3000
4. Read the documentation at `docs/`
5. Run the test suite: `npm test`
6. Try the reconciliation workflow with sample data

**Happy reconciling! 🎊**
