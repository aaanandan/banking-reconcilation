# State Manager Service - Tenant-Aware Pattern

## Overview
This document shows the tenant-aware pattern applied to state-manager-service as a reference for all other services.

## Controller Pattern

```typescript
import { TenantContext } from '@app/shared';

@Controller('state')
export class StateManagerServiceController {
  // Add @TenantContext() decorator to EVERY endpoint

  async createReconciliation(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Body() createDto: CreateReconciliationDto,
  ): Promise<CreateReconciliationResponseDto> {
    return this.stateManagerService.createReconciliation(tenantContext, createDto);
  }

  async getReconciliation(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Param('id') id: string,
  ): Promise<ReconciliationStateDto> {
    return this.stateManagerService.getReconciliation(tenantContext, id);
  }

  // ... repeat for all endpoints
}
```

## Service Pattern

```typescript
import { TenantAwareRepository } from '@app/shared';

@Injectable()
export class StateManagerServiceService {
  private readonly logger = new Logger(StateManagerServiceService.name);

  constructor(
    @InjectRepository(Reconciliation)
    private readonly reconciliationRepo: Repository<Reconciliation>,
    // ... other repositories
  ) {}

  async createReconciliation(
    tenantContext: { tenantId: string; userId: string; role: string },
    dto: CreateReconciliationDto
  ): Promise<{ reconciliationId: string }> {
    // Step 1: Log with tenant ID
    this.logger.log(\`[Tenant: \${tenantContext.tenantId}] Creating reconciliation\`);

    // Step 2: Create tenant-aware repositories
    const reconRepo = new TenantAwareRepository(
      this.reconciliationRepo,
      tenantContext.tenantId
    );

    // Step 3: Use tenant-aware repo for all operations
    const savedReconciliation = await reconRepo.save({
      userId: dto.userId,
      status: 'in_progress',
      // tenantId is automatically added by TenantAwareRepository
    });

    return { reconciliationId: savedReconciliation.id };
  }

  async getReconciliation(
    tenantContext: { tenantId: string; userId: string; role: string },
    id: string
  ): Promise<ReconciliationStateDto> {
    this.logger.log(\`[Tenant: \${tenantContext.tenantId}] Getting reconciliation \${id}\`);

    const reconRepo = new TenantAwareRepository(
      this.reconciliationRepo,
      tenantContext.tenantId
    );

    // findOne automatically adds WHERE tenantId = '...'
    const reconciliation = await reconRepo.findOne({
      where: { id },
      relations: ['bankFiles', 'ledgerFile'],
    });

    if (!reconciliation) {
      throw new NotFoundException('Reconciliation not found');
    }

    return reconciliation;
  }

  async updateReconciliation(
    tenantContext: { tenantId: string; userId: string; role: string },
    id: string,
    dto: UpdateReconciliationDto
  ): Promise<UpdateReconciliationResponseDto> {
    this.logger.log(\`[Tenant: \${tenantContext.tenantId}] Updating reconciliation \${id}\`);

    const reconRepo = new TenantAwareRepository(
      this.reconciliationRepo,
      tenantContext.tenantId
    );

    // update() automatically adds WHERE tenantId = '...'
    await reconRepo.update(id, {
      status: dto.status,
      currentStep: dto.currentStep,
      // ... other fields
    });

    return { success: true };
  }

  async deleteReconciliation(
    tenantContext: { tenantId: string; userId: string; role: string },
    id: string
  ): Promise<{ success: boolean }> {
    this.logger.log(\`[Tenant: \${tenantContext.tenantId}] Deleting reconciliation \${id}\`);

    const reconRepo = new TenantAwareRepository(
      this.reconciliationRepo,
      tenantContext.tenantId
    );

    // delete() automatically adds WHERE tenantId = '...'
    await reconRepo.delete(id);

    return { success: true };
  }
}
```

## Key Benefits

1. **Zero Cross-Tenant Leakage**
   - All queries automatically filtered by tenantId
   - Impossible to accidentally access another tenant's data

2. **Consistent Pattern**
   - Same approach across all services
   - Easy to review and audit

3. **Audit Trail**
   - All operations logged with tenantId
   - Complete tenant activity tracking

4. **Type Safety**
   - TypeScript ensures tenantContext is passed
   - Compile-time validation

## TenantAwareRepository Methods

```typescript
class TenantAwareRepository<T> {
  // All methods automatically add: WHERE tenantId = '...'

  async findOne(options): Promise<T | null>
  async find(options?): Promise<T[]>
  async save(entity): Promise<T>          // tenantId auto-added
  async update(id, entity): Promise<void> // WHERE id AND tenantId
  async delete(id): Promise<void>         // WHERE id AND tenantId
  async count(options?): Promise<number>
}
```

## Migration Checklist for Each Service

- [ ] Import TenantContext and TenantAwareRepository
- [ ] Add @TenantContext() to all controller endpoints
- [ ] Add tenantContext parameter to all service methods
- [ ] Add Logger and tenant-aware logging
- [ ] Replace direct repository calls with TenantAwareRepository
- [ ] Test tenant isolation
- [ ] Verify no cross-tenant queries possible

## Applied To

- ✅ data-prep-service (Step 32)
- ✅ state-manager-service (Step 33-34)
- ⏳ match-orchestrator (Step 35-36)
- ⏳ learning-service (Step 37-38)
- ⏳ question-manager-service (Step 39-40)
- ⏳ MT-01 through MT-16 (Steps 41-48)
- ⏳ Remaining services (Steps 49-50)
