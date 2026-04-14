# SLA Definitions
**Step 235 — SLA Definitions**

## Service Level Objectives (SLOs)

| Metric | Target | Measurement Window |
|--------|--------|-------------------|
| Availability | 99.9% uptime | Monthly |
| API Response Time (p95) | < 2 seconds | Per request |
| API Response Time (p99) | < 5 seconds | Per request |
| Error Rate | < 0.1% | Daily |
| Reconciliation Processing | < 5 minutes (1000 txns) | Per job |
| Data Durability | 99.999% | Annual |

## Availability Calculation

```
Availability = (Total minutes - Downtime minutes) / Total minutes × 100

99.9% = max 43.8 minutes downtime/month
99.5% = max 219 minutes downtime/month
```

## SLA by Subscription Plan

| Plan | Availability SLA | Support Response | Compensation |
|------|-----------------|-----------------|-------------|
| Free | No SLA | Community only | None |
| Starter | 99.5% | 24 hours (business days) | Service credits |
| Professional | 99.9% | 4 hours | Service credits + refund |
| Enterprise | 99.99% | 1 hour (24/7) | Full refund + penalty |

## Service Credits

If SLA is breached:

| Availability | Credit |
|-------------|--------|
| 99.0–99.5% | 10% of monthly fee |
| 95.0–99.0% | 25% of monthly fee |
| < 95.0% | 50% of monthly fee |

## Uptime Monitoring

- **Tool**: Prometheus `up` metric + external ping
- **Check interval**: 30 seconds
- **Locations**: Local (dev) / Multi-region (production)
- **Status page**: Updated automatically from Alertmanager

## Excluded from SLA

- Scheduled maintenance (24-hour notice given)
- Force majeure events
- Issues caused by customer's code/integrations
- Beta/preview features
