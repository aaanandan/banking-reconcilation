import { Injectable } from '@nestjs/common';
import { TransactionDto } from '@app/shared';

/**
 * MT-01 Exact Match Service
 * Implements exact matching algorithm for transaction reconciliation
 * Matches on: date, amount, description (all must be identical)
 */
@Injectable()
export class Mt01ExactMatchService {
  // Exact match algorithm will be implemented in Step 23
  // bankId awareness will be added in Step 24
  // REST endpoint will be created in Step 25
}
