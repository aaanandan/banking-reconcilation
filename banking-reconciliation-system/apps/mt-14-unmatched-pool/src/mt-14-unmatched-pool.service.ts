import { Injectable } from '@nestjs/common';
import { UnmatchedPoolRequestDto, UnmatchedPoolResponseDto } from './dto/pool.dto';

/**
 * MT-14 Unmatched Pool Service
 * STEP 60.7: Pool Manager - Manages unmatched transactions
 */
@Injectable()
export class Mt14UnmatchedPoolService {
  getUnmatchedPool(request: UnmatchedPoolRequestDto): UnmatchedPoolResponseDto {
    const unmatched = request.transactions.filter(t => t.status === 'unmatched');

    return {
      unmatchedTransactions: unmatched,
      totalUnmatched: unmatched.length,
      algorithm: 'MT-14-Unmatched-Pool',
      timestamp: new Date().toISOString(),
      summary: {
        totalProcessed: request.transactions.length,
        unmatchedCount: unmatched.length,
      },
    };
  }
}
