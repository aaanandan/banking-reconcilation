import { Injectable, Logger } from '@nestjs/common';
import { TransactionDto } from '@app/shared';
import {
  StandingOrderGroupDto,
  StandingOrderMatchingRequestDto,
  StandingOrderMatchingResponseDto,
} from './dto/matching.dto';

/**
 * MT-13 Standing Orders Service
 * STEP 60.6: Pattern Matcher - Detects recurring payment patterns
 */
@Injectable()
export class Mt13StandingOrdersService {
  private readonly logger = new Logger(Mt13StandingOrdersService.name);
  private readonly DEFAULT_MIN_OCCURRENCES = 3;

  findStandingOrders(
    tenantContext: { tenantId: string; userId: string; role: string },
    request: StandingOrderMatchingRequestDto,
  ): StandingOrderMatchingResponseDto {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Running MT-13 matching algorithm`);
    const minOccurrences = request.minOccurrences ?? this.DEFAULT_MIN_OCCURRENCES;
    const patternMap = new Map<string, TransactionDto[]>();

    // Group by description pattern (similar descriptions)
    for (const txn of request.bankTransactions) {
      const pattern = this.extractPattern(txn.description);
      if (!patternMap.has(pattern)) {
        patternMap.set(pattern, []);
      }
      patternMap.get(pattern)!.push(txn);
    }

    const groups: StandingOrderGroupDto[] = [];
    for (const [pattern, txns] of patternMap.entries()) {
      if (txns.length >= minOccurrences) {
        const totalAmount = txns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const avgAmount = totalAmount / txns.length;

        groups.push({
          pattern,
          transactionCount: txns.length,
          transactionIds: txns.map(t => t.id),
          averageAmount: Math.round(avgAmount * 100) / 100,
          confidence: 0.85,
          reasoning: `Recurring pattern detected: ${txns.length} occurrences (min: ${minOccurrences})`,
        });
      }
    }

    return {
      groups,
      totalGroups: groups.length,
      algorithm: 'MT-13-Standing-Orders',
      timestamp: new Date().toISOString(),
      summary: {
        totalProcessed: request.bankTransactions.length,
        standingOrdersFound: groups.length,
        minOccurrences,
      },
    };
  }

  private extractPattern(description: string): string {
    // Normalize description to create pattern
    return description.toLowerCase().trim().replace(/\s+/g, ' ');
  }
}
