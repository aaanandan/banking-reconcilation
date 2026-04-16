# ☁️ Oracle Cloud Deployment Guide

Deploy the Banking Reconciliation SaaS Platform on Oracle Cloud Infrastructure (OCI) on a single VM.

---

## 📋 Prerequisites

### **Oracle Cloud Account**
- Free Tier account (sufficient for testing)
- Access to OCI Console: https://cloud.oracle.com

### **What You'll Get with Free Tier**
- 2 AMD-based VMs (1/8 OCPU, 1GB RAM each) - **NOT ENOUGH**
- OR 4 ARM-based VMs (Ampere A1, up to 24GB RAM total) - **RECOMMENDED**
- 200GB Block Storage
- 10TB/month outbound data transfer

---

## 🖥️ VM Requirements

### **Minimum (Testing):**
- **CPU:** 4 cores
- **RAM:** 8GB
- **Disk:** 50GB
- **OS:** Ubuntu 22.04 or Oracle Linux 8

### **Recommended (Better Performance):**
- **CPU:** 8 cores (4 OCPU)
- **RAM:** 16GB
- **Disk:** 100GB
- **OS:** Ubuntu 22.04 LTS

### **For Oracle Free Tier:**
Use **Ampere A1 (ARM)** instances:
- Shape: VM.Standard.A1.Flex
- OCPU: 4
- Memory: 24GB
- Storage: 100GB
- **Cost: FREE** (always free tier)

---

## 🚀 Step-by-Step Deployment

### **Step 1: Create VM Instance in Oracle Cloud**

#### **1.1 Login to OCI Console**
```
https://cloud.oracle.com
```

#### **1.2 Create Compute Instance**

1. **Navigate:** Menu → Compute → Instances → Create Instance

2. **Configure Instance:**
   ```
   Name: banking-reconciliation-server
   Compartment: (root) or your compartment
   
   Placement:
   - Availability Domain: (any available)
   
   Image and Shape:
   - Image: Canonical Ubuntu 22.04
   - Shape: VM.Standard.A1.Flex (Ampere - FREE)
     * OCPU count: 4
     * Memory (GB): 24
   
   Networking:
   - VCN: (create new or use existing)
   - Subnet: Public Subnet
   - Assign public IPv4 address: YES
   
   Add SSH Keys:
   - Generate new key pair OR upload your public key
   - Download private key (save it!)
   
   Boot Volume:
   - Size: 100GB
   ```

3. **Click "Create"**

Wait 2-3 minutes for the instance to provision.

#### **1.3 Note Your Instance Details**

After creation, note:
- **Public IP Address:** e.g., 123.456.789.012
- **Username:** `ubuntu` (for Ubuntu) or `opc` (for Oracle Linux)
- **Private Key:** Downloaded .key file

---

### **Step 2: Configure Network Security**

#### **2.1 Create Security List Rules**

1. **Navigate:** Menu → Networking → Virtual Cloud Networks
2. **Click** your VCN → Security Lists → Default Security List
3. **Add Ingress Rules:**

| Source CIDR | Protocol | Port Range | Description |
|-------------|----------|------------|-------------|
| 0.0.0.0/0 | TCP | 22 | SSH |
| 0.0.0.0/0 | TCP | 80 | HTTP |
| 0.0.0.0/0 | TCP | 443 | HTTPS |
| 0.0.0.0/0 | TCP | 5173 | Frontend (dev) |
| 0.0.0.0/0 | TCP | 3001 | Auth Service |
| 0.0.0.0/0 | TCP | 3000 | Grafana |
| 0.0.0.0/0 | TCP | 9090 | Prometheus |
| 0.0.0.0/0 | TCP | 5601 | Kibana |

**For Production:** Restrict 0.0.0.0/0 to your IP only!

#### **2.2 Configure Firewall on VM**

We'll do this after connecting.

---

### **Step 3: Connect to Your VM**

#### **3.1 SSH into the Instance**

```bash
# Make key file secure
chmod 400 ~/Downloads/ssh-key-*.key

# Connect (replace with your IP and key file)
ssh -i ~/Downloads/ssh-key-*.key ubuntu@123.456.789.012
```

**First time:** Type `yes` to accept the host key.

You should see:
```
ubuntu@banking-reconciliation-server:~$
```

#### **3.2 Update the System**

```bash
sudo apt update
sudo apt upgrade -y
```

---

### **Step 4: Install Prerequisites**

#### **4.1 Install Node.js 18+**

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify
node --version  # Should show v18.x or higher
npm --version   # Should show 9.x or higher
```

#### **4.2 Install PostgreSQL 15+**

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

# Verify
sudo systemctl status postgresql
```

#### **4.3 Install Git**

```bash
sudo apt install -y git
git --version
```

#### **4.4 Install Docker (Optional - for monitoring)**

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verify (may need to logout/login first)
docker --version
docker-compose --version
```

#### **4.5 Install PM2 (Process Manager)**

```bash
# Install PM2 globally for keeping services running
sudo npm install -g pm2

# Verify
pm2 --version
```

---

### **Step 5: Clone the Repository**

```bash
# Clone your repository
git clone https://github.com/yourusername/banking-reconcilation.git
cd banking-reconcilation

# Or if you need to copy from local machine:
# On your local machine:
# scp -i ~/Downloads/ssh-key-*.key -r /path/to/banking-reconcilation ubuntu@123.456.789.012:~/
```

---

### **Step 6: Configure the Application**

#### **6.1 Create .env File**

```bash
cp .env.example .env
nano .env
```

**Edit these critical settings:**
```env
# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_strong_password_here
DB_DATABASE=banking_reconciliation

# JWT Secret (MUST CHANGE!)
JWT_SECRET=your-very-long-random-secret-key-minimum-32-characters-change-this

# Environment
NODE_ENV=production

# Auth Service
AUTH_SERVICE_PORT=3001

# Frontend (use your Oracle Cloud VM public IP)
FRONTEND_URL=http://123.456.789.012:5173

# Optional: Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true

# Optional: Stripe (for billing - use test keys)
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key

# Optional: Sentry (for error tracking)
SENTRY_DSN=https://your-sentry-dsn
```

**Save and exit:** Ctrl+X, then Y, then Enter

---

### **Step 7: Set Up Database**

#### **7.1 Configure PostgreSQL**

```bash
# Switch to postgres user
sudo -u postgres psql

# In psql prompt:
CREATE DATABASE banking_reconciliation;
CREATE USER bankinguser WITH ENCRYPTED PASSWORD 'your_strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE banking_reconciliation TO bankinguser;

# Exit
\q
```

#### **7.2 Update .env with Database Credentials**

```bash
nano .env
```

Update:
```env
DB_USERNAME=bankinguser
DB_PASSWORD=your_strong_password_here
```

#### **7.3 Configure PostgreSQL for Remote Access (Optional)**

Only if you want to access database from outside:

```bash
sudo nano /etc/postgresql/15/main/postgresql.conf
```

Find and change:
```
listen_addresses = 'localhost'
```
to:
```
listen_addresses = '*'
```

Edit pg_hba.conf:
```bash
sudo nano /etc/postgresql/15/main/pg_hba.conf
```

Add:
```
host    all             all             0.0.0.0/0               md5
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

---

### **Step 8: Install Dependencies and Build**

#### **8.1 Backend**

```bash
cd ~/banking-reconcilation/banking-reconciliation-system

# Install dependencies
npm install

# Run migrations
npm run migration:run

# Build for production
npm run build
```

#### **8.2 Frontend**

```bash
cd ~/banking-reconcilation/banking-recon-frontend

# Install dependencies
npm install

# Update API URLs for production
nano .env.production
```

Add:
```env
VITE_API_BASE_URL=http://YOUR_VM_PUBLIC_IP:3001
VITE_AUTH_SERVICE_URL=http://YOUR_VM_PUBLIC_IP:3001/api/auth
VITE_DATA_PREP_URL=http://YOUR_VM_PUBLIC_IP:3003/api
VITE_ORCHESTRATOR_URL=http://YOUR_VM_PUBLIC_IP:3004/api
```

Build:
```bash
npm run build
```

---

### **Step 9: Configure Firewall on VM**

```bash
# Allow required ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3001/tcp  # Auth Service
sudo ufw allow 5173/tcp  # Frontend (dev mode)
sudo ufw allow 3000/tcp  # Grafana (optional)
sudo ufw allow 9090/tcp  # Prometheus (optional)

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status
```

---

### **Step 10: Start Services with PM2**

#### **10.1 Create PM2 Ecosystem File**

```bash
cd ~/banking-reconcilation

cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'auth-service',
      cwd: './banking-reconciliation-system',
      script: 'npm',
      args: 'run start:prod:auth-service',
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
      script: 'npm',
      args: 'run start:prod:data-prep-service',
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
      script: 'npm',
      args: 'run start:prod:match-orchestrator',
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
      args: 'run dev',
      env: {
        NODE_ENV: 'production',
        PORT: 5173,
        HOST: '0.0.0.0',
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '300M',
    },
  ],
};
EOF
```

#### **10.2 Start All Services**

```bash
# Start all services
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs
```

#### **10.3 Monitor Services**

```bash
# Real-time monitoring
pm2 monit

# View specific service logs
pm2 logs auth-service
pm2 logs frontend

# Restart a service
pm2 restart auth-service

# Restart all
pm2 restart all
```

---

### **Step 11: Start Monitoring Stack (Optional)**

```bash
cd ~/banking-reconcilation

# Start monitoring with Docker Compose
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

**Access Monitoring:**
- Grafana: http://YOUR_VM_IP:3000 (admin/admin)
- Prometheus: http://YOUR_VM_IP:9090
- Kibana: http://YOUR_VM_IP:5601

---

### **Step 12: Access Your Application**

Open your browser:

```
http://YOUR_VM_PUBLIC_IP:5173
```

**Example:** http://123.456.789.012:5173

You should see the Banking Reconciliation Platform login page!

---

## 🔒 Security Hardening (Important!)

### **1. Change Default Passwords**

```bash
# PostgreSQL
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'new_strong_password';"

# Update .env file
nano ~/banking-reconcilation/.env
```

### **2. Setup SSL/HTTPS with Let's Encrypt**

#### **Get a Domain Name First:**
Point your domain (e.g., banking.yourdomain.com) to your VM's public IP

#### **Install Nginx and Certbot:**

```bash
sudo apt install -y nginx certbot python3-certbot-nginx

# Configure Nginx reverse proxy
sudo nano /etc/nginx/sites-available/banking
```

Add:
```nginx
server {
    listen 80;
    server_name banking.yourdomain.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/banking /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Get SSL certificate:
```bash
sudo certbot --nginx -d banking.yourdomain.com
```

### **3. Restrict Security List to Your IP**

In OCI Console:
1. Go to VCN → Security Lists
2. Edit Ingress Rules
3. Change Source CIDR from `0.0.0.0/0` to `YOUR_IP/32`
4. Keep ports 80 and 443 open to 0.0.0.0/0 for public access

### **4. Setup Fail2Ban**

```bash
sudo apt install -y fail2ban

# Configure
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### **5. Enable Automatic Security Updates**

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 📊 Resource Monitoring

### **Check VM Resources:**

```bash
# CPU and Memory
htop

# Disk usage
df -h

# Service resource usage
pm2 monit

# Docker containers (if running)
docker stats
```

### **OCI Monitoring:**

1. Go to OCI Console → Compute → Instances
2. Click your instance → Metrics
3. View CPU, Memory, Network graphs

---

## 🔄 Updating the Application

```bash
# Stop services
pm2 stop all

# Pull latest code
cd ~/banking-reconcilation
git pull origin master

# Update backend
cd banking-reconciliation-system
npm install
npm run build
npm run migration:run

# Update frontend
cd ../banking-recon-frontend
npm install
npm run build

# Restart services
pm2 restart all

# Check status
pm2 status
```

---

## 🛟 Troubleshooting

### **Services Won't Start:**

```bash
# Check PM2 logs
pm2 logs

# Check PostgreSQL
sudo systemctl status postgresql

# Check disk space
df -h

# Check memory
free -h

# Restart everything
pm2 restart all
sudo systemctl restart postgresql
```

### **Can't Access from Browser:**

```bash
# Check firewall
sudo ufw status

# Check if services are listening
netstat -tulpn | grep -E '3001|5173'

# Check OCI Security List rules
# (go to OCI Console → Networking → Security Lists)

# Check PM2 status
pm2 status
```

### **Database Connection Errors:**

```bash
# Test database connection
psql -U bankinguser -d banking_reconciliation -h localhost

# Check PostgreSQL is running
sudo systemctl status postgresql

# Check logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

---

## 💰 Cost Estimation

### **Oracle Free Tier (Always Free):**
```
VM Instance (Ampere A1): FREE
  - 4 OCPU
  - 24GB RAM
  - 100GB Storage

Outbound Data Transfer: FREE (10TB/month)

Total Monthly Cost: $0.00
```

### **If Using Paid Instance:**
```
VM.Standard.E4.Flex (4 OCPU, 64GB RAM): ~$88/month
Block Storage (100GB): ~$2.50/month
Outbound Data (additional): ~$0.085/GB

Estimated Total: ~$90-100/month
```

**Recommendation:** Use Always Free Tier for testing!

---

## 📋 Quick Command Reference

```bash
# Connect to VM
ssh -i ~/key.key ubuntu@YOUR_VM_IP

# Check service status
pm2 status
pm2 logs

# Restart services
pm2 restart all

# Check database
sudo -u postgres psql -d banking_reconciliation

# View application logs
pm2 logs auth-service --lines 100

# Check disk space
df -h

# Check memory
free -h

# Update application
cd ~/banking-reconcilation && git pull && pm2 restart all

# Backup database
pg_dump -U bankinguser banking_reconciliation > backup_$(date +%Y%m%d).sql
```

---

## ✅ Deployment Checklist

- [ ] Create OCI Compute instance (VM.Standard.A1.Flex recommended)
- [ ] Configure Security List (open ports 22, 80, 443, 3001, 5173)
- [ ] SSH into instance
- [ ] Install Node.js, PostgreSQL, Git, Docker, PM2
- [ ] Clone repository
- [ ] Create and configure .env file
- [ ] Setup PostgreSQL database
- [ ] Install dependencies and build
- [ ] Configure firewall (ufw)
- [ ] Start services with PM2
- [ ] (Optional) Start monitoring stack
- [ ] Access application in browser
- [ ] (Optional) Setup SSL with Let's Encrypt
- [ ] (Optional) Configure domain name
- [ ] Test complete workflow (register, login, reconcile)

---

## 🎉 You're Done!

Your Banking Reconciliation SaaS Platform is now running on Oracle Cloud!

**Access:** http://YOUR_VM_IP:5173

**With HTTPS:** https://banking.yourdomain.com

**Next Steps:**
1. Register a test user
2. Test file upload and reconciliation
3. Configure monitoring dashboards
4. Set up SSL certificate
5. Configure domain name

Need help? See:
- HOW_TO_RUN.md
- DEPLOYMENT_GUIDE.md
- TESTING_GUIDE.md
