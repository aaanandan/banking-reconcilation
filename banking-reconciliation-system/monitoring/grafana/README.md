# Grafana Setup - Banking Reconciliation Platform

**Step 223**: Grafana deployment for metrics visualization

## Overview

Grafana is deployed as part of the observability stack to visualize metrics collected by Prometheus.

**Stack Components**:
- **Prometheus** (Step 221): Metrics collection
- **Instrumented Services** (Step 222): Expose /metrics endpoints
- **Grafana** (Step 223): Visualization ← **Current**
- **Dashboards** (Step 224): Pre-built visualizations

## Deployment

### Docker Compose Service

```yaml
grafana:
  image: grafana/grafana:10.4.1
  container_name: banking-grafana
  ports:
    - "3000:3000"
  environment:
    - GF_SECURITY_ADMIN_USER=admin
    - GF_SECURITY_ADMIN_PASSWORD=admin
  volumes:
    - grafana_data:/var/lib/grafana
    - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards
```

### Starting Grafana

```bash
# Start Grafana (and dependencies)
docker compose up -d grafana

# Check logs
docker compose logs -f grafana

# Check health
curl http://localhost:3000/api/health
```

### Accessing Grafana

**URL**: http://localhost:3000

**Default Credentials**:
- Username: `admin`
- Password: `admin`

**First Login**: You will be prompted to change the password (optional in development)

## Configuration

### Datasources

Grafana is pre-configured with Prometheus as the default datasource.

**Configuration File**: `provisioning/datasources/prometheus.yml`

```yaml
datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
    isDefault: true
```

**Verification**:
1. Login to Grafana
2. Go to Configuration → Data Sources
3. Should see "Prometheus" (default)
4. Click to test connection

### Dashboard Provisioning

Dashboards are auto-loaded from the `dashboards/` directory.

**Configuration File**: `provisioning/dashboards/dashboard.yml`

**Location**: `/var/lib/grafana/dashboards` (inside container)

**Updates**: 
- Dashboard files are watched for changes
- Changes reflect within 10 seconds
- `allowUiUpdates: true` allows editing via UI

## Directory Structure

```
monitoring/grafana/
├── README.md                                  # This file
├── provisioning/
│   ├── datasources/
│   │   └── prometheus.yml                     # Prometheus datasource config
│   └── dashboards/
│       └── dashboard.yml                      # Dashboard provisioning config
└── dashboards/
    ├── README.md                              # Dashboard documentation
    └── (*.json files will be created in Step 224)
```

## Features Enabled

### Installed Plugins

Grafana comes with these additional plugins:

1. **grafana-clock-panel**: Display current time
2. **grafana-simple-json-datasource**: Generic JSON datasource
3. **grafana-piechart-panel**: Pie chart visualizations

**Install more plugins**:
```bash
# Edit docker-compose.yml and add to GF_INSTALL_PLUGINS
GF_INSTALL_PLUGINS=plugin1,plugin2,plugin3
```

### Settings

| Setting | Value | Description |
|---------|-------|-------------|
| Admin User | admin | Default admin username |
| Admin Password | admin | Default password (change in production) |
| Port | 3000 | Web UI port |
| Root URL | http://localhost:3000 | Base URL |
| Anonymous Access | Disabled | Requires login |
| Analytics | Disabled | No telemetry sent |
| Auto Updates | Disabled | Manual updates |

## Usage

### Exploring Metrics

1. **Explore Tab**:
   - Go to Explore (compass icon)
   - Select Prometheus datasource
   - Enter PromQL query
   - Examples:
     ```promql
     # Total login attempts
     auth_login_attempts_total
     
     # Login success rate
     rate(auth_login_success_total[5m]) / rate(auth_login_attempts_total[5m])
     
     # Active tenants
     tenants_active_total
     
     # HTTP request rate
     rate(http_request_duration_seconds_count[5m])
     ```

2. **Creating Custom Dashboards**:
   - Click "+" → Dashboard
   - Add Panel
   - Select Prometheus datasource
   - Enter query
   - Choose visualization type
   - Configure panel settings
   - Save dashboard

### Pre-built Dashboards (Step 224)

The following dashboards will be created in Step 224:
- System Overview
- Business Metrics
- Database Performance
- Authentication & Security
- Tenant Analytics

## Troubleshooting

### Grafana Won't Start

```bash
# Check logs
docker compose logs grafana

# Check if port 3000 is available
lsof -i :3000

# Restart service
docker compose restart grafana
```

### Can't Connect to Prometheus

1. **Check Prometheus is running**:
   ```bash
   docker compose ps prometheus
   ```

2. **Test Prometheus from Grafana container**:
   ```bash
   docker exec -it banking-grafana wget -O- http://prometheus:9090/api/v1/status/config
   ```

3. **Verify datasource configuration**:
   - Go to Configuration → Data Sources → Prometheus
   - Click "Save & Test"
   - Should show green checkmark

### Dashboards Not Loading

1. **Check provisioning directory is mounted**:
   ```bash
   docker exec -it banking-grafana ls -la /etc/grafana/provisioning/dashboards
   ```

2. **Check dashboard files**:
   ```bash
   docker exec -it banking-grafana ls -la /var/lib/grafana/dashboards
   ```

3. **Check Grafana logs for errors**:
   ```bash
   docker compose logs grafana | grep -i error
   ```

### Reset Grafana

```bash
# Stop Grafana
docker compose stop grafana

# Remove volume (WARNING: deletes all dashboards/settings)
docker volume rm banking-reconciliation-system_grafana_data

# Restart
docker compose up -d grafana
```

## Security Considerations

### Production Deployment

For production, update these settings:

1. **Change admin password**:
   ```yaml
   environment:
     - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
   ```

2. **Enable HTTPS**:
   ```yaml
   - GF_SERVER_PROTOCOL=https
   - GF_SERVER_CERT_FILE=/path/to/cert.pem
   - GF_SERVER_CERT_KEY=/path/to/key.pem
   ```

3. **Configure authentication**:
   - OAuth (Google, GitHub, etc.)
   - LDAP
   - SAML

4. **Restrict access**:
   - Use firewall rules
   - VPN access only
   - IP whitelisting

## Grafana Configuration File

For advanced configuration, create `grafana.ini`:

```ini
[server]
http_port = 3000
domain = localhost
root_url = http://localhost:3000

[security]
admin_user = admin
admin_password = admin

[analytics]
reporting_enabled = false
check_for_updates = false

[users]
allow_sign_up = false
allow_org_create = false

[auth.anonymous]
enabled = false
```

Mount in docker-compose.yml:
```yaml
volumes:
  - ./monitoring/grafana/grafana.ini:/etc/grafana/grafana.ini
```

## Health Check

Grafana includes a health check endpoint:

```bash
# Check health
curl http://localhost:3000/api/health

# Expected response:
{
  "database": "ok",
  "version": "10.4.1"
}
```

## Next Steps

1. **Access Grafana**: http://localhost:3000
2. **Login**: admin/admin
3. **Verify Prometheus datasource**: Configuration → Data Sources
4. **Explore metrics**: Explore tab
5. **Step 224**: Create 5 pre-built dashboards

## Resources

- [Grafana Official Docs](https://grafana.com/docs/grafana/latest/)
- [Grafana Docker Image](https://hub.docker.com/r/grafana/grafana)
- [Dashboard Examples](https://grafana.com/grafana/dashboards/)
- [PromQL Basics](https://prometheus.io/docs/prometheus/latest/querying/basics/)
