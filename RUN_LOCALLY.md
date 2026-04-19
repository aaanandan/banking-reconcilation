# 💻 Run Banking Reconciliation Platform Locally

Complete guide to run and test the platform on your local machine before deploying to cloud.

---

## 📋 System Requirements

### **Minimum Configuration:**
```
CPU: 4 cores (Intel i5/Ryzen 5 or equivalent)
RAM: 8 GB
Storage: 20 GB free space
OS: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 20.04+)
```

### **Recommended Configuration:**
```
CPU: 6-8 cores (Intel i7/Ryzen 7 or better)
RAM: 16 GB
Storage: 50 GB free space (SSD strongly recommended)
OS: Windows 11, macOS 12+, or Ubuntu 22.04
```

### **What Will Run:**
- ✅ PostgreSQL Database (uses ~200MB RAM)
- ✅ 23 Backend Microservices (uses ~2-4GB RAM total)
- ✅ React Frontend (uses ~500MB RAM)
- ✅ Optional: Monitoring Stack (uses ~2-3GB RAM)

**Total RAM Usage: 4-8GB depending on configuration**

---

## 🛠️ Step 1: Install Prerequisites

### **Windows 10/11:**

#### **1.1 Install Node.js 18+**

1. Download from: https://nodejs.org/
2. Choose "LTS" version (18.x or 20.x)
3. Run installer
4. Check "Add to PATH" option
5. Click "Install"

**Verify installation:**
```powershell
node --version
npm --version
```

#### **1.2 Install PostgreSQL 15+**

1. Download from: https://www.postgresql.org/download/windows/
2. Run installer (version 15 or 16)
3. During installation:
   - Set password: `postgres` (or remember what you set)
   - Port: `5432` (default)
   - Locale: Default
4. Complete installation

**Verify installation:**
```powershell
psql --version
```

#### **1.3 Install Git**

1. Download from: https://git-scm.com/download/win
2. Run installer
3. Use default options
4. Complete installation

**Verify installation:**
```powershell
git --version
```

#### **1.4 Install Docker Desktop (Optional)**

1. Download from: https://www.docker.com/products/docker-desktop
2. Install Docker Desktop
3. Start Docker Desktop
4. Enable WSL 2 if prompted

---

### **macOS:**

#### **1.1 Install Homebrew (if not installed)**

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### **1.2 Install Node.js 18+**

```bash
brew install node@18
```

**Verify:**
```bash
node --version
npm --version
```

#### **1.3 Install PostgreSQL 15+**

```bash
brew install postgresql@15

# Start PostgreSQL
brew services start postgresql@15
```

**Verify:**
```bash
psql --version
```

#### **1.4 Install Git**

```bash
brew install git
```

**Verify:**
```bash
git --version
```

#### **1.5 Install Docker Desktop (Optional)**

```bash
brew install --cask docker
```

Or download from: https://www.docker.com/products/docker-desktop

---

### **Linux (Ubuntu/Debian):**

#### **1.1 Install Node.js 18+**

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify
node --version
npm --version
```

#### **1.2 Install PostgreSQL 15+**

```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Update and install
sudo apt update
sudo apt install -y postgresql-15

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Verify:**
```bash
psql --version
```

#### **1.3 Install Git**

```bash
sudo apt install -y git
git --version
```

#### **1.4 Install Docker (Optional)**

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER
```

---

## 🚀 Step 2: Setup the Application

### **2.1 Clone Repository**

```bash
# Navigate to where you want the project
cd ~/Documents  # or C:\Users\YourName\Documents on Windows

# Clone the repository
git clone https://github.com/yourusername/banking-reconcilation.git

# Go into directory
cd banking-reconcilation
```

### **2.2 Setup Environment File**

```bash
# Copy example environment file
cp .env.example .env
```

**Edit .env file:**

**Windows:** Use Notepad
```powershell
notepad .env
```

**macOS/Linux:** Use nano or any editor
```bash
nano .env
```

**Update these values:**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=banking_reconciliation

# JWT Secret (change this!)
JWT_SECRET=your-very-long-random-secret-minimum-32-characters

# Environment
NODE_ENV=development

# Service Ports
AUTH_SERVICE_PORT=3001
DATA_PREP_SERVICE_PORT=3003
```

**Save and close the file.**

---

## 🗄️ Step 3: Setup Database

### **3.1 Create Database**

**Windows:**
```powershell
# Open Command Prompt as Administrator
psql -U postgres

# In psql prompt:
CREATE DATABASE banking_reconciliation;
\q
```

**macOS/Linux:**
```bash
# Switch to postgres user and create database
sudo -u postgres psql -c "CREATE DATABASE banking_reconciliation;"

# Or if you set up without sudo:
psql -U postgres -c "CREATE DATABASE banking_reconciliation;"
```

### **3.2 Verify Database**

```bash
psql -U postgres -l | grep banking
```

You should see `banking_reconciliation` in the list.

---

## 📦 Step 4: Install Dependencies

### **4.1 Backend Dependencies**

```bash
cd banking-reconciliation-system

# Install (takes 2-3 minutes, downloads ~500MB)
npm install
```

### **4.2 Frontend Dependencies**

```bash
cd ../banking-recon-frontend

# Install (takes 1-2 minutes)
npm install
```

---

## 🏗️ Step 5: Build and Setup

### **5.1 Run Database Migrations**

```bash
cd ../banking-reconciliation-system

npm run migration:run
```

**You should see:**
```
Migration CreateUsersTable has been executed successfully
Migration CreateTenantsTable has been executed successfully
... (more migrations)
```

### **5.2 Build Backend**

```bash
npm run build
```

**This takes 1-2 minutes.**

---

## ▶️ Step 6: Start the Application

### **Option A: Start Everything at Once (Recommended)**

**Windows:** Open 2 terminals (Command Prompt or PowerShell)

**macOS/Linux:** Open 2 terminal windows

**Terminal 1 - Backend:**
```bash
cd banking-reconciliation-system
npm run start:dev
```

You'll see services starting:
```
[Nest] Starting Nest application...
[AuthService] Listening on port 3001
[DataPrepService] Listening on port 3003
...
```

**Terminal 2 - Frontend:**
```bash
cd banking-recon-frontend
npm run dev
```

You'll see:
```
VITE v5.x.x  ready in 500 ms
➜  Local:   http://localhost:5173/
```

**Keep both terminals running!**

---

### **Option B: Use Automated Script (macOS/Linux only)**

```bash
# From project root
./START_PLATFORM.sh
```

This starts everything automatically.

---

## 🌐 Step 7: Access the Application

### **Open Your Browser:**

```
http://localhost:5173
```

**You should see the Banking Reconciliation Platform login page!** 🎉

---

## 🧪 Step 8: Test the Application

### **8.1 Register a New User**

1. Click "Sign Up" or "Register"
2. Fill in:
   ```
   Company: Test Company
   Email: test@example.com
   Password: Test123!@#
   First Name: John
   Last Name: Doe
   Plan: Professional
   ```
3. Click "Register"

### **8.2 Login**

1. Use credentials you just created
2. You should see the dashboard

### **8.3 Test Reconciliation**

1. **Create sample CSV files:**

**bank-statement.csv:**
```csv
Date,Description,Amount
2024-01-15,Payment from Client A,1500.00
2024-01-16,Vendor Payment,-750.50
2024-01-17,Refund,200.00
```

**ledger-file.csv:**
```csv
Date,Description,Amount
2024-01-15,Invoice #1234,1500.00
2024-01-16,Bill Payment,-750.50
2024-01-17,Credit Note,200.00
```

2. **Upload and reconcile:**
   - Click "New Reconciliation"
   - Upload bank-statement.csv
   - Upload ledger-file.csv
   - Map columns
   - Start matching
   - View results!

---

## 📊 Step 9: Start Monitoring Stack (Optional)

**If you installed Docker:**

```bash
cd banking-reconcilation

docker-compose up -d
```

**Access monitoring dashboards:**
- Grafana: http://localhost:3000 (admin/admin)
- Prometheus: http://localhost:9090
- Kibana: http://localhost:5601
- Jaeger: http://localhost:16686

---

## 🛑 How to Stop Services

### **Stop Backend & Frontend:**

Press `Ctrl+C` in each terminal window

### **Stop Monitoring Stack:**

```bash
docker-compose down
```

### **Stop PostgreSQL (if needed):**

**Windows:**
```powershell
# Open Services app
# Find PostgreSQL service
# Click "Stop"
```

**macOS:**
```bash
brew services stop postgresql@15
```

**Linux:**
```bash
sudo systemctl stop postgresql
```

---

## 🔧 Troubleshooting

### **Issue 1: Port Already in Use**

```
Error: Port 3001 already in use
```

**Solution:**

**Windows:**
```powershell
# Find what's using the port
netstat -ano | findstr :3001

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

**macOS/Linux:**
```bash
# Find and kill process
lsof -ti:3001 | xargs kill -9
```

### **Issue 2: Database Connection Failed**

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**

Check PostgreSQL is running:

**Windows:** Check Services app for PostgreSQL service

**macOS:**
```bash
brew services start postgresql@15
```

**Linux:**
```bash
sudo systemctl start postgresql
```

### **Issue 3: Cannot Find Module**

```
Error: Cannot find module '@nestjs/core'
```

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### **Issue 4: Migration Errors**

```
Error: relation "users" already exists
```

**Solution:**
```bash
# Revert migrations
npm run migration:revert

# Run again
npm run migration:run
```

### **Issue 5: Out of Memory**

```
JavaScript heap out of memory
```

**Solution:**

Increase Node.js memory:

```bash
# Windows/macOS/Linux
export NODE_OPTIONS="--max-old-space-size=4096"

# Then restart services
npm run start:dev
```

---

## 💡 Tips for Local Development

### **1. Use VS Code**

- Download: https://code.visualstudio.com/
- Open project folder
- Install recommended extensions:
  - ESLint
  - Prettier
  - TypeScript

### **2. Monitor Resource Usage**

**Windows:** Task Manager → Performance tab

**macOS:** Activity Monitor

**Linux:**
```bash
htop
```

### **3. View Logs**

Backend logs appear in the terminal where you ran `npm run start:dev`

Frontend logs appear in browser console (F12)

### **4. Hot Reload**

Both backend and frontend support hot reload - changes are reflected automatically!

### **5. Database GUI (Optional)**

Use **pgAdmin** or **DBeaver** to view database:
- Download: https://www.pgadmin.org/
- Connect to: localhost:5432
- Database: banking_reconciliation

---

## 📈 Performance Expectations

On recommended specs (8 cores, 16GB RAM):

| Component | Startup Time | RAM Usage | CPU Usage |
|-----------|--------------|-----------|-----------|
| PostgreSQL | 2 seconds | ~200 MB | ~2% |
| Backend (23 services) | 30-60 seconds | ~2-4 GB | ~15-30% |
| Frontend | 10-20 seconds | ~500 MB | ~5-10% |
| Monitoring (Docker) | 1-2 minutes | ~2-3 GB | ~10-20% |

**Total:**
- Startup: ~2 minutes
- RAM: ~4-8 GB
- CPU: ~25-50% during startup, ~10-20% idle

---

## ✅ Ready to Test!

Once everything is running:

1. ✅ Open http://localhost:5173
2. ✅ Register an account
3. ✅ Upload test files
4. ✅ Run reconciliation
5. ✅ View results
6. ✅ Test all features

**If everything works locally, you know it will work in the cloud!**

---

## 🚀 Next Steps After Local Testing

Once you're happy with local testing:

1. **Choose a cloud provider:**
   - Hetzner ($6.30/mo) - Best value
   - DigitalOcean ($48/mo) - Easiest
   - Oracle Free Tier - Keep trying!

2. **Deploy using guides:**
   - ORACLE_CLOUD_DEPLOYMENT.md
   - OCI_QUICK_START.md
   - DEPLOY_NOW.md

3. **The deployment steps are almost identical to local setup!**

---

## 📞 Need Help?

- See HOW_TO_RUN.md for more details
- See DEPLOYMENT_GUIDE.md
- See TESTING_GUIDE.md
- Check logs in terminal windows
- Database issues: Check PostgreSQL is running

---

**Estimated Setup Time: 30-45 minutes**

**You can test everything locally before spending any money on cloud! 🎉**
