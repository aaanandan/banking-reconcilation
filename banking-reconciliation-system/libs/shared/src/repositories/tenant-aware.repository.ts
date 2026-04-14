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
    const where = options.where || {};
    return this.repository.findOne({
      ...options,
      where: this.addTenantFilter(where),
    });
  }

  async find(options?: FindManyOptions<T>): Promise<T[]> {
    const where = options?.where || {};
    return this.repository.find({
      ...options,
      where: this.addTenantFilter(where),
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
      entity as any,
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
