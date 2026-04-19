# 🚀 Deploy to Oracle Cloud - Step-by-Step Guide

Follow these exact steps to deploy the Banking Reconciliation Platform to Oracle Cloud.

---

## PART 1: Create Your VM (20 minutes)

### Step 1: Login to Oracle Cloud

1. **Open browser** and go to: https://cloud.oracle.com
2. **Click** "Sign In"
3. **Enter** your Cloud Account Name (you got this when signing up)
4. **Click** "Next"
5. **Enter** username and password
6. **Click** "Sign In"

You should now see the **OCI Console Dashboard**.

---

### Step 2: Create Compute Instance

1. **Click** the hamburger menu (≡) in top-left
2. **Navigate** to: **Compute** → **Instances**
3. **Click** the blue **"Create Instance"** button

---

### Step 3: Configure Instance - Basic Information

In the "Create compute instance" page:

**Name your instance:**
```
Name: banking-reconciliation-server
```

**Placement:**
- Leave defaults (Availability Domain will be auto-selected)

---

### Step 4: Configure Instance - Image and Shape

**Image (Operating System):**

1. **Click** "Change Image"
2. **Select**: Canonical Ubuntu
3. **Choose**: 22.04 (or latest 22.04 version)
4. **Click** "Select Image"

**Shape (VM Size):**

1. **Click** "Change Shape"
2. **Select**: Virtual Machine
3. **Select**: Ampere (ARM-based)
4. **Choose**: VM.Standard.A1.Flex

   **IMPORTANT:** Configure resources:
   ```
   Number of OCPUs: 4
   Amount of memory (GB): 24
   ```
   
   This is FREE tier!

5. **Click** "Select Shape"

---

### Step 5: Configure Instance - Networking

**Primary VNIC:**

1. **Network**: Select your VCN (or click "Create new virtual cloud network")
   - If creating new VCN, accept all defaults

2. **Subnet**: Select Public Subnet

3. **Public IPv4 address**: 
   - ✅ **CHECK** "Assign a public IPv4 address"
   
   **This is critical!** Without this, you can't access your server.

---

### Step 6: Configure Instance - SSH Keys

**Add SSH keys:**

**Option A - Generate New Keys (Recommended):**

1. **Select**: "Generate a key pair for me"
2. **Click**: "Save Private Key" (downloads .key file)
3. **Click**: "Save Public Key" (optional)

**IMPORTANT:** Save the private key file! You'll need it to connect.

Suggested location: `~/Downloads/oci-banking-server.key`

**Option B - Use Existing Key:**

1. **Select**: "Upload public key files (.pub)" or "Paste public keys"
2. Upload or paste your existing public key

---

### Step 7: Configure Instance - Boot Volume

**Boot volume:**

```
Boot volume size (GB): 100
```

Leave other options as default.

---

### Step 8: Create the Instance

1. **Scroll down** to the bottom
2. **Review** your configuration:
   - Shape: VM.Standard.A1.Flex (4 OCPU, 24 GB)
   - Image: Ubuntu 22.04
   - Public IP: Assigned
   - SSH Key: Added

3. **Click** the blue **"Create"** button

**Wait 2-3 minutes** for provisioning...

The instance will show "PROVISIONING" then "RUNNING" with a green dot.

---

### Step 9: Note Your Instance Details

Once running, **SAVE THESE DETAILS:**

On the Instance Details page, you'll see:

```
Public IP address: 123.456.789.012  ← Copy this!
Username: ubuntu
Private key: (the .key file you downloaded)
```

**Write them down:**
```
Public IP: _______________________
Private Key Location: _______________________
```

---

### Step 10: Configure Security List (Allow Traffic)

**CRITICAL STEP** - Open ports so you can access the server:

1. **On Instance Details page**, scroll down to "Instance information"
2. **Click** on the VCN name (under "Primary VNIC")
3. **Click** "Security Lists" in left sidebar
4. **Click** "Default Security List for <your-vcn-name>"
5. **Click** "Add Ingress Rules" button

**Add these rules ONE BY ONE:**

**Rule 1 - SSH:**
```
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 22
Description: SSH access
```
Click "Add Ingress Rules"

**Rule 2 - HTTP:**
```
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 80
Description: HTTP
```
Click "Add Ingress Rules"

**Rule 3 - HTTPS:**
```
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 443
Description: HTTPS
```
Click "Add Ingress Rules"

**Rule 4 - Auth Service:**
```
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 3001
Description: Auth Service
```
Click "Add Ingress Rules"

**Rule 5 - Frontend:**
```
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 5173
Description: Frontend
```
Click "Add Ingress Rules"

**Rule 6 - Grafana (Optional):**
```
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 3000
Description: Grafana
```
Click "Add Ingress Rules"

✅ **Done!** Your VM is ready to accept connections.

---

## PART 2: Connect to Your VM (5 minutes)

### Step 11: Prepare SSH Key (On Your Local Machine)

**macOS/Linux:**

```bash
# Make the key file secure
chmod 400 ~/Downloads/oci-banking-server.key

# Test connection (replace with YOUR IP!)
ssh -i ~/Downloads/oci-banking-server.key ubuntu@YOUR_VM_PUBLIC_IP
```

**Windows (using Git Bash or WSL):**

```bash
# Same as above
chmod 400 ~/Downloads/oci-banking-server.key
ssh -i ~/Downloads/oci-banking-server.key ubuntu@YOUR_VM_PUBLIC_IP
```

**Windows (using PuTTY):**

1. Download PuTTYgen
2. Load the .key file
3. Save as .ppk format
4. Use PuTTY with the .ppk key

---

### Step 12: Connect!

```bash
ssh -i ~/Downloads/oci-banking-server.key ubuntu@YOUR_VM_PUBLIC_IP
```

**First time connecting:**
- You'll see: "The authenticity of host... can't be established"
- Type: `yes`
- Press Enter

**You're in!** You should see:
```
ubuntu@banking-reconciliation-server:~$
```

---

## PART 3: Automated Setup (10 minutes)

### Step 13: Download and Run Setup Script

**Copy and paste these commands** (one at a time):

```bash
# Download the setup script
wget https://raw.githubusercontent.com/yourusername/banking-reconcilation/master/oci-startup.sh

# Make it executable
chmod +x oci-startup.sh

# Run it
./oci-startup.sh
```

**This script will automatically:**
- ✅ Update system packages
- ✅ Install Node.js 18
- ✅ Install PostgreSQL 15
- ✅ Install Docker
- ✅ Install PM2 (process manager)
- ✅ Create database
- ✅ Configure firewall
- ✅ Generate secure database password

**Time:** ~5-10 minutes

**When complete**, you'll see:
```
✅ Base setup completed!
```

Your database password will be saved in `~/.banking_db_password`

---

## PART 4: Deploy Application (15 minutes)

### Step 14: Clone Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/banking-reconcilation.git

# Go into the directory
cd banking-reconcilation
```

**If repository is private**, you may need to:
1. Generate a GitHub Personal Access Token
2. Use: `git clone https://YOUR_TOKEN@github.com/yourusername/banking-reconcilation.git`

**Or copy files from your local machine:**
```bash
# On your local machine (in another terminal):
scp -i ~/Downloads/oci-banking-server.key -r ./banking-reconcilation ubuntu@YOUR_VM_IP:~/
```

---

### Step 15: Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Get database password
cat ~/.banking_db_password

# Edit .env file
nano .env
```

**Update these lines** in the .env file:

```env
# Database (use password from ~/.banking_db_password)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=bankinguser
DB_PASSWORD=PASTE_PASSWORD_FROM_FILE_HERE
DB_DATABASE=banking_reconciliation

# JWT Secret (MUST CHANGE! Generate random string)
JWT_SECRET=your-very-long-random-secret-key-minimum-32-characters-change-this-now

# Environment
NODE_ENV=production

# Ports
AUTH_SERVICE_PORT=3001
DATA_PREP_SERVICE_PORT=3003
```

**To generate JWT secret:**
```bash
# In another terminal on the VM:
openssl rand -base64 48
# Copy the output and paste it as JWT_SECRET
```

**Save and exit nano:**
- Press `Ctrl+X`
- Press `Y`
- Press `Enter`

---

### Step 16: Install Backend Dependencies

```bash
# Go to backend directory
cd banking-reconciliation-system

# Install dependencies (takes 2-3 minutes)
npm install

# Run database migrations
npm run migration:run

# Build the application
npm run build
```

**You should see:**
```
Migration CreateUsersTable has been executed
Migration CreateTenantsTable has been executed
... (more migrations)
Build successful!
```

---

### Step 17: Configure Frontend

```bash
# Go to frontend directory
cd ../banking-recon-frontend

# Install dependencies
npm install

# Create production environment file
nano .env.production
```

**Add this content** (replace YOUR_VM_IP with your actual IP):

```env
VITE_API_BASE_URL=http://YOUR_VM_IP:3001
VITE_AUTH_SERVICE_URL=http://YOUR_VM_IP:3001/api/auth
VITE_DATA_PREP_URL=http://YOUR_VM_IP:3003/api
VITE_ORCHESTRATOR_URL=http://YOUR_VM_IP:3004/api
```

**Example:**
```env
VITE_API_BASE_URL=http://129.213.45.67:3001
VITE_AUTH_SERVICE_URL=http://129.213.45.67:3001/api/auth
VITE_DATA_PREP_URL=http://129.213.45.67:3003/api
VITE_ORCHESTRATOR_URL=http://129.213.45.67:3004/api
```

**Save and exit:**
- `Ctrl+X`, `Y`, `Enter`

---

### Step 18: Create PM2 Ecosystem File

```bash
# Go back to root directory
cd ~/banking-reconcilation

# Create ecosystem file
nano ecosystem.config.js
```

**Paste this content:**

```javascript
module.exports = {
  apps: [
    {
      name: 'auth-service',
      cwd: './banking-reconciliation-system',
      script: 'node',
      args: 'dist/apps/auth-service/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M',
    },
    {
      name: 'data-prep-service',
      cwd: './banking-reconciliation-system',
      script: 'node',
      args: 'dist/apps/data-prep-service/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M',
    },
    {
      name: 'match-orchestrator',
      cwd: './banking-reconciliation-system',
      script: 'node',
      args: 'dist/apps/match-orchestrator/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M',
    },
    {
      name: 'frontend',
      cwd: './banking-recon-frontend',
      script: 'npm',
      args: 'run dev -- --host 0.0.0.0',
      env: {
        NODE_ENV: 'production',
        PORT: 5173,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '300M',
    },
  ],
};
```

**Save and exit:**
- `Ctrl+X`, `Y`, `Enter`

---

### Step 19: Start All Services

```bash
# Start all services with PM2
pm2 start ecosystem.config.js

# Check status
pm2 status

# Save PM2 configuration
pm2 save

# Setup PM2 to start on server reboot
pm2 startup
```

**The last command will output another command to run.**

**Run that command** (it looks like):
```bash
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

**Check services are running:**
```bash
pm2 status
```

You should see:
```
┌─────┬────────────────────┬─────────┬─────────┬─────────┐
│ id  │ name               │ status  │ restart │ uptime  │
├─────┼────────────────────┼─────────┼─────────┼─────────┤
│ 0   │ auth-service       │ online  │ 0       │ 5s      │
│ 1   │ data-prep-service  │ online  │ 0       │ 5s      │
│ 2   │ match-orchestrator │ online  │ 0       │ 5s      │
│ 3   │ frontend           │ online  │ 0       │ 5s      │
└─────┴────────────────────┴─────────┴─────────┴─────────┘
```

All should show **"online"**!

---

## PART 5: Test Your Application! (5 minutes)

### Step 20: Open in Browser

**Open your web browser** and go to:

```
http://YOUR_VM_PUBLIC_IP:5173
```

**Example:**
```
http://129.213.45.67:5173
```

**You should see:** The Banking Reconciliation Platform login page! 🎉

---

### Step 21: Create Test Account

1. **Click** "Sign Up" or "Register"
2. **Fill in**:
   ```
   Company Name: Test Company
   Email: test@example.com
   Password: Test123!@#
   First Name: John
   Last Name: Doe
   Plan: Professional
   ```
3. **Click** "Register"

You should be redirected to the dashboard!

---

### Step 22: Test Reconciliation

1. **Click** "New Reconciliation"
2. **Upload** a bank statement CSV
3. **Upload** a ledger CSV  
4. **Map** columns
5. **Start** matching
6. **View** results!

---

## 🎉 CONGRATULATIONS!

Your Banking Reconciliation Platform is now **LIVE** on Oracle Cloud!

---

## 📊 What You Have Running

**Services:**
- ✅ Auth Service (port 3001)
- ✅ Data Prep Service (port 3003)
- ✅ Match Orchestrator (port 3004)
- ✅ Frontend (port 5173)
- ✅ PostgreSQL Database (port 5432)

**Access URLs:**
```
Frontend:  http://YOUR_VM_IP:5173
Auth API:  http://YOUR_VM_IP:3001
API Docs:  http://YOUR_VM_IP:3001/api/docs
```

**Cost:** $0.00/month (Free Tier!)

---

## 🔧 Useful Commands

### View Logs:
```bash
pm2 logs                    # All services
pm2 logs auth-service       # Specific service
```

### Restart Services:
```bash
pm2 restart all
pm2 restart auth-service
```

### Stop Services:
```bash
pm2 stop all
```

### Monitor Resources:
```bash
pm2 monit                   # Real-time monitoring
htop                        # System resources
```

### Check Database:
```bash
psql -U bankinguser -d banking_reconciliation
```

---

## 🔒 Next Steps (Optional)

### 1. Setup SSL/HTTPS:
- Get a domain name
- Point it to your VM IP
- Install Let's Encrypt certificate
- See: ORACLE_CLOUD_DEPLOYMENT.md for details

### 2. Start Monitoring Stack:
```bash
cd ~/banking-reconcilation
docker-compose up -d
```

Access:
- Grafana: http://YOUR_VM_IP:3000 (admin/admin)
- Prometheus: http://YOUR_VM_IP:9090
- Kibana: http://YOUR_VM_IP:5601

### 3. Security Hardening:
- Restrict Security List to your IP only
- Enable Fail2Ban
- Setup automatic backups
- See: ORACLE_CLOUD_DEPLOYMENT.md

---

## 🆘 Troubleshooting

**Services won't start:**
```bash
pm2 logs
pm2 restart all
```

**Can't access from browser:**
- Check Oracle Cloud Security List (ports must be open)
- Check VM firewall: `sudo ufw status`
- Check services: `pm2 status`

**Database errors:**
```bash
sudo systemctl status postgresql
psql -U bankinguser -d banking_reconciliation
```

**Need more help:**
- See: ORACLE_CLOUD_DEPLOYMENT.md (detailed troubleshooting)
- Check logs: `pm2 logs`
- System logs: `sudo journalctl -xe`

---

## ✅ Summary

**Time Taken:** ~45 minutes  
**Cost:** $0.00 (Free Tier)  
**Status:** ✅ DEPLOYED AND RUNNING

**Your application is live at:**
```
http://YOUR_VM_IP:5173
```

🎉 **Well done!**
