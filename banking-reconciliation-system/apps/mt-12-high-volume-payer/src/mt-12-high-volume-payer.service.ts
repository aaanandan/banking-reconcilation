import { Injectable, Logger } from '@nestjs/common';
import { TransactionDto } from '@app/shared';
import {
  PayerGroupDto,
  HighVolumeMatchingRequestDto,
  HighVolumeMatchingResponseDto,
} from './dto/matching.dto';

/**
 * MT-12 High-Volume Payer Service
 * STEP 60.5: Pattern Matcher - Groups transactions by frequent payers
 */
@Injectable()
export class Mt12HighVolumePayerService {
  private readonly logger = new Logger(Mt12HighVolumePayerService.name);
  private readonly DEFAULT_VOLUME_THRESHOLD = 5;

  findHighVolumePayers(
    tenantContext: { tenantId: string; userId: string; role: string },
    request: HighVolumeMatchingRequestDto,
  ): HighVolumeMatchingResponseDto {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Running MT-12 matching algorithm`);
    const threshold = request.volumeThreshold ?? this.DEFAULT_VOLUME_THRESHOLD;
    const payerMap = new Map<string, TransactionDto[]>();

    // Group by payer/payee
    for (const txn of request.bankTransactions) {
      const payer = txn.optional?.payerPayee || 'Unknown';
      if (!payerMap.has(payer)) {
        payerMap.set(payer, []);
      }
      payerMap.get(payer)!.push(txn);
    }

    const groups: PayerGroupDto[] = [];
    for (const [payerName, txns] of payerMap.entries()) {
      if (txns.length >= threshold) {
        const totalAmount = txns.reduce((sum, t) => sum + t.amount, 0);
        groups.push({
          payerName,
          transactionCount: txns.length,
          transactionIds: txns.map(t => t.id),
          totalAmount,
          confidence: 0.85,
          reasoning: `High-volume payer: ${txns.length} transactions (threshold: ${threshold})`,
        });
      }
    }

    return {
      groups,
      totalGroups: groups.length,
      algorithm: 'MT-12-High-Volume-Payer',
      timestamp: new Date().toISOString(),
      summary: {
        totalProcessed: request.bankTransactions.length,
        highVolumePayersFound: groups.length,
        volumeThreshold: threshold,
      },
    };
  }
}
