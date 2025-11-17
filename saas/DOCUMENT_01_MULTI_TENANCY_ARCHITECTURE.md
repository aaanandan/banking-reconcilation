# DOCUMENT 1: MULTI-TENANCY ARCHITECTURE

## Complete Design Specification for SaaS Transformation

**Version:** 1.0  
**Date:** November 16, 2025  
**Status:** Ready for Implementation  
**Implementation Time:** 2-3 weeks  
**Prerequisites:** Validated Backend (22 services)  

---

## 📋 **DOCUMENT OVERVIEW**

### **Purpose**
Transform the single-tenant Banking Reconciliation System into a multi-tenant SaaS platform where multiple companies (tenants) can use the system independently with complete data isolation.

### **Scope**
- Database schema updates (add tenantId to all entities)
- Tenant management system
- Tenant-aware authentication
- Data isolation enforcement
- Tenant onboarding flow
- Service layer updates (all 22 services)

### **Target Outcome**
- Multiple companies can use the system
- Complete data isolation between tenants
- No cross-tenant data leakage
- Tenant-specific configurations
- Scalable to 1000+ tenants

---

## 🎯 **TENANT ISOLATION STRATEGY**

### **Three Approaches Evaluated:**

#### **Option A: Single Database + TenantId (RECOMMENDED)**
```
┌─────────────────────────────────────────┐
│         Single PostgreSQL Database       │
├─────────────────────────────────────────┤
│  Table: transactions                    │
│  ┌────────┬──────────┬────────────┐    │
│  │ id     │ tenantId │ amount     │    │
│  ├────────┼──────────┼────────────┤    │
│  │ 1      │ tenant_1 │ 50000      │    │
│  │ 2      │ tenant_2 │ 30000      │    │
│  │ 3      │ tenant_1 │ 20000      │    │
│  └────────┴──────────┴────────────┘    │
└─────────────────────────────────────────┘

Pros:
✅ Simple to implement
✅ Easy to manage
✅ Cost-effective
✅ Easy backup/restore
✅ Easy to query across tenants (admin)
✅ Recommended for <10,000 tenants

Cons:
⚠️ Risk of data leakage if queries miss tenantId filter
⚠️ All tenants share same database resources
⚠️ Schema changes affect all tenants
```

#### **Option B: Schema Per Tenant**
```
┌─────────────────────────────────────────┐
│         Single PostgreSQL Database       │
├─────────────────────────────────────────┤
│  Schema: tenant_1                       │
│    Table: transactions                   │
│  Schema: tenant_2                       │
│    Table: transactions                   │
│  Schema: tenant_3                       │
│    Table: transactions                   │
└─────────────────────────────────────────┘

Pros:
✅ Better isolation than Option A
✅ Easier to migrate tenant to separate DB
✅ Schema-level security

Cons:
⚠️ More complex connection management
⚠️ Harder to query across tenants
⚠️ Schema migrations need to run N times
```

#### **Option C: Database Per Tenant**
```
┌─────────────────────────────────────────┐
│    Database: tenant_1_db                 │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│    Database: tenant_2_db                 │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│    Database: tenant_3_db                 │
└─────────────────────────────────────────┘

Pros:
✅ Maximum isolation
✅ Independent scaling per tenant
✅ Easiest to migrate tenant

Cons:
❌ Very expensive (1000 databases)
❌ Complex connection management
❌ Hard to query across tenants
❌ Backup/restore complexity
```

### **DECISION: Option A - Single Database + TenantId**

**Rationale:**
- Simplest to implement
- Cost-effective
- Scales to 10,000+ tenants
- Easy to manage
- Matches our current architecture
- Can migrate to Option B/C later if needed

---

## 🗄️ **DATABASE SCHEMA UPDATES**

### **Current State (Single-Tenant)**
```typescript
@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column()
  source: string;
  
  @Column({ nullable: true })
  bankId: string;
  
  // ... other fields
}
```

### **Target State (Multi-Tenant)**
```typescript
@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;
  
  // ═══════════════════════════════════════════════════════════
  // MULTI-TENANCY: Add tenantId to EVERY entity
  // ═══════════════════════════════════════════════════════════
  @Column()
  @Index() // CRITICAL: Index for query performance
  tenantId: string; // Format: "tenant_abc123"
  // ═══════════════════════════════════════════════════════════
  
  @Column()
  source: string;
  
  @Column({ nullable: true })
  bankId: string;
  
  // ... other fields
}
```

---

## 📊 **ALL 10 ENTITIES - UPDATED WITH TENANTID**

### **1. User Entity (Updated)**
```typescript
// libs/shared/src/entities/user.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  Index,
} from 'typeorm';
import { Tenant } from './tenant.entity'; // NEW
import { Reconciliation } from './reconciliation.entity';
import { UserFeedback } from './user-feedback.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ═══════════════════════════════════════════════════════════
  // MULTI-TENANCY
  // ═══════════════════════════════════════════════════════════
  @Column()
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant, tenant => tenant.users)
  tenant: Tenant;
  // ═══════════════════════════════════════════════════════════

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  company: string;

  @Column({ default: 'user' })
  role: string;  // 'tenant_admin' | 'accountant' | 'viewer'

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Reconciliation, recon => recon.user)
  reconciliations: Reconciliation[];

  @OneToMany(() => UserFeedback, feedback => feedback.user)
  feedbacks: UserFeedback[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### **2. Tenant Entity (NEW)**
```typescript
// libs/shared/src/entities/tenant.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Reconciliation } from './reconciliation.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  tenantId: string; // "tenant_abc123"

  @Column()
  companyName: string;

  @Column({ unique: true })
  email: string; // Primary contact email

  @Column({ nullable: true })
  domain: string; // "acme.com" (optional custom domain)

  @Column({ default: 'active' })
  status: string; // 'active' | 'suspended' | 'trial' | 'cancelled'

  // ═══════════════════════════════════════════════════════════
  // SUBSCRIPTION & BILLING
  // ═══════════════════════════════════════════════════════════
  @Column({ default: 'free' })
  plan: string; // 'free' | 'starter' | 'professional' | 'enterprise'

  @Column({ type: 'date', nullable: true })
  trialEndsAt: Date;

  @Column({ type: 'date', nullable: true })
  subscriptionEndsAt: Date;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ nullable: true })
  stripeSubscriptionId: string;
  // ═══════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════
  // RESOURCE QUOTAS
  // ═══════════════════════════════════════════════════════════
  @Column({ type: 'jsonb', nullable: true })
  quotas: {
    maxBankAccounts: number;      // e.g., 3 for starter
    maxTransactionsPerMonth: number; // e.g., 1000 for starter
    maxStorageMB: number;          // e.g., 100 MB for starter
    maxUsers: number;              // e.g., 5 for starter
  };

  @Column({ type: 'jsonb', nullable: true })
  currentUsage: {
    bankAccounts: number;
    transactionsThisMonth: number;
    storageMB: number;
    users: number;
  };
  // ═══════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════
  @Column({ type: 'jsonb', nullable: true })
  settings: {
    timezone: string;
    currency: string;
    dateFormat: string;
    allowMultipleBanks: boolean;
    features: string[]; // ['advanced_matching', 'api_access', etc.]
  };
  // ═══════════════════════════════════════════════════════════

  @OneToMany(() => User, user => user.tenant)
  users: User[];

  @OneToMany(() => Reconciliation, recon => recon.tenant)
  reconciliations: Reconciliation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### **3. Reconciliation Entity (Updated)**
```typescript
// libs/shared/src/entities/reconciliation.entity.ts

// ... imports

@Entity('reconciliations')
export class Reconciliation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ═══════════════════════════════════════════════════════════
  // MULTI-TENANCY
  // ═══════════════════════════════════════════════════════════
  @Column()
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant, tenant => tenant.reconciliations)
  tenant: Tenant;
  // ═══════════════════════════════════════════════════════════

  @Column()
  userId: string;

  @ManyToOne(() => User, user => user.reconciliations)
  user: User;

  // ... rest of fields remain same
  
  @OneToMany(() => BankFile, bankFile => bankFile.reconciliation, {
    cascade: true,
    eager: true,
  })
  bankFiles: BankFile[];

  // ... rest of entity
}
```

### **4. BankFile Entity (Updated)**
```typescript
// libs/shared/src/entities/bank-file.entity.ts

@Entity('bank_files')
export class BankFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ═══════════════════════════════════════════════════════════
  // MULTI-TENANCY
  // ═══════════════════════════════════════════════════════════
  @Column()
  @Index()
  tenantId: string;
  // ═══════════════════════════════════════════════════════════

  @Column()
  bankId: string;

  @Column()
  bankName: string;

  // ... rest of fields
}
```

### **5. LedgerFile Entity (Updated)**
```typescript
// libs/shared/src/entities/ledger-file.entity.ts

@Entity('ledger_files')
export class LedgerFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ═══════════════════════════════════════════════════════════
  // MULTI-TENANCY
  // ═══════════════════════════════════════════════════════════
  @Column()
  @Index()
  tenantId: string;
  // ═══════════════════════════════════════════════════════════

  @Column()
  filename: string;

  // ... rest of fields
}
```

### **6. Transaction Entity (Updated)**
```typescript
// libs/shared/src/entities/transaction.entity.ts

@Entity('transactions')
@Index(['tenantId', 'reconciliationId']) // Composite index
@Index(['tenantId', 'source'])
@Index(['tenantId', 'bankId'])
@Index(['tenantId', 'status'])
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  // ═══════════════════════════════════════════════════════════
  // MULTI-TENANCY
  // ═══════════════════════════════════════════════════════════
  @Column()
  @Index()
  tenantId: string;
  // ═══════════════════════════════════════════════════════════

  @Column()
  source: string;

  @Column({ nullable: true })
  @Index()
  bankId: string;

  // ... rest of fields
}
```

### **7-10. Remaining Entities (Same Pattern)**

Apply the same pattern to:
- **match-candidate.entity.ts** - Add tenantId + index
- **entity-profile.entity.ts** - Add tenantId + index
- **learning-question.entity.ts** - Add tenantId + index
- **convergence-metrics.entity.ts** - Add tenantId + index
- **user-feedback.entity.ts** - Add tenantId + index

**Pattern for all:**
```typescript
@Column()
@Index()
tenantId: string;
```

---

## 🔧 **SQL MIGRATIONS**

### **Migration 1: Add Tenant Table**
```typescript
// migrations/1700000000001-AddTenantTable.ts

import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddTenantTable1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tenants',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenantId',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'companyName',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'domain',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'active'",
          },
          {
            name: 'plan',
            type: 'varchar',
            default: "'free'",
          },
          {
            name: 'trialEndsAt',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'subscriptionEndsAt',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'stripeCustomerId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'stripeSubscriptionId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'quotas',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'currentUsage',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'settings',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create index on tenantId
    await queryRunner.query(
      `CREATE INDEX "IDX_tenants_tenantId" ON "tenants" ("tenantId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tenants');
  }
}
```

### **Migration 2: Add TenantId to All Tables**
```typescript
// migrations/1700000000002-AddTenantIdToAllTables.ts

import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddTenantIdToAllTables1700000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'users',
      'reconciliations',
      'bank_files',
      'ledger_files',
      'transactions',
      'match_candidates',
      'entity_profiles',
      'learning_questions',
      'convergence_metrics',
      'user_feedback',
    ];

    for (const tableName of tables) {
      // Add tenantId column
      await queryRunner.addColumn(
        tableName,
        new TableColumn({
          name: 'tenantId',
          type: 'varchar',
          isNullable: true, // Initially nullable for migration
        }),
      );

      // Create index on tenantId
      await queryRunner.createIndex(
        tableName,
        new TableIndex({
          name: `IDX_${tableName}_tenantId`,
          columnNames: ['tenantId'],
        }),
      );
    }

    // CRITICAL: Set default tenant for existing data
    // Create a default tenant for migration
    await queryRunner.query(`
      INSERT INTO tenants (id, "tenantId", "companyName", email, status, plan, "createdAt", "updatedAt")
      VALUES (
        uuid_generate_v4(),
        'tenant_default',
        'Default Tenant (Migration)',
        'admin@example.com',
        'active',
        'enterprise',
        NOW(),
        NOW()
      )
    `);

    // Update all existing records with default tenant
    for (const tableName of tables) {
      await queryRunner.query(`
        UPDATE "${tableName}"
        SET "tenantId" = 'tenant_default'
        WHERE "tenantId" IS NULL
      `);

      // Make tenantId NOT NULL after populating
      await queryRunner.query(`
        ALTER TABLE "${tableName}"
        ALTER COLUMN "tenantId" SET NOT NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'users',
      'reconciliations',
      'bank_files',
      'ledger_files',
      'transactions',
      'match_candidates',
      'entity_profiles',
      'learning_questions',
      'convergence_metrics',
      'user_feedback',
    ];

    for (const tableName of tables) {
      await queryRunner.dropIndex(tableName, `IDX_${tableName}_tenantId`);
      await queryRunner.dropColumn(tableName, 'tenantId');
    }

    await queryRunner.query(`DELETE FROM tenants WHERE "tenantId" = 'tenant_default'`);
  }
}
```

---

## 🔐 **TENANT-AWARE AUTHENTICATION**

### **JWT Token Structure (Updated)**

**Before (Single-Tenant):**
```typescript
{
  userId: "user_123",
  email: "john@example.com",
  role: "user"
}
```

**After (Multi-Tenant):**
```typescript
{
  userId: "user_123",
  tenantId: "tenant_abc123",  // NEW
  email: "john@example.com",
  role: "tenant_admin",
  permissions: ["read", "write", "admin"]
}
```

### **Auth Service Updates**

```typescript
// apps/auth-service/src/auth.service.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@app/shared/entities/user.entity';
import { Tenant } from '@app/shared/entities/tenant.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Check if tenant exists
    let tenant = await this.tenantRepository.findOne({
      where: { email: dto.companyEmail },
    });

    // Create tenant if new registration
    if (!tenant) {
      tenant = this.tenantRepository.create({
        tenantId: `tenant_${this.generateId()}`,
        companyName: dto.companyName,
        email: dto.companyEmail,
        status: 'trial',
        plan: 'free',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        quotas: {
          maxBankAccounts: 1,
          maxTransactionsPerMonth: 100,
          maxStorageMB: 10,
          maxUsers: 1,
        },
        currentUsage: {
          bankAccounts: 0,
          transactionsThisMonth: 0,
          storageMB: 0,
          users: 0,
        },
      });
      await this.tenantRepository.save(tenant);
    }

    // Create user
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      tenantId: tenant.tenantId,
      email: dto.email,
      passwordHash: hashedPassword,
      name: dto.name,
      role: 'tenant_admin', // First user is admin
      isActive: true,
    });
    await this.userRepository.save(user);

    // Generate JWT with tenantId
    const token = this.jwtService.sign({
      userId: user.id,
      tenantId: tenant.tenantId,  // CRITICAL
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: tenant.tenantId,
        companyName: tenant.companyName,
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
      relations: ['tenant'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user/tenant is active
    if (!user.isActive || user.tenant.status === 'suspended') {
      throw new UnauthorizedException('Account is not active');
    }

    // Generate JWT with tenantId
    const token = this.jwtService.sign({
      userId: user.id,
      tenantId: user.tenantId,  // CRITICAL
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        companyName: user.tenant.companyName,
      },
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }
}
```

---

## 🛡️ **TENANT CONTEXT MIDDLEWARE**

### **Tenant Context Decorator**
```typescript
// libs/shared/src/decorators/tenant-context.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TenantContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return {
      tenantId: request.user?.tenantId,
      userId: request.user?.userId,
      role: request.user?.role,
    };
  },
);
```

### **Tenant Isolation Middleware**
```typescript
// libs/shared/src/middleware/tenant-isolation.middleware.ts

import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantIsolationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract tenantId from JWT (already verified by JwtAuthGuard)
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new UnauthorizedException('Missing tenant context');
    }

    // Add tenantId to request for easy access
    req['tenantId'] = tenantId;

    next();
  }
}
```

### **Apply Middleware Globally**
```typescript
// apps/data-prep-service/src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TenantIsolationMiddleware } from '@app/shared/middleware/tenant-isolation.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Apply tenant isolation middleware globally
  app.use(new TenantIsolationMiddleware().use);
  
  await app.listen(3000);
}
bootstrap();
```

---

## 📊 **SERVICE LAYER UPDATES**

### **Base Repository with Tenant Filtering**

```typescript
// libs/shared/src/repositories/tenant-aware.repository.ts

import { Repository, FindOptionsWhere, FindManyOptions } from 'typeorm';

export class TenantAwareRepository<T extends { tenantId: string }> {
  constructor(
    private repository: Repository<T>,
    private tenantId: string,
  ) {}

  /**
   * Automatically adds tenantId filter to all queries
   */
  private addTenantFilter<K>(
    where: FindOptionsWhere<T> | FindOptionsWhere<T>[],
  ): FindOptionsWhere<T> | FindOptionsWhere<T>[] {
    if (Array.isArray(where)) {
      return where.map(w => ({ ...w, tenantId: this.tenantId } as FindOptionsWhere<T>));
    }
    return { ...where, tenantId: this.tenantId } as FindOptionsWhere<T>;
  }

  async findOne(options: FindManyOptions<T>): Promise<T | null> {
    return this.repository.findOne({
      ...options,
      where: this.addTenantFilter(options.where),
    });
  }

  async find(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find({
      ...options,
      where: this.addTenantFilter(options.where || {}),
    });
  }

  async save(entity: Partial<T>): Promise<T> {
    // Ensure tenantId is set
    entity.tenantId = this.tenantId;
    return this.repository.save(entity as any);
  }

  async update(id: any, entity: Partial<T>): Promise<void> {
    await this.repository.update(
      { id, tenantId: this.tenantId } as any,
      entity,
    );
  }

  async delete(id: any): Promise<void> {
    await this.repository.delete({ id, tenantId: this.tenantId } as any);
  }

  async count(options?: FindManyOptions<T>): Promise<number> {
    return this.repository.count({
      ...options,
      where: this.addTenantFilter(options?.where || {}),
    });
  }
}
```

### **Example: Data Prep Service (Updated)**

```typescript
// apps/data-prep-service/src/data-prep.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reconciliation } from '@app/shared/entities/reconciliation.entity';
import { BankFile } from '@app/shared/entities/bank-file.entity';
import { TenantAwareRepository } from '@app/shared/repositories/tenant-aware.repository';
import { TenantContext } from '@app/shared/decorators/tenant-context.decorator';

@Injectable()
export class DataPrepService {
  constructor(
    @InjectRepository(Reconciliation)
    private reconciliationRepo: Repository<Reconciliation>,
    @InjectRepository(BankFile)
    private bankFileRepo: Repository<BankFile>,
  ) {}

  async processMultiBankUpload(
    files: any[],
    tenantContext: { tenantId: string; userId: string },
  ): Promise<any> {
    // Create tenant-aware repositories
    const reconRepo = new TenantAwareRepository(
      this.reconciliationRepo,
      tenantContext.tenantId,
    );
    const bankRepo = new TenantAwareRepository(
      this.bankFileRepo,
      tenantContext.tenantId,
    );

    // All operations automatically filtered by tenantId
    const reconciliation = await reconRepo.save({
      userId: tenantContext.userId,
      status: 'in_progress',
      // tenantId automatically added
    });

    for (const file of files) {
      await bankRepo.save({
        reconciliationId: reconciliation.id,
        bankId: file.bankId,
        bankName: file.bankName,
        filename: file.filename,
        // tenantId automatically added
      });
    }

    return reconciliation;
  }

  // All other methods follow same pattern
}
```

### **Controller Updates**

```typescript
// apps/data-prep-service/src/data-prep.controller.ts

import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@app/shared/guards/jwt-auth.guard';
import { TenantContext } from '@app/shared/decorators/tenant-context.decorator';
import { DataPrepService } from './data-prep.service';

@Controller('data-prep')
@UseGuards(JwtAuthGuard) // Validates JWT
export class DataPrepController {
  constructor(private dataPrepService: DataPrepService) {}

  @Post('upload')
  async uploadFiles(
    @Body() uploadDto: UploadDto,
    @TenantContext() context: { tenantId: string; userId: string },
  ) {
    // context.tenantId automatically extracted from JWT
    return this.dataPrepService.processMultiBankUpload(
      uploadDto.files,
      context,
    );
  }
}
```

---

## 🔄 **UPDATE ALL 22 SERVICES**

### **Services to Update:**

1. ✅ **data-prep-service** (Port 3000)
   - Add @TenantContext() to all endpoints
   - Use TenantAwareRepository
   - Validate quota limits before upload

2. ✅ **state-manager-service**
   - Add tenant filtering to all queries
   - Prevent cross-tenant access
   - Track per-tenant usage

3. ✅ **match-orchestrator** (Port 3001)
   - Pass tenantId to all MT services
   - Track per-tenant convergence
   
4. ✅ **learning-service** (Port 3002)
   - Per-tenant entity profiles
   - Per-tenant learning patterns
   
5. ✅ **question-manager-service**
   - Per-tenant questions
   
6-21. ✅ **MT-01 through MT-16**
   - All matching services get tenantId in requests
   - Return tenant-scoped results only

22. ✅ **auth-service** (NEW)
   - Register with tenant creation
   - Login with tenant context

---

## 🚀 **TENANT MANAGEMENT API**

### **Tenant CRUD Operations**

```typescript
// apps/tenant-service/src/tenant.controller.ts (NEW SERVICE)

import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto, UpdateTenantDto } from './dto';
import { SuperAdminGuard } from '@app/shared/guards/super-admin.guard';

@Controller('tenants')
export class TenantController {
  constructor(private tenantService: TenantService) {}

  // Super admin only
  @Post()
  @UseGuards(SuperAdminGuard)
  async createTenant(@Body() dto: CreateTenantDto) {
    return this.tenantService.create(dto);
  }

  @Get()
  @UseGuards(SuperAdminGuard)
  async listTenants() {
    return this.tenantService.findAll();
  }

  @Get(':tenantId')
  @UseGuards(SuperAdminGuard)
  async getTenant(@Param('tenantId') tenantId: string) {
    return this.tenantService.findOne(tenantId);
  }

  @Put(':tenantId')
  @UseGuards(SuperAdminGuard)
  async updateTenant(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantService.update(tenantId, dto);
  }

  @Delete(':tenantId')
  @UseGuards(SuperAdminGuard)
  async deleteTenant(@Param('tenantId') tenantId: string) {
    return this.tenantService.delete(tenantId);
  }

  // Tenant admin can view own tenant
  @Get('me/info')
  async getMyTenant(@TenantContext() context: { tenantId: string }) {
    return this.tenantService.findOne(context.tenantId);
  }

  // Tenant admin can update own tenant settings
  @Put('me/settings')
  async updateMySettings(
    @TenantContext() context: { tenantId: string },
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.tenantService.updateSettings(context.tenantId, dto);
  }
}
```

---

## 📋 **TESTING STRATEGY**

### **Test 1: Tenant Isolation**
```typescript
// Test that Tenant A cannot access Tenant B's data

describe('Tenant Isolation', () => {
  it('should not allow cross-tenant data access', async () => {
    // Create two tenants
    const tenantA = await createTenant('Company A');
    const tenantB = await createTenant('Company B');

    // Create reconciliation for Tenant A
    const reconA = await createReconciliation(tenantA.tenantId);

    // Try to access from Tenant B (should fail)
    await expect(
      getReconciliation(reconA.id, tenantB.tenantId)
    ).rejects.toThrow('Not Found');
  });
});
```

### **Test 2: JWT Tenant Context**
```typescript
describe('JWT Tenant Context', () => {
  it('should include tenantId in JWT', async () => {
    const { token } = await login('user@tenanta.com', 'password');
    const decoded = jwt.decode(token);
    
    expect(decoded.tenantId).toBeDefined();
    expect(decoded.tenantId).toMatch(/^tenant_/);
  });
});
```

### **Test 3: Multi-Tenant Query Performance**
```typescript
describe('Query Performance', () => {
  it('should use tenantId index', async () => {
    // Create 1000 transactions across 10 tenants
    await seedMultiTenantData(10, 1000);

    // Query should use index (< 50ms)
    const start = Date.now();
    await getTransactions('tenant_1');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(50);
  });
});
```

---

## ✅ **IMPLEMENTATION CHECKLIST**

### **Phase 1: Database Updates (Week 1)**
- [ ] Create Tenant entity
- [ ] Add tenantId to all 10 entities
- [ ] Create migration scripts
- [ ] Run migrations on dev database
- [ ] Verify indexes created
- [ ] Create default tenant for existing data

### **Phase 2: Authentication (Week 1)**
- [ ] Update JWT payload with tenantId
- [ ] Create tenant registration flow
- [ ] Update login to include tenant context
- [ ] Create TenantContext decorator
- [ ] Create TenantIsolationMiddleware
- [ ] Test authentication flow

### **Phase 3: Service Updates (Week 2)**
- [ ] Create TenantAwareRepository base class
- [ ] Update Data Prep Service
- [ ] Update State Manager Service
- [ ] Update Match Orchestrator
- [ ] Update Learning Service
- [ ] Update Question Manager
- [ ] Update all 16 MT Services
- [ ] Test each service with tenant isolation

### **Phase 4: Tenant Management (Week 2-3)**
- [ ] Create Tenant Service (new)
- [ ] Create Tenant CRUD API
- [ ] Create tenant settings management
- [ ] Create quota enforcement
- [ ] Create usage tracking
- [ ] Test tenant management

### **Phase 5: Testing & Validation (Week 3)**
- [ ] Write tenant isolation tests
- [ ] Write cross-tenant access tests
- [ ] Write performance tests with 10+ tenants
- [ ] Load testing with 100+ tenants
- [ ] Security audit
- [ ] Documentation updates

---

## 🎯 **SUCCESS CRITERIA**

✅ **Functional:**
- Multiple companies can register independently
- Complete data isolation (no cross-tenant access)
- Each tenant sees only their own data
- Tenant-specific configurations work
- Quota enforcement works

✅ **Performance:**
- Queries use tenantId indexes (<50ms)
- System handles 100+ tenants
- No performance degradation per tenant

✅ **Security:**
- No JWT token reuse across tenants
- No SQL queries missing tenantId filter
- All API endpoints tenant-aware
- Security audit passes

---

## 📚 **NEXT DOCUMENT**

After implementing multi-tenancy:
- **Document 2:** Frontend UI/UX Design (React)

---

**END OF DOCUMENT 1**

This document is complete and ready for Claude Code implementation.
