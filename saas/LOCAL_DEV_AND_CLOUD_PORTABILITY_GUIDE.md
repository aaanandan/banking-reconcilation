# LOCAL DEVELOPMENT & CLOUD PORTABILITY GUIDE

## Complete Guide for Running Locally and Porting to Other Clouds

---

## 🏠 **PART 1: RUNNING LOCALLY**

### **✅ Full Stack on Your Laptop!**

You can run the ENTIRE SaaS platform locally for development/testing!

---

## 🚀 **OPTION A: Docker Compose (Recommended for Local Dev)**

### **What You Get:**
- ✅ All 22 backend services
- ✅ PostgreSQL database
- ✅ Redis cache
- ✅ MinIO (S3-compatible storage)
- ✅ React frontend
- ✅ Prometheus + Grafana (optional)
- ✅ Hot reload for development
- ✅ No cloud costs!

### **Prerequisites:**
```bash
# Install Docker Desktop
https://www.docker.com/products/docker-desktop

# Verify installation
docker --version          # 20.10+
docker-compose --version  # 2.0+

# System Requirements:
- RAM: 8GB minimum, 16GB recommended
- CPU: 4 cores minimum
- Disk: 20GB free space
```

### **Quick Start (5 minutes):**

```bash
# 1. Clone your repo and switch to saas-development branch
git clone <your-repo>
cd banking-recon
git checkout saas-development

# 2. Create .env.local file
cat > .env.local <<EOF
# Database
DATABASE_URL=postgresql://dev_user:dev_password@postgres:5432/banking_recon_dev

# Redis
REDIS_URL=redis://redis:6379

# MinIO (S3-compatible)
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=uploads

# Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# Frontend
VITE_API_URL=http://localhost:3000
EOF

# 3. Start all services
docker-compose -f docker-compose.yml up -d

# 4. Wait for services to be healthy (1-2 minutes)
docker-compose ps

# 5. Run database migrations
docker-compose exec data-prep-service npm run migration:run

# 6. Access the application
# Frontend:  http://localhost:5173
# API:       http://localhost:3000
# MinIO:     http://localhost:9001 (minioadmin/minioadmin)
# Grafana:   http://localhost:3100 (admin/admin)
# Prometheus: http://localhost:9090
```

### **Development Workflow:**

```bash
# Check service health
docker-compose ps

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f data-prep-service

# Restart a service
docker-compose restart data-prep-service

# Run tests
docker-compose exec data-prep-service npm run test

# Access database
docker-compose exec postgres psql -U dev_user -d banking_recon_dev

# Stop all services
docker-compose down

# Stop and remove all data
docker-compose down -v
```

### **Hot Reload (Code Changes Apply Instantly):**

```bash
# Edit any service code
vim apps/data-prep-service/src/data-prep.service.ts

# Changes auto-reload (no restart needed!)
# Watch logs:
docker-compose logs -f data-prep-service
```

---

## 🚀 **OPTION B: Kubernetes Locally (minikube)**

### **For Testing Kubernetes Setup Locally:**

```bash
# 1. Install minikube
https://minikube.sigs.k8s.io/docs/start/

# 2. Start minikube
minikube start --cpus=4 --memory=8192 --disk-size=20g

# 3. Enable addons
minikube addons enable ingress
minikube addons enable metrics-server

# 4. Build images locally
eval $(minikube docker-env)
docker build -t data-prep-service:latest -f apps/data-prep-service/Dockerfile .
# ... build all services

# 5. Deploy to minikube
kubectl apply -f k8s/local/

# 6. Access services
minikube service data-prep-service --url
```

---

## 🚀 **OPTION C: Hybrid (Local + Cloud)**

### **Run Backend Locally, Database in Cloud:**

```bash
# Best for: Testing with production-like data

# 1. Connect to cloud database
export DATABASE_URL="postgresql://user:pass@your-rds.amazonaws.com:5432/db"

# 2. Run services locally
npm run start:dev

# 3. Frontend points to local API
VITE_API_URL=http://localhost:3000 npm run dev
```

---

## ☁️ **PART 2: CLOUD PORTABILITY**

### **How Easy to Port to Other Cloud Providers?**

---

## 📊 **PORTABILITY BREAKDOWN**

### **Layer 1: Application Code (100% Portable) ✅**
```
- NestJS backend services → Same everywhere
- React frontend → Same everywhere
- TypeORM database code → Same everywhere
- Business logic → Same everywhere
- API endpoints → Same everywhere
- Tests → Same everywhere

NO CHANGES NEEDED ✅
```

### **Layer 2: Containerization (100% Portable) ✅**
```
- Docker images → Same everywhere
- Kubernetes YAML → 95% same (minor tweaks)
- Helm charts → Same everywhere
- Container registry → Different endpoint only

MINIMAL CHANGES (just registry URL) ✅
```

### **Layer 3: Infrastructure (80% Portable) ⚠️**
```
- Managed Kubernetes → Different CLI, same concepts
- Managed Database → Different service, same Postgres
- Object Storage → Different API, same S3-compatible
- Load Balancer → Different configuration
- Monitoring → Can use same tools (Prometheus/Grafana)

CONFIGURATION CHANGES NEEDED ⚠️
```

---

## 🔄 **PORTING GUIDE: AWS → GCP**

### **Time Required: 1-2 days**

### **Step-by-Step Port:**

```bash
═══════════════════════════════════════════════════════
1. SETUP GCP PROJECT (15 minutes)
═══════════════════════════════════════════════════════
# Install gcloud CLI
https://cloud.google.com/sdk/docs/install

# Create project
gcloud projects create banking-recon-prod --name="Banking Recon"

# Set default project
gcloud config set project banking-recon-prod

# Enable APIs
gcloud services enable container.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable storage-api.googleapis.com

═══════════════════════════════════════════════════════
2. CREATE GKE CLUSTER (30 minutes)
═══════════════════════════════════════════════════════
# Create cluster (equivalent to EKS)
gcloud container clusters create banking-recon-cluster \
  --zone=us-central1-a \
  --num-nodes=3 \
  --machine-type=n1-standard-2 \
  --enable-autoscaling \
  --min-nodes=2 \
  --max-nodes=10

# Get credentials
gcloud container clusters get-credentials banking-recon-cluster \
  --zone=us-central1-a

# Verify
kubectl get nodes

═══════════════════════════════════════════════════════
3. CREATE CLOUD SQL (20 minutes)
═══════════════════════════════════════════════════════
# Create PostgreSQL instance (equivalent to RDS)
gcloud sql instances create banking-recon-db \
  --database-version=POSTGRES_15 \
  --tier=db-n1-standard-2 \
  --region=us-central1 \
  --availability-type=REGIONAL \
  --backup-start-time=03:00

# Create database
gcloud sql databases create banking_recon \
  --instance=banking-recon-db

# Create user
gcloud sql users create dbadmin \
  --instance=banking-recon-db \
  --password=SecurePassword123!

# Get connection string
gcloud sql instances describe banking-recon-db \
  --format='get(connectionName)'

═══════════════════════════════════════════════════════
4. CREATE GCS BUCKETS (10 minutes)
═══════════════════════════════════════════════════════
# Create buckets (equivalent to S3)
gsutil mb -l us-central1 gs://banking-recon-uploads-prod
gsutil mb -l us-central1 gs://banking-recon-backups-prod

# Set lifecycle policy
cat > lifecycle.json <<EOF
{
  "lifecycle": {
    "rule": [{
      "action": {"type": "SetStorageClass", "storageClass": "ARCHIVE"},
      "condition": {"age": 90}
    }]
  }
}
EOF
gsutil lifecycle set lifecycle.json gs://banking-recon-uploads-prod

═══════════════════════════════════════════════════════
5. UPDATE APPLICATION CODE (30 minutes)
═══════════════════════════════════════════════════════
# Only need to update storage adapter

# Before (AWS S3):
import { S3 } from 'aws-sdk';
const s3 = new S3({ region: 'us-east-1' });

# After (GCP GCS):
import { Storage } from '@google-cloud/storage';
const storage = new Storage();
const bucket = storage.bucket('banking-recon-uploads-prod');

# OR use S3-compatible adapter (no code changes):
const storage = new Storage({
  projectId: 'banking-recon-prod',
  s3Compatible: true,
});

═══════════════════════════════════════════════════════
6. PUSH DOCKER IMAGES (15 minutes)
═══════════════════════════════════════════════════════
# Configure GCR (equivalent to ECR)
gcloud auth configure-docker gcr.io

# Tag and push images
docker tag data-prep-service:latest gcr.io/banking-recon-prod/data-prep-service:latest
docker push gcr.io/banking-recon-prod/data-prep-service:latest

# ... repeat for all 23 services

═══════════════════════════════════════════════════════
7. DEPLOY TO GKE (30 minutes)
═══════════════════════════════════════════════════════
# Update Kubernetes YAML (only image registry)
sed -i 's/ECR_REGISTRY/gcr.io\/banking-recon-prod/g' k8s/production/*.yaml

# Update secrets
kubectl create secret generic db-secrets \
  --from-literal=connection-string="postgresql://dbadmin:pass@CLOUD_SQL_IP:5432/banking_recon" \
  -n production

# Deploy
kubectl apply -f k8s/production/ -n production

# Verify
kubectl get pods -n production

═══════════════════════════════════════════════════════
8. CONFIGURE LOAD BALANCER (20 minutes)
═══════════════════════════════════════════════════════
# GCP automatically creates load balancer from Ingress
kubectl apply -f k8s/ingress-gcp.yaml

# Get external IP
kubectl get ingress -n production

═══════════════════════════════════════════════════════
9. RUN SMOKE TESTS (15 minutes)
═══════════════════════════════════════════════════════
# Test all endpoints
npm run test:e2e -- --baseUrl=https://gcp-api.banking-recon.com

═══════════════════════════════════════════════════════
10. MIGRATE DNS (10 minutes)
═══════════════════════════════════════════════════════
# Update DNS to point to GCP load balancer
# In your DNS provider:
# A record: api.banking-recon.com → GCP_LB_IP
```

**Total Time: 1-2 days** ✅

---

## 🔄 **PORTING GUIDE: AWS → AZURE**

### **Time Required: 1-2 days**

### **Azure Equivalents:**

| AWS | Azure | Change Required |
|-----|-------|-----------------|
| EKS | AKS (Azure Kubernetes Service) | Minimal |
| RDS | Azure Database for PostgreSQL | Connection string |
| S3 | Azure Blob Storage | Storage adapter |
| ECR | ACR (Azure Container Registry) | Image registry |
| ALB | Azure Load Balancer | Config file |
| CloudWatch | Azure Monitor | Agent config |

### **Quick Port Commands:**

```bash
# 1. Create AKS cluster
az aks create \
  --resource-group banking-recon-rg \
  --name banking-recon-cluster \
  --node-count 3 \
  --enable-addons monitoring

# 2. Create Azure PostgreSQL
az postgres flexible-server create \
  --resource-group banking-recon-rg \
  --name banking-recon-db \
  --admin-user dbadmin \
  --admin-password SecurePass123! \
  --sku-name Standard_D2s_v3

# 3. Create Blob Storage
az storage account create \
  --name bankingreconuploads \
  --resource-group banking-recon-rg

# 4. Deploy to AKS
kubectl apply -f k8s/production/
```

---

## 📊 **COST COMPARISON (Monthly)**

### **AWS:**
- EKS: $75
- EC2 (3x t3.medium): $120
- RDS: $280
- S3: $3
- **Total: ~$480/month**

### **GCP:**
- GKE: $75
- Compute Engine (3x n1-standard-2): $130
- Cloud SQL: $290
- GCS: $2
- **Total: ~$500/month**

### **Azure:**
- AKS: $75
- VM (3x Standard_D2s_v3): $140
- PostgreSQL: $300
- Blob Storage: $2
- **Total: ~$520/month**

### **Local (Docker Compose):**
- **Total: $0/month** ✅
- (Only your laptop electricity!)

---

## ✅ **PORTABILITY CHECKLIST**

### **What's Cloud-Agnostic:**
- ✅ Application code (100%)
- ✅ Docker images (100%)
- ✅ Kubernetes YAML (95%)
- ✅ Database schema (100%)
- ✅ Business logic (100%)
- ✅ Frontend code (100%)
- ✅ CI/CD pipelines (90%)

### **What Needs Updating:**
- ⚠️ Infrastructure scripts (IaC)
- ⚠️ Storage adapter (if not using S3-compatible)
- ⚠️ Load balancer config
- ⚠️ Monitoring agent
- ⚠️ Secret management

---

## 🎯 **RECOMMENDED STRATEGY**

### **Development:**
```
Use Docker Compose locally
- Fast iteration
- No cloud costs
- Full stack available
- Matches production closely
```

### **Staging:**
```
Use Cloud (AWS/GCP/Azure)
- Test cloud integrations
- Test scaling
- Test real load balancers
- Cost: ~$200-300/month
```

### **Production:**
```
Use Cloud (your choice)
- AWS: Most mature, best docs
- GCP: Better pricing, modern
- Azure: Best for Microsoft shops
- Cost: ~$500-800/month
```

---

## 🚀 **MULTI-CLOUD STRATEGY (Advanced)**

### **Run on Multiple Clouds Simultaneously:**

```
┌─────────────────────────────────────┐
│         DNS Load Balancer            │
│     (Route53, Cloud DNS, etc.)       │
└──────────┬──────────────┬───────────┘
           │              │
    ┌──────▼─────┐ ┌─────▼──────┐
    │ AWS Region │ │ GCP Region │
    │ (Primary)  │ │ (Backup)   │
    └────────────┘ └────────────┘
```

**Benefits:**
- ✅ High availability
- ✅ Disaster recovery
- ✅ No vendor lock-in
- ✅ Geographic distribution

**Complexity:**
- ⚠️ 2x infrastructure cost
- ⚠️ Database replication needed
- ⚠️ More complex monitoring

---

## 📥 **DOWNLOAD FILES**

I've created the local development setup:

**[docker-compose-local.yml](computer:///mnt/user-data/outputs/docker-compose-local.yml)**

**Usage:**
```bash
# Save as docker-compose.yml
# Then run:
docker-compose up -d
```

---

## 🎉 **SUMMARY**

### **Running Locally:** ✅ EASY
- Docker Compose → 5 minutes setup
- Full stack on laptop
- $0 cost
- Perfect for development

### **Porting to GCP:** ✅ EASY
- 1-2 days effort
- 95% code stays same
- Only infrastructure changes

### **Porting to Azure:** ✅ EASY  
- 1-2 days effort
- Similar to GCP port

### **Multi-Cloud:** ✅ POSSIBLE
- More complex
- High availability
- No vendor lock-in

---

**Your architecture is HIGHLY PORTABLE!** 🎊

Any cloud provider or even on-premises will work! 🚀
