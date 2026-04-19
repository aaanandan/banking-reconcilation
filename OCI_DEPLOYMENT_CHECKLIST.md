# 📋 Oracle Cloud Deployment Checklist

Use this checklist to deploy the Banking Reconciliation Platform to Oracle Cloud.

---

## ✅ Pre-Deployment Checklist

### **Oracle Cloud Account:**
- [ ] Have Oracle Cloud account (sign up at https://cloud.oracle.com)
- [ ] Can login to OCI Console
- [ ] Know your region (e.g., US East, EU Frankfurt)

### **Local Machine:**
- [ ] Have SSH key pair (or can generate one)
- [ ] Have Git installed
- [ ] Have repository code locally

### **Repository:**
- [ ] Code is in Git repository
- [ ] .env.example file exists
- [ ] All deployment scripts present

---

## 🖥️ VM Creation Checklist

### **Step 1: Login to Oracle Cloud**
- [ ] Navigate to https://cloud.oracle.com
- [ ] Login with your credentials
- [ ] See the OCI Console dashboard

### **Step 2: Create Compute Instance**
- [ ] Go to: Menu → Compute → Instances
- [ ] Click "Create Instance"
- [ ] Enter name: `banking-reconciliation-server`
- [ ] Select image: **Ubuntu 22.04**
- [ ] Select shape: **VM.Standard.A1.Flex** (Ampere - FREE)
- [ ] Configure: 4 OCPU, 24GB RAM
- [ ] Select: Public subnet
- [ ] Enable: Assign public IPv4 address
- [ ] Add SSH key (generate or upload)
- [ ] Download private key (save it!)
- [ ] Set boot volume: 100GB
- [ ] Click "Create"

### **Step 3: Note VM Details**
- [ ] Public IP address: _______________________
- [ ] Private key location: _______________________
- [ ] Username: ubuntu (for Ubuntu) or opc (for Oracle Linux)

### **Step 4: Configure Network Security**
- [ ] Go to: Menu → Networking → Virtual Cloud Networks
- [ ] Click your VCN → Security Lists → Default Security List
- [ ] Click "Add Ingress Rules"
- [ ] Add these ports:
  - [ ] Port 22 (SSH) - Source: 0.0.0.0/0
  - [ ] Port 80 (HTTP) - Source: 0.0.0.0/0
  - [ ] Port 443 (HTTPS) - Source: 0.0.0.0/0
  - [ ] Port 3001 (Auth API) - Source: 0.0.0.0/0
  - [ ] Port 5173 (Frontend) - Source: 0.0.0.0/0
  - [ ] Port 3000 (Grafana) - Source: 0.0.0.0/0

---

## 🔧 Deployment Checklist

### **Step 1: Connect to VM**
```bash
chmod 400 ~/path/to/your-key.key
ssh -i ~/path/to/your-key.key ubuntu@YOUR_VM_IP
```
- [ ] Successfully connected to VM
- [ ] See command prompt: `ubuntu@banking-reconciliation-server:~$`

### **Step 2: Run Automated Setup**
```bash
# Download setup script
wget https://raw.githubusercontent.com/yourusername/banking-reconcilation/master/oci-startup.sh
chmod +x oci-startup.sh
./oci-startup.sh
```
- [ ] Script completed successfully
- [ ] Node.js installed
- [ ] PostgreSQL installed
- [ ] Docker installed
- [ ] PM2 installed
- [ ] Database created
- [ ] Firewall configured

### **Step 3: Clone Repository**
```bash
git clone https://github.com/yourusername/banking-reconcilation.git
cd banking-reconcilation
```
- [ ] Repository cloned
- [ ] All files present

### **Step 4: Configure Environment**
```bash
cp .env.example .env
nano .env
```

Update these values:
- [ ] DB_PASSWORD (get from `~/.banking_db_password`)
- [ ] JWT_SECRET (generate random 32+ char string)
- [ ] NODE_ENV=production
- [ ] Update any other settings

### **Step 5: Install Backend**
```bash
cd banking-reconciliation-system
npm install
npm run migration:run
npm run build
```
- [ ] Dependencies installed
- [ ] Migrations completed
- [ ] Build successful

### **Step 6: Install Frontend**
```bash
cd ../banking-recon-frontend
npm install
```

Create `.env.production`:
```bash
nano .env.production
```
Add:
```
VITE_API_BASE_URL=http://YOUR_VM_IP:3001
VITE_AUTH_SERVICE_URL=http://YOUR_VM_IP:3001/api/auth
VITE_DATA_PREP_URL=http://YOUR_VM_IP:3003/api
VITE_ORCHESTRATOR_URL=http://YOUR_VM_IP:3004/api
```
- [ ] .env.production created
- [ ] Dependencies installed

### **Step 7: Create PM2 Ecosystem File**
```bash
cd ~/banking-reconcilation
```

Create `ecosystem.config.js` (see ORACLE_CLOUD_DEPLOYMENT.md for full config)

- [ ] ecosystem.config.js created
- [ ] All services configured

### **Step 8: Start Services**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
# Run the command it outputs
```
- [ ] All services started
- [ ] PM2 status shows "online"
- [ ] PM2 configured to start on boot

---

## 🧪 Testing Checklist

### **Step 1: Check Services**
```bash
pm2 status
```
- [ ] All services showing "online"
- [ ] No services showing "errored"

### **Step 2: Check Logs**
```bash
pm2 logs
```
- [ ] No critical errors in logs
- [ ] Services listening on expected ports

### **Step 3: Test from Browser**

Open browser to: `http://YOUR_VM_IP:5173`

- [ ] Login page loads
- [ ] No console errors
- [ ] Page styling looks correct

### **Step 4: Test Registration**
- [ ] Click "Sign Up"
- [ ] Fill registration form
- [ ] Successfully create account
- [ ] Redirected to dashboard

### **Step 5: Test Login**
- [ ] Login with created account
- [ ] Successfully authenticate
- [ ] Dashboard loads

### **Step 6: Test File Upload**
- [ ] Click "New Reconciliation"
- [ ] Upload bank CSV file
- [ ] Upload ledger CSV file
- [ ] Files upload successfully

### **Step 7: Test Reconciliation**
- [ ] Map columns
- [ ] Start matching process
- [ ] Results display
- [ ] Can download report

---

## 🔒 Security Checklist

### **Essential (Do Immediately):**
- [ ] Change database password
- [ ] Update JWT_SECRET in .env
- [ ] Restart services after changes
- [ ] Firewall enabled on VM

### **Recommended (For Production):**
- [ ] Get domain name
- [ ] Point domain to VM IP
- [ ] Install SSL certificate (Let's Encrypt)
- [ ] Configure Nginx reverse proxy
- [ ] Restrict OCI Security List to specific IPs
- [ ] Enable Fail2Ban
- [ ] Setup automatic backups
- [ ] Enable auto-updates

---

## 📊 Monitoring Checklist (Optional)

### **Start Monitoring Stack:**
```bash
cd ~/banking-reconcilation
docker-compose up -d
```
- [ ] Monitoring stack started
- [ ] All containers running

### **Access Dashboards:**
- [ ] Grafana: http://YOUR_VM_IP:3000 (admin/admin)
- [ ] Prometheus: http://YOUR_VM_IP:9090
- [ ] Kibana: http://YOUR_VM_IP:5601
- [ ] Jaeger: http://YOUR_VM_IP:16686

---

## ✅ Deployment Complete Checklist

- [ ] VM created and accessible
- [ ] All prerequisites installed
- [ ] Application deployed
- [ ] All services running with PM2
- [ ] Database configured and migrated
- [ ] Can access frontend in browser
- [ ] User registration works
- [ ] Login works
- [ ] File upload works
- [ ] Reconciliation works
- [ ] Security hardened
- [ ] (Optional) Monitoring stack running
- [ ] (Optional) SSL configured
- [ ] (Optional) Domain configured

---

## 📝 Information to Save

**VM Details:**
```
Public IP: _______________________
SSH Key Location: _______________________
Username: ubuntu
```

**Application URLs:**
```
Frontend: http://YOUR_VM_IP:5173
Auth API: http://YOUR_VM_IP:3001
API Docs: http://YOUR_VM_IP:3001/api/docs
Grafana: http://YOUR_VM_IP:3000
```

**Database:**
```
Database: banking_reconciliation
Username: bankinguser
Password: (saved in ~/.banking_db_password)
```

**Credentials:**
```
Grafana: admin / admin
```

---

## 🆘 If Something Goes Wrong

### **Services won't start:**
```bash
pm2 logs
```

### **Can't access from browser:**
```bash
# Check firewall
sudo ufw status

# Check OCI Security List in console
```

### **Database errors:**
```bash
sudo systemctl status postgresql
psql -U bankinguser -d banking_reconciliation
```

### **Need help:**
- See: ORACLE_CLOUD_DEPLOYMENT.md (troubleshooting section)
- See: OCI_QUICK_START.md
- Check PM2 logs: `pm2 logs`
- Check system logs: `journalctl -xe`

---

**Estimated Total Time:** 30-45 minutes

**Cost:** $0.00 (using Always Free tier)

**Ready to start?** Begin with VM Creation Checklist above!
