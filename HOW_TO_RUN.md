# 🚀 How to Run the Banking Reconciliation Platform

Complete guide to get the platform running on your machine.

---

## ✨ Easiest Way - One Command

I've created automated scripts for you:

### **Start Everything:**
```bash
./START_PLATFORM.sh
```

This script will:
1. ✅ Start PostgreSQL
2. ✅ Create database
3. ✅ Install dependencies
4. ✅ Run migrations
5. ✅ Start all 23 backend services
6. ✅ Start frontend

**Takes about 2-3 minutes on first run.**

### **Stop Everything:**
```bash
./STOP_PLATFORM.sh
```

---

## 📊 What You'll Get

After running `./START_PLATFORM.sh`, you'll have:

**Frontend:**
- URL: http://localhost:5173
- React 18 + TypeScript + Vite + Ant Design

**Backend Services (23 microservices):**
- Auth Service: http://localhost:3001
- API Docs: http://localhost:3001/api/docs
- Data Prep: http://localhost:3003
- Orchestrator: http://localhost:3004
- State Manager: http://localhost:3005
- Learning Service: http://localhost:3006
- Question Manager: http://localhost:3007
- MT-01 through MT-16: http://localhost:3010-3025

**Database:**
- PostgreSQL 16 running on port 5432

**Logs:**
- Backend: `/tmp/banking-logs/backend.log`
- Frontend: `/tmp/banking-logs/frontend.log`

---

## 📝 Manual Step-by-Step (If You Prefer)

### **Step 1: Start PostgreSQL**

```bash
# Option A: Using service (if available)
service postgresql start

# Option B: Using systemctl
systemctl start postgresql

# Option C: Direct (as postgres user)
su - postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D /var/lib/postgresql/16/main start"

# Verify it's running
pg_isready
# Should output: /var/run/postgresql:5432 - accepting connections
```

### **Step 2: Create Database**

```bash
# Switch to postgres user and create database
su - postgres -c "psql -c 'CREATE DATABASE banking_reconciliation;'"

# Verify database exists
su - postgres -c "psql -l" | grep banking_reconciliation
```

### **Step 3: Set Up Environment**

```bash
# .env file is already created
# Edit if you want to change defaults:
nano .env

# Key settings:
# DB_DATABASE=banking_reconciliation
# DB_USERNAME=postgres
# DB_PASSWORD=postgres (or your password)
# JWT_SECRET=your-secret-key-change-in-production
```

### **Step 4: Install Backend Dependencies**

```bash
cd banking-reconciliation-system
npm install

# This takes 2-3 minutes
# Downloads ~500MB of dependencies
```

### **Step 5: Run Database Migrations**

```bash
# Still in banking-reconciliation-system/
npm run migration:run

# You should see output like:
# Migration CreateUsersTable has been executed successfully
# Migration CreateTenantsTable has been executed successfully
# ... (10-15 migrations)
```

### **Step 6: Start Backend Services**

```bash
# Still in banking-reconciliation-system/
npm run start:dev

# This starts all 23 microservices
# You'll see output like:
# [Nest] Starting Nest application...
# [AuthService] Listening on port 3001
# [DataPrepService] Listening on port 3003
# ... (23 services total)
```

**Keep this terminal open!** Backend runs in foreground.

### **Step 7: Start Frontend (New Terminal)**

```bash
# Open a NEW terminal
cd banking-recon-frontend
npm install
npm run dev

# You'll see:
# VITE v5.x.x ready in 500ms
# ➜ Local: http://localhost:5173/
```

### **Step 8: Open Your Browser**

Navigate to: **http://localhost:5173**

You should see the login page!

---

## 🧪 Test the Platform

### **1. Register a New User**

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "firstName": "John",
    "lastName": "Doe",
    "companyName": "Test Company",
    "plan": "professional"
  }'
```

**Or use the web UI:**
1. Go to http://localhost:5173
2. Click "Sign Up"
3. Fill in the form
4. Click "Register"

### **2. Login**

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'

# Save the access_token from response
```

### **3. Test File Upload**

Create sample files:

```bash
# Bank statement
cat > /tmp/bank-test.csv << 'EOF'
Date,Description,Amount
2026-04-15,Payment from Client A,1500.00
2026-04-16,Vendor Payment,-750.50
2026-04-17,Refund,200.00
EOF

# Ledger file
cat > /tmp/ledger-test.csv << 'EOF'
Date,Description,Amount
2026-04-15,Invoice #1234,1500.00
2026-04-16,Bill Payment,-750.50
2026-04-17,Credit Note,200.00
EOF
```

Upload via web UI:
1. Login at http://localhost:5173
2. Click "New Reconciliation"
3. Upload bank-test.csv
4. Upload ledger-test.csv
5. Map columns
6. Start matching!

### **4. Check API Documentation**

Visit: http://localhost:3001/api/docs

You'll see interactive Swagger documentation for all APIs.

### **5. View Logs**

```bash
# Backend logs
tail -f /tmp/banking-logs/backend.log

# Frontend logs
tail -f /tmp/banking-logs/frontend.log

# PostgreSQL logs (if needed)
tail -f /var/log/postgresql/postgresql-16-main.log
```

---

## 🐳 Alternative: Docker Compose (If You Want Containers)

### **Install Docker First:**

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Start Docker service
service docker start

# Verify
docker --version
docker-compose --version
```

### **Run Full Stack in Docker:**

```bash
# Build images (first time only - takes 10-15 minutes)
docker-compose -f docker-compose.full.yml build

# Start everything (30+ containers)
docker-compose -f docker-compose.full.yml up -d

# Check status
docker-compose -f docker-compose.full.yml ps

# View logs
docker-compose -f docker-compose.full.yml logs -f auth-service

# Stop everything
docker-compose -f docker-compose.full.yml down
```

**Access:**
- Frontend: http://localhost:5173
- Auth API: http://localhost:3001
- Grafana: http://localhost:3000
- Prometheus: http://localhost:9090
- Kibana: http://localhost:5601

---

## 🎯 Troubleshooting

### **Issue 1: PostgreSQL won't start**

```bash
# Check if it's already running
ps aux | grep postgres

# Check logs
tail -f /var/log/postgresql/postgresql-16-main.log

# Try starting with verbose output
su - postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D /var/lib/postgresql/16/main start -l /var/log/postgresql/postgresql-16-main.log"
```

### **Issue 2: Port already in use**

```bash
# Find what's using port 3001
lsof -i :3001
netstat -tulpn | grep 3001

# Kill the process
kill -9 <PID>

# Or change port in .env
AUTH_SERVICE_PORT=3011
```

### **Issue 3: Backend services won't start**

```bash
# Check PostgreSQL is running
pg_isready

# Check database exists
su - postgres -c "psql -l" | grep banking

# Check logs
cat /tmp/banking-logs/backend.log

# Reinstall dependencies
cd banking-reconciliation-system
rm -rf node_modules
npm install
```

### **Issue 4: Frontend won't start**

```bash
# Check if port 5173 is available
lsof -i :5173

# Check logs
cat /tmp/banking-logs/frontend.log

# Reinstall dependencies
cd banking-recon-frontend
rm -rf node_modules
npm install
npm run dev
```

### **Issue 5: Database connection errors**

```bash
# Check PostgreSQL is accepting connections
psql -U postgres -d banking_reconciliation -c "SELECT 1"

# Update .env with correct credentials
nano .env

# Update these if needed:
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
```

---

## 📊 Monitoring (Optional)

### **Start Monitoring Stack:**

```bash
# This starts Prometheus, Grafana, ELK, Jaeger
docker-compose up -d

# If Docker not installed, skip this for now
```

**Access Dashboards:**
- **Grafana:** http://localhost:3000 (admin/admin)
- **Prometheus:** http://localhost:9090
- **Kibana:** http://localhost:5601  
- **Jaeger:** http://localhost:16686

---

## 🎉 Quick Command Reference

```bash
# Start everything
./START_PLATFORM.sh

# Stop everything
./STOP_PLATFORM.sh

# View backend logs
tail -f /tmp/banking-logs/backend.log

# View frontend logs
tail -f /tmp/banking-logs/frontend.log

# Check if services are running
curl http://localhost:3001/api/health
curl http://localhost:5173

# Restart backend
./STOP_PLATFORM.sh
cd banking-reconciliation-system && npm run start:dev

# Restart frontend
cd banking-recon-frontend && npm run dev
```

---

## 🚀 What to Test

Once everything is running:

1. ✅ **User Registration** - Create account at http://localhost:5173
2. ✅ **Login** - Sign in with created account
3. ✅ **Dashboard** - View overview
4. ✅ **New Reconciliation** - Create reconciliation job
5. ✅ **File Upload** - Upload bank + ledger CSV files
6. ✅ **Column Mapping** - Map CSV columns to fields
7. ✅ **Date Range** - Select date range (optional)
8. ✅ **Start Matching** - Run reconciliation
9. ✅ **View Results** - See matched/unmatched transactions
10. ✅ **Export Report** - Download reconciliation report

---

## 📞 Need Help?

- **Documentation:** See DEPLOYMENT_GUIDE.md
- **Testing Guide:** See TESTING_GUIDE.md
- **Deployment Options:** See DEPLOYMENT_OPTIONS.md
- **API Docs:** http://localhost:3001/api/docs (when running)

---

**Ready to test? Run:**
```bash
./START_PLATFORM.sh
```

**Then open:** http://localhost:5173

🎉 **Happy testing!**
