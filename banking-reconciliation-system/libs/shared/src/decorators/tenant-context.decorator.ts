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
