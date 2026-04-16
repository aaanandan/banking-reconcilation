# ⚡ Oracle Cloud Quick Start Guide

Get your Banking Reconciliation Platform running on OCI in 30 minutes.

---

## 🎯 Overview

This guide gets you from **zero to running** on Oracle Cloud Infrastructure.

**What you'll deploy:**
- Single VM with all services
- PostgreSQL database
- 23 backend microservices
- React frontend
- Optional: Monitoring stack

**Cost:** FREE (using Always Free tier)

---

## 📋 Before You Start

### **You Need:**
1. ✅ Oracle Cloud account (sign up at cloud.oracle.com)
2. ✅ This repository code
3. ✅ SSH key pair
4. ✅ 30 minutes

### **You'll Get:**
- Public IP address for your application
- Full platform running and accessible
- All services managed by PM2

---

## 🚀 Quick Deployment (5 Steps)

### **Step 1: Create VM (5 minutes)**

1. **Login:** https://cloud.oracle.com
2. **Navigate:** Menu → Compute → Instances → Create Instance
3. **Configure:**
   ```
   Name: banking-server
   Image: Ubuntu 22.04
   Shape: VM.Standard.A1.Flex (Ampere - FREE)
     OCPU: 4
     RAM: 24GB
   Network: Public Subnet + Public IP
   Storage: 100GB
   SSH Key: Generate or upload yours
   ```
4. **Click:** Create
5. **Save:** Public IP address (e.g., 129.213.45.67)

### **Step 2: Configure Network (2 minutes)**

1. **Navigate:** Menu → Networking → Virtual Cloud Networks
2. **Click:** Your VCN → Security Lists → Default Security List
3. **Add Ingress Rules:**
   - Port 22 (SSH)
   - Port 80 (HTTP)
   - Port 443 (HTTPS)
   - Port 3001 (Auth API)
   - Port 5173 (Frontend)
   - Port 3000 (Grafana - optional)

### **Step 3: Connect and Setup (10 minutes)**

```bash
# From your local machine:

# 1. Connect to VM
ssh -i ~/Downloads/ssh-key.key ubuntu@YOUR_VM_IP

# 2. Download and run automated setup
wget https://raw.githubusercontent.com/yourusername/banking-reconcilation/master/oci-startup.sh
chmod +x oci-startup.sh
./oci-startup.sh

# This installs: Node.js, PostgreSQL, Docker, PM2, and configures everything
# Takes ~5-10 minutes
```

### **Step 4: Deploy Application (10 minutes)**

```bash
# 1. Clone repository (or copy files)
git clone https://github.com/yourusername/banking-reconcilation.git
cd banking-reconcilation

# 2. Configure environment
cp .env.example .env
nano .env

# Update these:
# DB_PASSWORD=<from ~/.banking_db_password>
# JWT_SECRET=<generate random 32+ char string>
# NODE_ENV=production

# 3. Install and build backend
cd banking-reconciliation-system
npm install
npm run migration:run
npm run build

# 4. Install and build frontend
cd ../banking-recon-frontend
npm install
nano .env.production
# Set VITE_API_BASE_URL=http://YOUR_VM_IP:3001

npm run build

# 5. Start services with PM2
cd ..
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow the command it outputs
```

### **Step 5: Access Your Application (1 minute)**

Open browser to:
```
http://YOUR_VM_IP:5173
```

**Example:** http://129.213.45.67:5173

You should see the login page! 🎉

---

## 📊 VM Specifications (Free Tier)

### **Recommended Configuration:**

```
Shape: VM.Standard.A1.Flex (Ampere ARM)
CPU: 4 OCPU (equivalent to 4 cores)
RAM: 24 GB
Storage: 100 GB Boot Volume
Network: 10 TB/month outbound (included)
Cost: FREE (Always Free eligible)
```

### **Why This Shape?**
- ✅ **Always Free:** No charges, ever
- ✅ **High Performance:** ARM Ampere A1 processors
- ✅ **Generous Resources:** 24GB RAM perfect for all services
- ✅ **Sufficient Storage:** 100GB for app + database + logs

---

## 🔧 Service Management

### **Check Status:**
```bash
pm2 status
```

### **View Logs:**
```bash
pm2 logs                    # All services
pm2 logs auth-service       # Specific service
pm2 logs --lines 100        # Last 100 lines
```

### **Restart Services:**
```bash
pm2 restart all             # Restart everything
pm2 restart auth-service    # Restart specific service
pm2 reload all              # Zero-downtime reload
```

### **Stop Services:**
```bash
pm2 stop all
pm2 delete all
```

### **Monitor Resources:**
```bash
pm2 monit                   # Real-time monitoring
htop                        # System resources
df -h                       # Disk usage
```

---

## 🌐 Access Points

After deployment:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://YOUR_IP:5173 | Web application |
| **Auth API** | http://YOUR_IP:3001 | Authentication |
| **API Docs** | http://YOUR_IP:3001/api/docs | Swagger UI |
| **Grafana** | http://YOUR_IP:3000 | Monitoring (admin/admin) |
| **Prometheus** | http://YOUR_IP:9090 | Metrics |
| **Kibana** | http://YOUR_IP:5601 | Logs |

---

## 🔒 Security Hardening

### **Essential (Do This First):**

1. **Change Database Password:**
   ```bash
   # Generate strong password
   PASSWORD=$(openssl rand -base64 24)
   
   # Update PostgreSQL
   sudo -u postgres psql -c "ALTER USER bankinguser WITH PASSWORD '$PASSWORD';"
   
   # Update .env file
   nano ~/banking-reconcilation/.env
   # Update DB_PASSWORD=<new_password>
   
   # Restart services
   pm2 restart all
   ```

2. **Update JWT Secret:**
   ```bash
   # Generate random secret
   openssl rand -base64 48
   
   # Add to .env
   nano ~/banking-reconcilation/.env
   # JWT_SECRET=<generated_secret>
   
   # Restart
   pm2 restart all
   ```

3. **Enable Firewall:**
   ```bash
   sudo ufw status
   # Should show: Status: active
   ```

### **Recommended (For Production):**

1. **Setup SSL/HTTPS:**
   ```bash
   # Get domain name first (e.g., banking.yourdomain.com)
   # Point it to your VM IP
   
   # Install Nginx and Certbot
   sudo apt install -y nginx certbot python3-certbot-nginx
   
   # Get SSL certificate
   sudo certbot --nginx -d banking.yourdomain.com
   
   # Access via: https://banking.yourdomain.com
   ```

2. **Restrict OCI Security List:**
   - Change Source CIDR from `0.0.0.0/0` to `YOUR_IP/32`
   - Keep 80/443 open for public access

3. **Setup Fail2Ban:**
   ```bash
   sudo apt install -y fail2ban
   sudo systemctl enable fail2ban
   ```

4. **Enable Auto-Updates:**
   ```bash
   sudo apt install -y unattended-upgrades
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```

---

## 🔄 Updates and Maintenance

### **Update Application:**
```bash
cd ~/banking-reconcilation

# Stop services
pm2 stop all

# Pull latest code
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
```

### **Backup Database:**
```bash
# Create backup
pg_dump -U bankinguser banking_reconciliation > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U bankinguser banking_reconciliation < backup_20260416.sql
```

### **Monitor Disk Space:**
```bash
df -h
# If getting full, clean old logs:
pm2 flush
docker system prune -a
```

---

## 🐛 Troubleshooting

### **Can't Access Application:**
```bash
# 1. Check services are running
pm2 status

# 2. Check firewall
sudo ufw status

# 3. Check OCI Security List
# Go to OCI Console → Networking → Security Lists
# Verify ingress rules for ports 3001, 5173

# 4. Check if services are listening
netstat -tulpn | grep -E '3001|5173'
```

### **Services Keep Restarting:**
```bash
# Check logs
pm2 logs

# Check memory
free -h

# Check database connection
psql -U bankinguser -d banking_reconciliation -h localhost
```

### **Database Connection Errors:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check credentials in .env
cat ~/banking-reconcilation/.env | grep DB_

# Test connection
psql -U bankinguser -d banking_reconciliation -h localhost
```

---

## 💰 Cost Breakdown

### **Free Tier (What You're Using):**
```
VM.Standard.A1.Flex:
  - 4 OCPU: FREE
  - 24 GB RAM: FREE
  - 100 GB Storage: FREE
  - 10 TB/month Transfer: FREE

Total Monthly Cost: $0.00
```

### **If You Scale Up Later:**
```
VM.Standard.E4.Flex (8 OCPU, 64 GB RAM): ~$176/month
Block Storage (200GB): ~$5/month
Load Balancer: ~$30/month

Total for Production: ~$210/month
```

**Stick with Free Tier for testing!**

---

## 📋 Deployment Checklist

- [ ] Create OCI account
- [ ] Create VM instance (VM.Standard.A1.Flex)
- [ ] Configure Security List rules
- [ ] SSH into VM
- [ ] Run oci-startup.sh
- [ ] Clone repository
- [ ] Configure .env file
- [ ] Install dependencies
- [ ] Run migrations
- [ ] Build application
- [ ] Start services with PM2
- [ ] Test in browser
- [ ] (Optional) Setup SSL
- [ ] (Optional) Configure domain
- [ ] (Optional) Start monitoring stack

---

## 🎉 Success!

If you can access http://YOUR_VM_IP:5173 and see the login page, **you're done!**

### **Next Steps:**
1. ✅ Register a test user
2. ✅ Test file upload and reconciliation
3. ✅ Setup SSL for production
4. ✅ Configure monitoring dashboards
5. ✅ Enable automatic backups

---

## 📚 Additional Resources

- **Full Guide:** ORACLE_CLOUD_DEPLOYMENT.md
- **General Deployment:** DEPLOYMENT_GUIDE.md
- **Testing:** TESTING_GUIDE.md
- **How to Run:** HOW_TO_RUN.md

---

**Need help?** Check the troubleshooting section or open an issue on GitHub.

**Oracle Cloud Docs:** https://docs.oracle.com/en-us/iaas/
