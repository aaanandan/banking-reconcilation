# 🚀 Deployment Options Comparison

Complete guide to all deployment methods for the Banking Reconciliation SaaS Platform.

## 📊 Deployment Methods Overview

| Method | Best For | Complexity | Resource Usage | Hot Reload |
|--------|----------|------------|----------------|------------|
| **Direct (npm)** | Local development | ⭐ Easy | Low | ✅ Yes |
| **Docker Compose** | Local testing, staging | ⭐⭐ Medium | Medium | ❌ No |
| **Kubernetes** | Production, cloud | ⭐⭐⭐ Advanced | High | ❌ No |

---

## 1️⃣ Direct Deployment (npm) - CURRENT DEFAULT

### ✅ Best For:
- Local development
- Debugging
- Quick iterations

### 📋 How It Works:

**Backend services run directly via npm:**
```bash
cd banking-reconciliation-system
npm install
npm run start:dev  # Starts all 23 microservices with hot reload
```

**Frontend runs directly via Vite:**
```bash
cd banking-recon-frontend
npm install
npm run dev  # Starts at http://localhost:5173
```

**Monitoring stack runs in Docker:**
```bash
docker-compose up -d  # Only monitoring services
```

### ⚡ Advantages:
- ✅ Fast startup (no container building)
- ✅ Hot reload on code changes
- ✅ Easy debugging (attach debugger directly)
- ✅ Low resource usage
- ✅ See console logs directly

### ⚠️ Disadvantages:
- ❌ Not production-like
- ❌ Manual dependency management
- ❌ Requires Node.js/PostgreSQL installed locally

### 📁 What You Need:
```bash
✓ Node.js 18+
✓ PostgreSQL 15+
✓ npm
✓ Docker (for monitoring only)
```

### 🚀 Quick Start:
```bash
./quick-start.sh
```

---

## 2️⃣ Docker Compose Deployment - NEW

### ✅ Best For:
- Integration testing
- Staging environment
- Team environments
- Production (small deployments)

### 📋 How It Works:

**Everything runs in containers:**
- 23 backend microservices
- Frontend (Nginx)
- PostgreSQL
- Billing service
- Monitoring stack (9 services)

**Total: 30+ containers**

### 🚀 Quick Start:

#### Option A: Monitoring Only (Current)
```bash
docker-compose up -d
```
**Starts:** PostgreSQL + Prometheus + Grafana + Alertmanager + Jaeger + ELK Stack

#### Option B: Full Stack (All Services)
```bash
# Build images first
docker-compose -f docker-compose.full.yml build

# Start everything
docker-compose -f docker-compose.full.yml up -d

# Check status
docker-compose -f docker-compose.full.yml ps

# View logs
docker-compose -f docker-compose.full.yml logs -f auth-service

# Stop everything
docker-compose -f docker-compose.full.yml down
```

### ⚡ Advantages:
- ✅ Production-like environment
- ✅ Easy to share (docker-compose.yml)
- ✅ All services isolated
- ✅ Simple networking
- ✅ Volume persistence
- ✅ One command to start/stop

### ⚠️ Disadvantages:
- ❌ No hot reload (must rebuild)
- ❌ Slower startup
- ❌ Higher resource usage (8GB+ RAM)
- ❌ Build time (5-10 minutes first time)

### 📁 What You Need:
```bash
✓ Docker 20+
✓ Docker Compose 2.0+
✓ 8GB+ RAM
✓ 20GB+ disk space
```

### 🔧 Configuration:

**Environment Variables (.env):**
```env
POSTGRES_DB=banking_reconciliation
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

JWT_SECRET=your-secret-key-min-32-chars

STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

NODE_ENV=production
```

### 📊 Resource Requirements:
```
CPU: 4+ cores recommended
RAM: 8GB minimum, 16GB recommended
Disk: 20GB for images + data
```

### 🐛 Troubleshooting:

**Services won't start:**
```bash
# Check logs
docker-compose -f docker-compose.full.yml logs <service-name>

# Check disk space
df -h

# Check memory
docker stats

# Rebuild specific service
docker-compose -f docker-compose.full.yml build auth-service
docker-compose -f docker-compose.full.yml up -d auth-service
```

**Port conflicts:**
```bash
# Check what's using port 3001
lsof -i :3001

# Change port in docker-compose.full.yml
ports:
  - "3011:3001"  # Map to different host port
```

---

## 3️⃣ Kubernetes Deployment - NEW

### ✅ Best For:
- Production (cloud)
- High availability
- Auto-scaling
- Multi-environment

### 📋 How It Works:

**Deploys to Kubernetes cluster:**
- Local (Minikube, kind, Docker Desktop)
- Cloud (EKS, GKE, AKS)

**Features:**
- Auto-scaling
- Self-healing
- Load balancing
- Rolling updates
- Resource limits

### 🚀 Quick Start:

#### Local Kubernetes (Minikube)

```bash
# 1. Start Minikube
minikube start --cpus=4 --memory=8192

# 2. Use Minikube's Docker
eval $(minikube docker-env)

# 3. Build images
cd banking-reconciliation-system
docker build --build-arg SERVICE_NAME=auth-service -t banking-auth-service:latest .

cd ../banking-recon-frontend
docker build -t banking-frontend:latest .

# 4. Deploy to Kubernetes
kubectl apply -f k8s/base/namespace.yaml
kubectl apply -f k8s/base/postgres.yaml
kubectl apply -f k8s/base/auth-service.yaml
kubectl apply -f k8s/base/frontend.yaml

# 5. Wait for pods
kubectl wait --for=condition=ready pod -l app=auth-service -n banking-reconciliation --timeout=120s

# 6. Access services
minikube service frontend -n banking-reconciliation
minikube service auth-service-lb -n banking-reconciliation
```

#### Port Forward (Alternative)

```bash
# Forward frontend
kubectl port-forward svc/frontend 8080:80 -n banking-reconciliation

# Forward auth service
kubectl port-forward svc/auth-service 3001:3001 -n banking-reconciliation

# Access at:
# Frontend: http://localhost:8080
# Auth API: http://localhost:3001
```

### ⚡ Advantages:
- ✅ Production-grade orchestration
- ✅ Auto-scaling (HPA)
- ✅ Self-healing (restarts failed pods)
- ✅ Rolling updates (zero downtime)
- ✅ Resource management
- ✅ Service discovery
- ✅ Load balancing
- ✅ Secrets management

### ⚠️ Disadvantages:
- ❌ Complex setup
- ❌ Steep learning curve
- ❌ Higher resource usage
- ❌ Longer deployment time
- ❌ Requires Kubernetes knowledge

### 📁 What You Need:

**Local:**
```bash
✓ Minikube / kind / Docker Desktop Kubernetes
✓ kubectl CLI
✓ Docker
✓ 8GB+ RAM
```

**Cloud:**
```bash
✓ AWS EKS / Google GKE / Azure AKS
✓ kubectl CLI
✓ Cloud provider CLI (aws/gcloud/az)
✓ Container registry (ECR/GCR/ACR)
```

### 🔧 Kubernetes Commands:

```bash
# View all pods
kubectl get pods -n banking-reconciliation

# View services
kubectl get svc -n banking-reconciliation

# View logs
kubectl logs -f deployment/auth-service -n banking-reconciliation

# Exec into pod
kubectl exec -it deployment/auth-service -n banking-reconciliation -- sh

# Scale deployment
kubectl scale deployment auth-service --replicas=3 -n banking-reconciliation

# Delete everything
kubectl delete namespace banking-reconciliation
```

### 📊 Resource Limits (per service):

**auth-service:**
```yaml
resources:
  requests:
    cpu: 100m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

**Total cluster requirements:**
- **Minimum:** 4 CPU cores, 8GB RAM
- **Recommended:** 8 CPU cores, 16GB RAM
- **Production:** 16+ CPU cores, 32GB+ RAM

---

## 🔄 Deployment Comparison Matrix

| Feature | Direct (npm) | Docker Compose | Kubernetes |
|---------|-------------|----------------|------------|
| **Setup Time** | 5 minutes | 15 minutes | 30+ minutes |
| **First Start** | Fast (30s) | Medium (5m) | Slow (10m) |
| **Hot Reload** | ✅ Yes | ❌ No | ❌ No |
| **Production Ready** | ❌ No | ✅ Yes | ✅✅ Yes |
| **Auto-scaling** | ❌ No | ❌ No | ✅ Yes |
| **Self-healing** | ❌ No | ⚠️ Restart only | ✅ Yes |
| **Load Balancing** | ❌ No | ⚠️ Manual | ✅ Yes |
| **Rolling Updates** | ❌ No | ❌ No | ✅ Yes |
| **Secrets Management** | .env file | .env file | ✅ K8s Secrets |
| **Monitoring** | Manual | ✅ Built-in | ✅ Built-in |
| **Resource Limits** | ❌ No | ✅ Yes | ✅ Yes |
| **Multi-node** | ❌ No | ❌ No | ✅ Yes |
| **Cloud Native** | ❌ No | ⚠️ Partial | ✅ Yes |

---

## 🎯 Recommendations

### For Local Development:
```bash
✅ Use: Direct (npm) deployment
Why: Fast, easy debugging, hot reload
Command: ./quick-start.sh
```

### For Integration Testing:
```bash
✅ Use: Docker Compose
Why: Production-like, isolated, consistent
Command: docker-compose -f docker-compose.full.yml up -d
```

### For Staging:
```bash
✅ Use: Docker Compose or Kubernetes
Why: Match production, test deployments
```

### For Production:
```bash
✅ Use: Kubernetes (cloud)
Why: Auto-scaling, high availability, production-grade
Platform: AWS EKS / Google GKE / Azure AKS
```

---

## 📚 Files Created

```
New Deployment Files:
├── docker-compose.full.yml                    # Full Docker Compose
├── banking-reconciliation-system/
│   └── Dockerfile                             # Backend services
├── banking-recon-frontend/
│   ├── Dockerfile                             # Frontend
│   └── nginx.conf                             # Nginx config
└── k8s/                                       # Kubernetes
    ├── README.md                              # K8s guide
    └── base/
        ├── namespace.yaml
        ├── postgres.yaml
        ├── auth-service.yaml
        └── frontend.yaml
```

---

## 🚀 Quick Commands Reference

### Direct Deployment:
```bash
./quick-start.sh                               # Automated setup
cd banking-reconciliation-system && npm run start:dev
cd banking-recon-frontend && npm run dev
```

### Docker Compose:
```bash
docker-compose up -d                           # Monitoring only
docker-compose -f docker-compose.full.yml up -d  # Full stack
docker-compose -f docker-compose.full.yml down   # Stop
docker-compose -f docker-compose.full.yml logs -f # View logs
```

### Kubernetes:
```bash
minikube start --cpus=4 --memory=8192          # Start cluster
kubectl apply -f k8s/base/                     # Deploy
kubectl get pods -n banking-reconciliation     # Check status
kubectl port-forward svc/frontend 8080:80 -n banking-reconciliation
```

---

**Choose the deployment method that fits your use case! 🎉**
