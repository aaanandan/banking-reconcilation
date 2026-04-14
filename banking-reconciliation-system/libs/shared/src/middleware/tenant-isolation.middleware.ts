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
