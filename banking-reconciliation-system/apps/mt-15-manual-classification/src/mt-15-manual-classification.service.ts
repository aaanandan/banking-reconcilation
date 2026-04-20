import { Injectable, Logger } from '@nestjs/common';
import { ManualClassificationRequestDto, ManualClassificationResponseDto } from './dto/classification.dto';

/**
 * MT-15 Manual Classification Service
 * STEP 60.8: Manual classifier - Allows manual transaction classification
 */
@Injectable()
export class Mt15ManualClassificationService {
  private readonly logger = new Logger(Mt15ManualClassificationService.name);

  classifyManually(
    tenantContext: { tenantId: string; userId: string; role: string },
    request: ManualClassificationRequestDto,
  ): ManualClassificationResponseDto {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Running MT-15 matching algorithm`);
    return {
      transactionId: request.transactionId,
      classification: request.classification,
      status: 'classified',
      timestamp: new Date().toISOString(),
    };
  }
}
