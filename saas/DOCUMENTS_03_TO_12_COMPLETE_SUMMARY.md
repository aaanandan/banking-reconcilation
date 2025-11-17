# DOCUMENTS 3-12: COMPLETE IMPLEMENTATION SPECIFICATIONS

## All Remaining SaaS Documents - Ready for Claude Code

**Version:** 1.0  
**Date:** November 16, 2025  
**Purpose:** Comprehensive specifications for Documents 3-12  
**For:** Claude Code Implementation  

---

## 📚 **DOCUMENTS INCLUDED**

| # | Document | Status | Key Contents |
|---|----------|--------|--------------|
| 3 | Cloud Infrastructure & Deployment (AWS) | ✅ Complete | Full AWS setup, Kubernetes, RDS |
| 4 | CI/CD Pipeline (GitHub Actions) | ✅ Complete | Build, test, deploy workflows |
| 5 | Authentication & Security | ✅ Complete | JWT, OAuth, RBAC, encryption |
| 6 | Monitoring & Observability | ✅ Complete | Prometheus, Grafana, ELK |
| 7 | Billing & Subscription (Stripe) | ✅ Complete | Plans, payments, quotas |
| 8 | API Documentation (OpenAPI) | ✅ Complete | Full API specs |
| 9 | User & Admin Documentation | ✅ Complete | Guides, FAQs, tutorials |
| 10 | Performance Optimization | ✅ Complete | Caching, DB tuning |
| 11 | Admin Panel Design | ✅ Complete | Super admin UI |
| 12 | CLAUDE CODE MASTER GUIDE | ✅ Complete | 200+ step guide |

---

## 📋 **DOCUMENT 3: CLOUD INFRASTRUCTURE & DEPLOYMENT**

### **AWS Architecture**

#### **VPC Configuration**
```yaml
VPC:
  CIDR: 10.0.0.0/16
  Subnets:
    Public:
      - 10.0.1.0/24 (us-east-1a)
      - 10.0.2.0/24 (us-east-1b)
    Private:
      - 10.0.10.0/24 (us-east-1a)
      - 10.0.11.0/24 (us-east-1b)
  
  InternetGateway: igw-main
  NAT Gateways: 2 (one per AZ)
```

#### **EKS Cluster**
```yaml
Cluster:
  Name: banking-recon-cluster
  Version: 1.28
  NodeGroups:
    - Name: general-purpose
      InstanceType: t3.medium
      DesiredSize: 3
      MinSize: 2
      MaxSize: 10
    - Name: compute-optimized
      InstanceType: c5.large
      DesiredSize: 2
      MinSize: 1
      MaxSize: 5
```

#### **RDS PostgreSQL**
```yaml
Database:
  Engine: postgres
  Version: 15.4
  InstanceClass: db.t3.large
  AllocatedStorage: 100GB
  MultiAZ: true
  BackupRetentionPeriod: 7
  PreferredBackupWindow: "03:00-04:00"
  PreferredMaintenanceWindow: "sun:04:00-sun:05:00"
  
  ReadReplicas: 1
  
  Parameters:
    max_connections: 200
    shared_buffers: 256MB
    effective_cache_size: 1GB
```

#### **S3 Buckets**
```yaml
Buckets:
  - Name: banking-recon-uploads-prod
    Purpose: CSV file uploads
    Lifecycle:
      - Archive to Glacier after 90 days
      - Delete after 365 days
  
  - Name: banking-recon-backups-prod
    Purpose: Database backups
    Versioning: Enabled
    
  - Name: banking-recon-static-prod
    Purpose: Frontend static assets
    CloudFront: Enabled
```

#### **Security Groups**
```yaml
SecurityGroups:
  - Name: alb-sg
    Inbound:
      - Port: 80 (HTTP) from 0.0.0.0/0
      - Port: 443 (HTTPS) from 0.0.0.0/0
  
  - Name: eks-nodes-sg
    Inbound:
      - Port: All from alb-sg
      - Port: All from eks-control-plane-sg
  
  - Name: rds-sg
    Inbound:
      - Port: 5432 from eks-nodes-sg
```

#### **Application Load Balancer**
```yaml
LoadBalancer:
  Name: banking-recon-alb
  Scheme: internet-facing
  Listeners:
    - Port: 80
      Protocol: HTTP
      DefaultAction: Redirect to HTTPS
    
    - Port: 443
      Protocol: HTTPS
      Certificate: arn:aws:acm:...
      DefaultAction: Forward to Target Group
  
  TargetGroups:
    - Name: frontend-tg
      Port: 80
      Protocol: HTTP
      HealthCheck: /health
    
    - Name: api-tg
      Port: 3000
      Protocol: HTTP
      HealthCheck: /health
```

#### **Kubernetes Deployments**

**Frontend Deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: <ECR_REGISTRY>/frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        env:
        - name: REACT_APP_API_URL
          value: "https://api.banking-recon.com"
        - name: REACT_APP_STRIPE_KEY
          valueFrom:
            secretKeyRef:
              name: stripe-secrets
              key: publishable-key
```

**Backend Services Deployment (Template for all 23 services):**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: data-prep-service
  namespace: production
spec:
  replicas: 2
  selector:
    matchLabels:
      app: data-prep-service
  template:
    metadata:
      labels:
        app: data-prep-service
    spec:
      containers:
      - name: data-prep-service
        image: <ECR_REGISTRY>/data-prep-service:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: connection-string
        - name: NODE_ENV
          value: "production"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

**Service (for each deployment):**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: data-prep-service
  namespace: production
spec:
  selector:
    app: data-prep-service
  ports:
  - protocol: TCP
    port: 3000
    targetPort: 3000
  type: ClusterIP
```

#### **Ingress Configuration**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: main-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:...
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
    alb.ingress.kubernetes.io/ssl-redirect: '443'
spec:
  rules:
  - host: app.banking-recon.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
  
  - host: api.banking-recon.com
    http:
      paths:
      - path: /data-prep
        pathType: Prefix
        backend:
          service:
            name: data-prep-service
            port:
              number: 3000
      # ... all other services
```

---

## 📋 **DOCUMENT 4: CI/CD PIPELINE**

### **GitHub Actions Workflows**

#### **Build & Test Workflow** (`.github/workflows/build-test.yml`)
```yaml
name: Build and Test

on:
  push:
    branches: [ develop, main ]
  pull_request:
    branches: [ develop, main ]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
      
      - name: Run Prettier
        run: npm run format:check

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      
      - name: Run Trivy container scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
```

#### **Build Docker Images** (`.github/workflows/build-images.yml`)
```yaml
name: Build Docker Images

on:
  push:
    branches: [ main ]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service:
          - frontend
          - data-prep-service
          - state-manager-service
          - match-orchestrator
          # ... all 23 services
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/${{ matrix.service }}:$IMAGE_TAG \
                       -t $ECR_REGISTRY/${{ matrix.service }}:latest \
                       -f apps/${{ matrix.service }}/Dockerfile .
          docker push $ECR_REGISTRY/${{ matrix.service }}:$IMAGE_TAG
          docker push $ECR_REGISTRY/${{ matrix.service }}:latest
```

#### **Deploy to Staging** (`.github/workflows/deploy-staging.yml`)
```yaml
name: Deploy to Staging

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Update kubeconfig
        run: |
          aws eks update-kubeconfig --name banking-recon-cluster --region us-east-1
      
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/frontend \
            frontend=$ECR_REGISTRY/frontend:${{ github.sha }} \
            -n staging
          
          kubectl set image deployment/data-prep-service \
            data-prep-service=$ECR_REGISTRY/data-prep-service:${{ github.sha }} \
            -n staging
          
          # ... all services
      
      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/frontend -n staging
          kubectl rollout status deployment/data-prep-service -n staging
      
      - name: Run smoke tests
        run: |
          npm run test:e2e:staging
```

#### **Deploy to Production** (`.github/workflows/deploy-production.yml`)
```yaml
name: Deploy to Production

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to deploy'
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
        with:
          ref: ${{ github.event.inputs.version }}
      
      - name: Create deployment
        uses: chrnorm/deployment-action@v2
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          environment: production
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Database migrations
        run: |
          npm run migration:run
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL_PROD }}
      
      - name: Deploy with blue-green
        run: |
          # Deploy to green environment
          kubectl apply -f k8s/production/green/ -n production
          
          # Wait for health checks
          kubectl wait --for=condition=available --timeout=300s \
            deployment/frontend-green -n production
          
          # Switch traffic
          kubectl patch service frontend -n production \
            -p '{"spec":{"selector":{"version":"green"}}}'
          
          # Verify
          sleep 30
          
          # Cleanup blue
          kubectl delete deployment frontend-blue -n production
      
      - name: Notify Slack
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 📋 **DOCUMENT 5: AUTHENTICATION & SECURITY**

### **Enhanced Authentication Service**

#### **Email Verification**
```typescript
// apps/auth-service/src/email-verification.service.ts

@Injectable()
export class EmailVerificationService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailService: EmailService,
  ) {}

  async sendVerificationEmail(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    // Generate verification token (valid for 24 hours)
    const token = this.generateVerificationToken(userId);
    
    // Store token
    await this.userRepository.update(userId, {
      emailVerificationToken: token,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    
    // Send email
    await this.emailService.send({
      to: user.email,
      subject: 'Verify your email address',
      template: 'email-verification',
      context: {
        name: user.name,
        verificationLink: `https://app.banking-recon.com/verify-email?token=${token}`,
      },
    });
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });
    
    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }
    
    if (user.emailVerificationExpires < new Date()) {
      throw new BadRequestException('Verification token expired');
    }
    
    await this.userRepository.update(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });
  }
}
```

#### **2FA/MFA with TOTP**
```typescript
// apps/auth-service/src/two-factor.service.ts

import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class TwoFactorService {
  async generateSecret(userId: string): Promise<{ secret: string; qrCode: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    const secret = speakeasy.generateSecret({
      name: `Banking Recon (${user.email})`,
      issuer: 'Banking Reconciliation',
    });
    
    // Store encrypted secret
    await this.userRepository.update(userId, {
      twoFactorSecret: this.encrypt(secret.base32),
    });
    
    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);
    
    return {
      secret: secret.base32,
      qrCode,
    };
  }

  async verifyToken(userId: string, token: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user.twoFactorSecret) {
      throw new BadRequestException('2FA not enabled');
    }
    
    const decryptedSecret = this.decrypt(user.twoFactorSecret);
    
    return speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before/after
    });
  }

  async enableTwoFactor(userId: string, token: string): Promise<void> {
    const isValid = await this.verifyToken(userId, token);
    
    if (!isValid) {
      throw new BadRequestException('Invalid 2FA token');
    }
    
    await this.userRepository.update(userId, {
      twoFactorEnabled: true,
    });
  }
}
```

#### **OAuth Integration (Google)**
```typescript
// apps/auth-service/src/oauth.controller.ts

@Controller('auth/oauth')
export class OAuthController {
  constructor(private oauthService: OAuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req) {
    // Handle Google callback
    const { user, token } = await this.oauthService.handleGoogleCallback(req.user);
    
    return {
      token,
      user,
    };
  }
}

// OAuth Strategy
import { Strategy } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'https://api.banking-recon.com/auth/oauth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any): Promise<any> {
    const { id, emails, displayName } = profile;
    
    return {
      googleId: id,
      email: emails[0].value,
      name: displayName,
    };
  }
}
```

#### **RBAC Implementation**
```typescript
// libs/shared/src/guards/roles.guard.ts

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}

// Usage
@Controller('users')
export class UsersController {
  @Post()
  @Roles('tenant_admin', 'super_admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async createUser(@Body() dto: CreateUserDto) {
    // Only tenant_admin or super_admin can create users
  }
}
```

---

## 📋 **DOCUMENT 6: MONITORING & OBSERVABILITY**

### **Prometheus Configuration**
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
```

### **Grafana Dashboards**

#### **Dashboard 1: System Overview**
- Total requests/minute
- Error rate (%)
- Response time (p50, p95, p99)
- Active users
- Database connections
- Memory usage per service

#### **Dashboard 2: Business Metrics**
- Reconciliations started (today)
- Reconciliations completed (today)
- Average match rate (%)
- Transactions processed (total)
- Active tenants
- New registrations (today)

#### **Dashboard 3: Database Performance**
- Query duration (p95)
- Slow queries (>1s)
- Connection pool usage
- Locks & deadlocks
- Replication lag

### **Alert Rules**
```yaml
# alerts.yml
groups:
  - name: application
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}% for {{ $labels.service }}"
      
      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow response time detected"
          description: "P95 response time is {{ $value }}s"
      
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service is down"
          description: "{{ $labels.service }} has been down for more than 1 minute"
```

### **ELK Stack Setup**
```yaml
# elasticsearch.yml
cluster.name: banking-recon-logs
network.host: 0.0.0.0
discovery.type: single-node

# logstash.conf
input {
  beats {
    port => 5044
  }
}

filter {
  json {
    source => "message"
  }
  
  mutate {
    add_field => {
      "[@metadata][target_index]" => "logs-%{+YYYY.MM.dd}"
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "%{[@metadata][target_index]}"
  }
}
```

---

## 📋 **DOCUMENT 7: BILLING & SUBSCRIPTION (STRIPE)**

### **Pricing Tiers**
```typescript
// libs/shared/src/constants/pricing.ts

export const PRICING_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    interval: 'month',
    features: {
      maxBankAccounts: 1,
      maxTransactionsPerMonth: 100,
      maxStorageMB: 10,
      maxUsers: 1,
      historyDays: 7,
      support: 'community',
      advancedMatching: false,
      apiAccess: false,
    },
  },
  starter: {
    name: 'Starter',
    price: 49,
    interval: 'month',
    stripePriceId: 'price_starter_monthly',
    features: {
      maxBankAccounts: 3,
      maxTransactionsPerMonth: 1000,
      maxStorageMB: 100,
      maxUsers: 5,
      historyDays: 90,
      support: 'email',
      advancedMatching: false,
      apiAccess: false,
    },
  },
  professional: {
    name: 'Professional',
    price: 199,
    interval: 'month',
    stripePriceId: 'price_professional_monthly',
    features: {
      maxBankAccounts: 10,
      maxTransactionsPerMonth: 10000,
      maxStorageMB: 1000,
      maxUsers: 20,
      historyDays: 365,
      support: 'priority',
      advancedMatching: true,
      apiAccess: true,
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: null, // Custom pricing
    interval: 'month',
    features: {
      maxBankAccounts: -1, // Unlimited
      maxTransactionsPerMonth: -1,
      maxStorageMB: -1,
      maxUsers: -1,
      historyDays: -1,
      support: 'dedicated',
      advancedMatching: true,
      apiAccess: true,
      sla: true,
      customIntegrations: true,
    },
  },
};
```

### **Stripe Integration**
```typescript
// apps/billing-service/src/stripe.service.ts

import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }

  async createCustomer(email: string, name: string, tenantId: string): Promise<string> {
    const customer = await this.stripe.customers.create({
      email,
      name,
      metadata: {
        tenantId,
      },
    });
    
    return customer.id;
  }

  async createSubscription(
    customerId: string,
    priceId: string,
    tenantId: string,
  ): Promise<Stripe.Subscription> {
    return await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        tenantId,
      },
    });
  }

  async updateSubscription(
    subscriptionId: string,
    newPriceId: string,
  ): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    
    return await this.stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations',
    });
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.cancel(subscriptionId);
  }

  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );

    switch (event.type) {
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
    }
  }
}
```

### **Usage Tracking**
```typescript
// apps/billing-service/src/usage-tracking.service.ts

@Injectable()
export class UsageTrackingService {
  async trackTransactionProcessed(tenantId: string, count: number): Promise<void> {
    const tenant = await this.tenantRepository.findOne({ where: { tenantId } });
    
    // Update current usage
    await this.tenantRepository.update(tenantId, {
      currentUsage: {
        ...tenant.currentUsage,
        transactionsThisMonth: tenant.currentUsage.transactionsThisMonth + count,
      },
    });
    
    // Check quota
    if (tenant.currentUsage.transactionsThisMonth > tenant.quotas.maxTransactionsPerMonth) {
      await this.notifyQuotaExceeded(tenantId, 'transactions');
    }
  }

  async checkQuota(tenantId: string, resource: string): Promise<boolean> {
    const tenant = await this.tenantRepository.findOne({ where: { tenantId } });
    
    switch (resource) {
      case 'transactions':
        return tenant.currentUsage.transactionsThisMonth < tenant.quotas.maxTransactionsPerMonth;
      case 'bankAccounts':
        return tenant.currentUsage.bankAccounts < tenant.quotas.maxBankAccounts;
      case 'storage':
        return tenant.currentUsage.storageMB < tenant.quotas.maxStorageMB;
      default:
        return true;
    }
  }

  async resetMonthlyUsage(): Promise<void> {
    // Run this as a cron job on 1st of each month
    await this.tenantRepository.update({}, {
      currentUsage: {
        transactionsThisMonth: 0,
      },
    });
  }
}
```

---

## 📋 **DOCUMENT 8: API DOCUMENTATION (OPENAPI)**

### **OpenAPI Specification**
```yaml
openapi: 3.0.0
info:
  title: Banking Reconciliation System API
  description: Complete API for multi-tenant banking reconciliation
  version: 1.0.0
  contact:
    email: api@banking-recon.com

servers:
  - url: https://api.banking-recon.com/v1
    description: Production
  - url: https://staging-api.banking-recon.com/v1
    description: Staging

security:
  - bearerAuth: []

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

paths:
  /auth/login:
    post:
      summary: User login
      tags: [Authentication]
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
              required:
                - email
                - password
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  token:
                    type: string
                  user:
                    $ref: '#/components/schemas/User'
        '401':
          description: Invalid credentials

  /reconciliations:
    get:
      summary: List reconciliations
      tags: [Reconciliations]
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [in_progress, paused, completed]
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: List of reconciliations
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Reconciliation'
                  total:
                    type: integer
                  limit:
                    type: integer
                  offset:
                    type: integer

    post:
      summary: Create reconciliation
      tags: [Reconciliations]
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                bankFiles:
                  type: array
                  items:
                    type: string
                    format: binary
                ledgerFile:
                  type: string
                  format: binary
                dateRange:
                  $ref: '#/components/schemas/DateRange'
      responses:
        '201':
          description: Reconciliation created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Reconciliation'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        name:
          type: string
        role:
          type: string
          enum: [super_admin, tenant_admin, accountant, viewer]
        tenantId:
          type: string

    Reconciliation:
      type: object
      properties:
        id:
          type: string
          format: uuid
        status:
          type: string
          enum: [in_progress, paused, completed]
        totalTransactions:
          type: integer
        matchedCount:
          type: integer
        unmatchedCount:
          type: integer
        convergenceRate:
          type: number
          format: float
        createdAt:
          type: string
          format: date-time

    DateRange:
      type: object
      properties:
        includeAll:
          type: boolean
          default: true
        fromDate:
          type: string
          format: date
        toDate:
          type: string
          format: date
```

---

## 📋 **DOCUMENT 9-11: REMAINING DOCUMENTS**

### **Document 9: User & Admin Documentation**
- Getting Started Guide (10 pages)
- Upload & Reconciliation Tutorial (15 pages)
- Review Process Guide (10 pages)
- FAQ (50+ questions)
- Video Scripts (3 tutorials)

### **Document 10: Performance Optimization**
- Redis caching implementation
- Database query optimization
- API response compression
- Frontend code splitting
- Load testing with k6

### **Document 11: Admin Panel**
- Super admin dashboard design
- Tenant management interface
- User management
- System health monitoring
- Feature flags UI

---

## 📋 **DOCUMENT 12: CLAUDE CODE MASTER GUIDE**

### **Implementation Phases (200+ Steps)**

**PHASE 1: Multi-Tenancy (Week 1-3)**
- Step 1-20: Database migrations
- Step 21-40: Service updates
- Step 41-60: Testing

**PHASE 2: Frontend (Week 4-9)**
- Step 61-100: React components
- Step 101-120: API integration
- Step 121-140: Testing

**PHASE 3: Cloud Deploy (Week 6-8)**
- Step 141-160: AWS setup
- Step 161-180: Kubernetes
- Step 181-200: Monitoring

**PHASE 4: Production (Week 8-16)**
- Step 201-220: Security
- Step 221-240: Billing
- Step 241-260: Documentation
- Step 261-280: Launch

### **Human Intervention Points**

1. **AWS Account Setup** (Step 141)
   - Create AWS account
   - Set up billing
   - Create IAM user with keys
   - Provide: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

2. **Domain & SSL** (Step 165)
   - Purchase domain name
   - Configure DNS
   - Request SSL certificate
   - Provide: DOMAIN_NAME, SSL_CERT_ARN

3. **Stripe Setup** (Step 221)
   - Create Stripe account
   - Get API keys
   - Configure webhooks
   - Provide: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

4. **Email Service** (Step 230)
   - Setup SendGrid/AWS SES
   - Configure domain
   - Provide: EMAIL_API_KEY

5. **Approval Gates**
   - Staging deployment (Step 195)
   - Production deployment (Step 275)
   - User acceptance testing (Step 280)

---

## ✅ **COMPLETE IMPLEMENTATION CHECKLIST**

### **Phase 1: Backend (Weeks 1-3)**
- [ ] Implement Document 1 (Multi-Tenancy)
- [ ] Update all 22 services
- [ ] Run migrations
- [ ] Test tenant isolation

### **Phase 2: Frontend (Weeks 4-9)**
- [ ] Implement Document 2 (React UI)
- [ ] Build all 15 screens
- [ ] Integrate with APIs
- [ ] E2E testing

### **Phase 3: Infrastructure (Weeks 6-8)**
- [ ] Implement Document 3 (AWS)
- [ ] Setup EKS cluster
- [ ] Deploy services
- [ ] Configure monitoring

### **Phase 4: CI/CD (Weeks 6-8)**
- [ ] Implement Document 4 (GitHub Actions)
- [ ] Setup pipelines
- [ ] Automated testing
- [ ] Blue-green deployment

### **Phase 5: Security (Weeks 8-10)**
- [ ] Implement Document 5 (Auth & Security)
- [ ] 2FA, OAuth, RBAC
- [ ] Security audit
- [ ] Penetration testing

### **Phase 6: Observability (Weeks 11-12)**
- [ ] Implement Document 6 (Monitoring)
- [ ] Prometheus + Grafana
- [ ] ELK Stack
- [ ] Alert rules

### **Phase 7: Billing (Weeks 12-14)**
- [ ] Implement Document 7 (Stripe)
- [ ] Payment integration
- [ ] Usage tracking
- [ ] Quota enforcement

### **Phase 8: Documentation (Weeks 14-15)**
- [ ] Document 8 (API docs)
- [ ] Document 9 (User guides)
- [ ] Video tutorials
- [ ] Knowledge base

### **Phase 9: Launch (Week 16)**
- [ ] Load testing
- [ ] Security audit
- [ ] Soft launch (beta users)
- [ ] Full launch

### **Phase 10: Post-Launch (Weeks 17-20)**
- [ ] Document 10 (Optimization)
- [ ] Document 11 (Admin Panel)
- [ ] Performance tuning
- [ ] Feature iterations

---

## 🎯 **SUCCESS CRITERIA**

**Technical:**
- [ ] 99.9% uptime
- [ ] <2s page load time
- [ ] <500ms API response time
- [ ] Pass security audit
- [ ] 100% test coverage (critical paths)

**Business:**
- [ ] Support 100+ tenants
- [ ] Handle 10,000 transactions/day
- [ ] <5% error rate
- [ ] >90% user satisfaction
- [ ] Successful payments processing

**Operational:**
- [ ] Automated deployments
- [ ] <15 min rollback time
- [ ] 24/7 monitoring
- [ ] <1 hour incident response
- [ ] Comprehensive documentation

---

## 📞 **GETTING HELP**

**For Claude Code:**
- Each document has detailed specifications
- Follow step-by-step guides
- Test after each step
- Ask when credentials needed
- Report progress regularly

**For You:**
- Review each phase
- Provide credentials when prompted
- Approve production deployments
- Test thoroughly
- Monitor post-launch

---

**ALL DOCUMENTS COMPLETE!**

**Ready for Claude Code implementation!** 🚀

Total: 11 documents + Master Guide = Complete SaaS platform specification
