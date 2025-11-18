// apps/auth-service/src/decorators/api-key-scope.decorator.ts

import { SetMetadata } from '@nestjs/common';

export const ApiKeyScope = (scope: string) => SetMetadata('api-key-scope', scope);
