# Kubernetes Deployment Guide

Deploy the Banking Reconciliation Platform to Kubernetes (local or production).

## Prerequisites

- **Kubernetes cluster** (minikube, kind, Docker Desktop, or cloud provider)
- **kubectl** CLI tool
- **Docker** (for building images)

## Quick Start (Local Kubernetes)

### 1. Start Local Kubernetes

**Option A: Docker Desktop**
```bash
# Enable Kubernetes in Docker Desktop settings
# Settings → Kubernetes → Enable Kubernetes
```

**Option B: Minikube**
```bash
minikube start --cpus=4 --memory=8192
```

**Option C: kind**
```bash
kind create cluster --name banking-reconciliation
```

### 2. Build Docker Images

```bash
# Backend services
cd banking-reconciliation-system
docker build --build-arg SERVICE_NAME=auth-service -t banking-auth-service:latest .
docker build --build-arg SERVICE_NAME=data-prep-service -t banking-data-prep-service:latest .
docker build --build-arg SERVICE_NAME=match-orchestrator -t banking-match-orchestrator:latest .

# Frontend
cd ../banking-recon-frontend
docker build -t banking-frontend:latest .
```

**For Minikube** (use minikube's Docker daemon):
```bash
eval $(minikube docker-env)
# Then build images as above
```

### 3. Deploy to Kubernetes

```bash
# Create namespace
kubectl apply -f k8s/base/namespace.yaml

# Deploy database
kubectl apply -f k8s/base/postgres.yaml

# Wait for database to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n banking-reconciliation --timeout=120s

# Deploy backend services
kubectl apply -f k8s/base/auth-service.yaml

# Deploy frontend
kubectl apply -f k8s/base/frontend.yaml

# Deploy monitoring (optional)
kubectl apply -f k8s/base/monitoring/
```

### 4. Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n banking-reconciliation

# Check services
kubectl get svc -n banking-reconciliation

# View logs
kubectl logs -f deployment/auth-service -n banking-reconciliation
```

### 5. Access the Application

**Port Forward Method:**
```bash
# Frontend
kubectl port-forward svc/frontend 8080:80 -n banking-reconciliation

# Auth Service
kubectl port-forward svc/auth-service 3001:3001 -n banking-reconciliation
```

**LoadBalancer Method (Minikube):**
```bash
minikube service frontend -n banking-reconciliation
minikube service auth-service-lb -n banking-reconciliation
```

**Access URLs:**
- Frontend: http://localhost:8080 (port-forward) or http://192.168.49.2:30080 (minikube)
- Auth API: http://localhost:3001 (port-forward) or http://192.168.49.2:30001 (minikube)

## Deployment Structure

```
k8s/
├── base/                          # Base Kubernetes manifests
│   ├── namespace.yaml             # Namespace definition
│   ├── postgres.yaml              # PostgreSQL deployment
│   ├── auth-service.yaml          # Auth service
│   ├── data-prep-service.yaml     # Data prep service
│   ├── match-orchestrator.yaml    # Orchestrator
│   ├── frontend.yaml              # React frontend
│   └── monitoring/                # Monitoring stack
│       ├── prometheus.yaml
│       ├── grafana.yaml
│       └── jaeger.yaml
├── overlays/
│   ├── local/                     # Local development overrides
│   └── production/                # Production configs
└── README.md                      # This file
```

## Scaling

```bash
# Scale auth service to 3 replicas
kubectl scale deployment auth-service --replicas=3 -n banking-reconciliation

# Autoscale based on CPU
kubectl autoscale deployment auth-service \
  --min=2 --max=10 --cpu-percent=80 \
  -n banking-reconciliation
```

## Monitoring

```bash
# Deploy Prometheus
kubectl apply -f k8s/base/monitoring/prometheus.yaml

# Access Prometheus
kubectl port-forward svc/prometheus 9090:9090 -n banking-reconciliation

# Deploy Grafana
kubectl apply -f k8s/base/monitoring/grafana.yaml

# Access Grafana
kubectl port-forward svc/grafana 3000:3000 -n banking-reconciliation
```

## Troubleshooting

### Pods not starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n banking-reconciliation

# View logs
kubectl logs <pod-name> -n banking-reconciliation

# Check events
kubectl get events -n banking-reconciliation --sort-by='.lastTimestamp'
```

### Image pull errors

```bash
# For Minikube, ensure using minikube's Docker
eval $(minikube docker-env)

# Rebuild images
docker build -t banking-auth-service:latest .

# Verify image exists
docker images | grep banking
```

### Database connection issues

```bash
# Check if PostgreSQL is running
kubectl get pods -l app=postgres -n banking-reconciliation

# Test connection
kubectl exec -it deployment/postgres -n banking-reconciliation -- psql -U postgres -d banking_reconciliation
```

## Cleanup

```bash
# Delete all resources
kubectl delete namespace banking-reconciliation

# Or delete individual components
kubectl delete -f k8s/base/
```

## Production Deployment

For production deployment to cloud providers:

1. **Use production overlays:**
   ```bash
   kubectl apply -k k8s/overlays/production
   ```

2. **Use external database** (AWS RDS, Google Cloud SQL, etc.)

3. **Set up Ingress controller:**
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
   ```

4. **Configure SSL/TLS certificates** (cert-manager)

5. **Set up persistent volumes** (AWS EBS, GCE PD, etc.)

6. **Enable monitoring** (Prometheus Operator, Grafana)

See `k8s/overlays/production/README.md` for detailed production setup.

## Resources

- **Kubernetes Documentation:** https://kubernetes.io/docs/
- **kubectl Cheat Sheet:** https://kubernetes.io/docs/reference/kubectl/cheatsheet/
- **Minikube:** https://minikube.sigs.k8s.io/
- **kind:** https://kind.sigs.k8s.io/
