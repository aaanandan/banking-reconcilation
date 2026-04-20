# 🏦 Banking Reconciliation SaaS Platform

A comprehensive multi-tenant SaaS platform for automated bank and ledger reconciliation, built with modern technologies and enterprise-grade features.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-15%2B-blue)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.7-blue)](https://www.typescriptlang.org/)

## ✨ Features

### Core Reconciliation Features
- **Intelligent Matching**: 16 advanced matching algorithms (MT-01 through MT-16)
- **Multi-Bank Support**: Handle multiple bank accounts simultaneously
- **Learning System**: ML-based pattern recognition and improvement over time
- **Date Range Filtering**: Flexible date-based reconciliation
- **Column Mapping**: Smart field mapping with auto-detection
- **Manual Matching**: User-guided matching for edge cases
- **Export & Reporting**: Comprehensive reconciliation reports

### Multi-Tenant SaaS Features
- **Complete Tenant Isolation**: Database-level data separation
- **Flexible Pricing**: 4 pricing tiers (Free, Starter, Professional, Enterprise)
- **Stripe Integration**: Automated billing and subscription management
- **Role-Based Access Control**: Admin, User, and Viewer roles
- **Resource Quotas**: Per-tenant limits on transactions, storage, users
- **White-Label Support**: Custom branding per tenant
- **API Access**: RESTful API with JWT authentication

### Enterprise Features
- **Comprehensive Monitoring**: Prometheus, Grafana, ELK stack, Jaeger
- **Advanced Security**: 2FA, OAuth (Google/Microsoft), API keys, audit logging
- **Email Notifications**: Transaction alerts, reconciliation reports
- **Webhook System**: Real-time event notifications
- **Admin Dashboard**: System-wide analytics and management
- **Feature Flags**: Gradual rollout and A/B testing
- **Onboarding System**: Guided setup for new tenants

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (optional, for monitoring)

### Installation (5 minutes)

```bash
# 1. Clone the repository
git clone <repository-url>
cd banking-reconcilation

# 2. Run the quick-start script
./quick-start.sh

# 3. Start the backend
cd banking-reconciliation-system
npm run start:dev

# 4. In a new terminal, start the frontend
cd banking-recon-frontend
npm run dev

# 5. Open your browser
# Frontend: http://localhost:5173
# API: http://localhost:3001
```

For detailed instructions, see **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**

## 📚 Documentation

### Getting Started
- [**Deployment Guide**](./DEPLOYMENT_GUIDE.md) - Complete setup instructions
- [**User Guide**](./docs/user-guides/end-user-guide.md) - How to use the platform
- [**API Documentation**](http://localhost:3001/api/docs) - Swagger/OpenAPI docs

### Architecture & Development
- [**Architecture Overview**](./docs/architecture/system-architecture.md)
- [**Microservices Guide**](./docs/architecture/microservices-architecture.md)
- [**Database Schema**](./docs/architecture/database-schema.md)
- [**Matching Algorithms**](./docs/architecture/matching-algorithms.md)

### Operations & Monitoring
- [**Monitoring Setup**](./docs/monitoring/monitoring-setup.md)
- [**Alert Configuration**](./docs/monitoring/alert-rules.md)
- [**Runbooks**](./docs/operations/runbooks.md)
- [**Production Deployment**](./docs/deployment/production-deployment.md)

### Security
- [**Security Guide**](./docs/security/security-overview.md)
- [**Authentication**](./docs/security/authentication.md)
- [**Multi-Tenancy**](./docs/security/multi-tenant-security.md)

### Complete Documentation Index
See [**docs/README.md**](./docs/README.md) for the complete documentation index.

## 🏗️ Architecture

### Technology Stack

**Backend:**
- NestJS (TypeScript)
- PostgreSQL + TypeORM
- JWT Authentication
- Prometheus + Grafana
- ELK Stack (Logging)
- Jaeger (Tracing)

**Frontend:**
- React 18 + TypeScript
- Vite
- Ant Design
- Redux Toolkit
- React Router

**Billing:**
- Stripe API
- Express.js

**Infrastructure:**
- Docker Compose
- Nginx (reverse proxy)

### Microservices Architecture

The platform consists of 23 microservices:

**Core Services:**
- `auth-service` (port 3001) - Authentication, user management
- `data-prep-service` (port 3003) - File upload and preprocessing
- `match-orchestrator` (port 3004) - Matching workflow coordination
- `state-manager-service` (port 3005) - Reconciliation state management
- `learning-service` (port 3006) - ML and pattern learning
- `question-manager-service` (port 3007) - User Q&A workflow

**Matching Services:**
- `mt-01-exact-match` (port 3010) - Exact amount and date
- `mt-02-near-exact` (port 3011) - Near-exact with tolerance
- `mt-03-grouping` (port 3012) - Amount grouping
- `mt-04-one-to-many` (port 3013) - One-to-many matching
- `mt-05-cross-period` (port 3014) - Cross-period matching
- `mt-06-partial` (port 3015) - Partial matching
- `mt-07-pattern` (port 3016) - Pattern-based matching
- `mt-08-sequential` (port 3017) - Sequential matching
- `mt-09-timing` (port 3018) - Timing difference handling
- `mt-10-fuzzy` through `mt-16-final-validation` (ports 3019-3025)

## 🎯 Pricing Tiers

| Feature | Free | Starter | Professional | Enterprise |
|---------|------|---------|--------------|------------|
| **Price** | $0/mo | $49/mo | $199/mo | Custom |
| **Transactions/month** | 100 | 1,000 | 10,000 | Unlimited |
| **Bank Accounts** | 1 | 3 | 10 | Unlimited |
| **Users** | 1 | 5 | 25 | Unlimited |
| **Storage** | 50 MB | 500 MB | 5 GB | Unlimited |
| **API Access** | ❌ | ✅ | ✅ | ✅ |
| **Advanced Matching** | ❌ | ✅ | ✅ | ✅ |
| **Priority Support** | ❌ | ❌ | ✅ | ✅ |
| **Custom Integrations** | ❌ | ❌ | ❌ | ✅ |
| **SLA** | - | - | 99.5% | 99.9% |

## 🧪 Testing

### Run Tests

```bash
# Backend tests
cd banking-reconciliation-system
npm test

# Frontend tests
cd banking-recon-frontend
npm test

# Billing service tests
cd services/billing-service
npm test

# E2E tests
npm run test:e2e
```

### Test Coverage

The platform includes **74+ comprehensive tests**:
- Tenant isolation tests (7 tests)
- JWT authentication tests (11 tests)
- Quota enforcement tests (16 tests)
- Performance tests (11 tests)
- Security audit tests (22 tests)
- Database index tests (7 tests)

## 📊 Monitoring & Observability

### Built-in Monitoring Stack

- **Prometheus** - Metrics collection
- **Grafana** - Dashboards and visualization
- **Alertmanager** - Alert routing and notifications
- **ELK Stack** - Centralized logging
- **Jaeger** - Distributed tracing
- **Sentry** - Error tracking

### Access Dashboards

```bash
# Start monitoring stack
docker-compose up -d

# Access dashboards
# Grafana: http://localhost:3000 (admin/admin)
# Prometheus: http://localhost:9090
# Kibana: http://localhost:5601
# Jaeger: http://localhost:16686
```

### Key Metrics Tracked

- Authentication success/failure rates
- Reconciliation processing times
- Match algorithm performance
- API response times
- Database query performance
- Resource utilization (CPU, memory, disk)
- Tenant-specific metrics
- Billing and subscription events

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Refresh token rotation
- 2FA (TOTP-based)
- OAuth 2.0 (Google, Microsoft)
- API key management
- Role-based access control (RBAC)

### Data Protection
- Database-level tenant isolation
- Encrypted passwords (bcrypt)
- Encrypted sensitive data
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting
- Brute force protection

### Compliance
- Audit logging (all user actions)
- GDPR compliance features
- Data export capabilities
- User consent management
- Session management
- Security headers (Helmet.js)

## 🚢 Production Deployment

### Deployment Options

1. **Docker Compose** (Recommended for small-medium deployments)
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Kubernetes** (Recommended for large deployments)
   ```bash
   kubectl apply -f k8s/
   ```

3. **Manual Deployment**
   See [Production Deployment Guide](./docs/deployment/production-deployment.md)

### Environment Variables

See [`.env.example`](./.env.example) for all configuration options.

Critical variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens (min 32 characters)
- `STRIPE_SECRET_KEY` - Stripe API key
- `SENTRY_DSN` - Sentry error tracking DSN
- `NODE_ENV` - Environment (development/production)

## 📈 Performance

### Scalability
- Horizontal scaling via microservices
- Database read replicas
- Redis caching (optional)
- Message queue support (optional)
- Load balancing ready

### Performance Benchmarks
- Authentication: < 100ms (p95)
- File upload: < 500ms for 10MB files
- Matching (1000 transactions): < 5 seconds
- API response time: < 200ms (p95)
- Database queries: < 50ms (p95)

## 🛠️ Development

### Project Structure

```
banking-reconcilation/
├── banking-reconciliation-system/  # Backend (NestJS)
│   ├── apps/                        # Microservices
│   ├── libs/shared/                 # Shared code
│   ├── migrations/                  # Database migrations
│   └── test/                        # Tests
├── banking-recon-frontend/          # Frontend (React)
│   ├── src/
│   │   ├── components/              # Reusable components
│   │   ├── pages/                   # Page components
│   │   ├── store/                   # Redux store
│   │   └── services/                # API services
│   └── public/                      # Static assets
├── services/billing-service/        # Billing service
├── monitoring/                      # Monitoring configs
├── docs/                            # Documentation
├── docker-compose.yml               # Docker setup
└── DEPLOYMENT_GUIDE.md              # Deployment instructions
```

### Development Workflow

1. Create feature branch
2. Make changes
3. Write tests
4. Run tests locally
5. Commit and push
6. Create pull request
7. Code review
8. Merge to main
9. Deploy to staging
10. Deploy to production

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Conventional commits
- Test coverage > 80%

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

### Getting Help

- **Documentation:** [docs/README.md](./docs/README.md)
- **API Docs:** http://localhost:3001/api/docs (when running locally)
- **Issues:** [GitHub Issues](https://github.com/yourcompany/banking-reconciliation/issues)
- **Email:** support@yourcompany.com
- **Slack:** [Join our Slack](https://slack.yourcompany.com)

### Troubleshooting

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#-step-9-troubleshooting) for common issues and solutions.

## 📜 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history.

## 🎯 Roadmap

### Q2 2026
- [ ] Mobile app (React Native)
- [ ] Advanced ML algorithms
- [ ] Multi-currency support
- [ ] Real-time collaboration

### Q3 2026
- [ ] Blockchain integration
- [ ] Advanced analytics dashboard
- [ ] Custom workflow builder
- [ ] Integration marketplace

### Q4 2026
- [ ] AI-powered reconciliation
- [ ] Predictive analytics
- [ ] Advanced reporting
- [ ] Enterprise SSO

## 🏆 Acknowledgments

Built with:
- [NestJS](https://nestjs.com/) - Backend framework
- [React](https://react.dev/) - Frontend library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Ant Design](https://ant.design/) - UI components
- [Stripe](https://stripe.com/) - Payment processing
- [Prometheus](https://prometheus.io/) - Monitoring
- [Grafana](https://grafana.com/) - Visualization

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

---

**Made with ❤️ by the Banking Reconciliation Team**

**Current Version:** 1.0.0  
**Last Updated:** April 16, 2026  
**Status:** Production Ready ✅
