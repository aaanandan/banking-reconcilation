import { Injectable } from '@nestjs/common';
import { ManualClassificationRequestDto, ManualClassificationResponseDto } from './dto/classification.dto';

/**
 * MT-15 Manual Classification Service
 * STEP 60.8: Manual classifier - Allows manual transaction classification
 */
@Injectable()
export class Mt15ManualClassificationService {
  classifyManually(request: ManualClassificationRequestDto): ManualClassificationResponseDto {
    return {
      transactionId: request.transactionId,
      classification: request.classification,
      status: 'classified',
      timestamp: new Date().toISOString(),
    };
  }
}
