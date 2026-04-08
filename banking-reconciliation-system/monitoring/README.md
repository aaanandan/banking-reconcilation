# Monitoring Setup - Step 221

## Overview

This directory contains monitoring configuration for the Banking Reconciliation SaaS Platform.

**Step 221 Status**: ✅ Configuration Complete (Awaiting Docker deployment)

## Components

### 1. Prometheus
- **Version**: v2.51.0
- **Purpose**: Metrics collection and time-series database
- **Port**: 9090
- **UI**: http://localhost:9090

### 2. Configuration Files

#### `/monitoring/prometheus/prometheus.yml`
Main Prometheus configuration file with:
- Global scrape interval: 15s
- Evaluation interval: 15s
- Service discovery for all microservices
- Labels for environment and cluster

#### `/docker-compose.yml`
Docker Compose file with:
- Prometheus service
- PostgreSQL database
- Networking configuration
- Volume mounts for persistence

## Services Configured for Monitoring

### SaaS Platform Services
1. **auth-service** (Port 3001)
   - Tenant management
   - Authentication & authorization
   - Subscription billing
   - Analytics

2. **match-orchestrator** (Port 3002)
   - Reconciliation workflow coordination

3. **data-prep-service** (Port 3003)
   - File upload and parsing
   - Data validation

### Matching Services (MT-01 to MT-16)
- Ports 3010-3025
- Various matching techniques
- Will be instrumented in Step 222

## Deployment Instructions

### Prerequisites
- Docker installed
- Docker Compose installed

### Start Prometheus

```bash
# Navigate to project root
cd banking-reconciliation-system

# Start Prometheus
docker compose up -d prometheus

# Check logs
docker compose logs -f prometheus

# Access Prometheus UI
open http://localhost:9090
```

### Verify Prometheus is Running

```bash
# Check container status
docker ps | grep prometheus

# Check health endpoint
curl http://localhost:9090/-/healthy

# View targets
open http://localhost:9090/targets
```

## Next Steps (Step 222)

In Step 222, we will:
1. Install `@nestjs/prometheus` and `prom-client` packages
2. Add Prometheus module to all NestJS services
3. Expose `/metrics` endpoint on each service
4. Add custom business metrics:
   - Reconciliation success rate
   - Processing time per tenant
   - Active user sessions
   - Subscription revenue metrics
   - API request rates

## Metrics to be Collected

### System Metrics
- CPU usage
- Memory usage
- Request duration
- HTTP status codes

### Business Metrics
- Active tenants
- Reconciliations processed
- Match rates by technique
- Billing events
- User activity

### Database Metrics (Step 222)
- Connection pool usage
- Query duration
- Transaction counts

## Prometheus Queries (Examples)

```promql
# Request rate per service
rate(http_requests_total[5m])

# 95th percentile response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Active tenants
count(tenant_active{status="active"})

# Reconciliation success rate
rate(reconciliation_success_total[5m]) / rate(reconciliation_total[5m])
```

## Configuration Details

### Scrape Targets

| Service | Target | Scrape Interval | Labels |
|---------|--------|----------------|--------|
| prometheus | localhost:9090 | 15s | service=prometheus |
| auth-service | host.docker.internal:3001 | 10s | tier=saas-platform |
| match-orchestrator | host.docker.internal:3002 | 15s | tier=core-business |
| data-prep-service | host.docker.internal:3003 | 15s | tier=data-processing |
| matching-services | host.docker.internal:3010-3025 | 30s | tier=matching-engines |

### Storage
- **Path**: `/prometheus` (inside container)
- **Volume**: `prometheus_data` (Docker volume)
- **Retention**: 15 days (default)

## Troubleshooting

### Prometheus not starting
```bash
# Check logs
docker compose logs prometheus

# Validate config
docker compose exec prometheus promtool check config /etc/prometheus/prometheus.yml
```

### Targets showing as "Down"
- Ensure services are running on specified ports
- Check firewall rules
- Verify service /metrics endpoints exist (Step 222)

### Configuration reload
```bash
# Reload config without restart
curl -X POST http://localhost:9090/-/reload
```

## Files Created

```
banking-reconciliation-system/
├── docker-compose.yml              # Main compose file with Prometheus
├── monitoring/
│   ├── README.md                   # This file
│   └── prometheus/
│       └── prometheus.yml          # Prometheus scraping config
```

## Step 221 Completion Checklist

- ✅ Created docker-compose.yml with Prometheus service
- ✅ Created prometheus.yml configuration
- ✅ Configured scraping targets for all services
- ✅ Set up proper networking (banking-network)
- ✅ Configured data persistence (prometheus_data volume)
- ✅ Set up health checks
- ✅ Added documentation
- ⏳ Awaiting Docker installation for deployment
- ⏳ Services metrics endpoints (Step 222)

## Related Steps

- **Step 221**: Deploy Prometheus ✅ (Configuration ready)
- **Step 222**: Configure scraping targets (Instrument services)
- **Step 223**: Deploy Grafana
- **Step 224**: Create dashboards
- **Step 225**: Setup alert rules
