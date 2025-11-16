import { Injectable, Logger } from '@nestjs/common';
import { DateRangeAnalysisDto } from '@app/shared';

interface DateRangeResult {
  earliest: Date;
  latest: Date;
  totalTransactions: number;
  dateFormat?: string;
  hasGaps?: boolean;
}

@Injectable()
export class DateRangeService {
  private readonly logger = new Logger(DateRangeService.name);

  /**
   * Detect date range from bank transactions
   */
  async detectBankDateRange(bankTransactions: any[], bankId: string): Promise<DateRangeResult> {
    this.logger.log(`Detecting date range for ${bankId}`);

    if (!bankTransactions || bankTransactions.length === 0) {
      throw new Error(`No transactions found for ${bankId}`);
    }

    const dates = bankTransactions
      .map(txn => this.parseDate(txn.date))
      .filter(date => date !== null)
      .sort((a, b) => a!.getTime() - b!.getTime());

    if (dates.length === 0) {
      throw new Error(`No valid dates found in transactions for ${bankId}`);
    }

    const result: DateRangeResult = {
      earliest: dates[0]!,
      latest: dates[dates.length - 1]!,
      totalTransactions: bankTransactions.length,
      hasGaps: this.detectGaps(dates as Date[]),
    };

    this.logger.log(
      `Date range for ${bankId}: ${result.earliest.toISOString()} to ${result.latest.toISOString()} (${result.totalTransactions} txns)`,
    );

    return result;
  }

  /**
   * Detect date range from ledger transactions
   */
  async detectLedgerDateRange(ledgerTransactions: any[]): Promise<DateRangeResult> {
    this.logger.log('Detecting date range for ledger');

    if (!ledgerTransactions || ledgerTransactions.length === 0) {
      throw new Error('No ledger transactions found');
    }

    const dates = ledgerTransactions
      .map(txn => this.parseDate(txn.date))
      .filter(date => date !== null)
      .sort((a, b) => a!.getTime() - b!.getTime());

    if (dates.length === 0) {
      throw new Error('No valid dates found in ledger transactions');
    }

    const result: DateRangeResult = {
      earliest: dates[0]!,
      latest: dates[dates.length - 1]!,
      totalTransactions: ledgerTransactions.length,
      hasGaps: this.detectGaps(dates as Date[]),
    };

    this.logger.log(
      `Date range for ledger: ${result.earliest.toISOString()} to ${result.latest.toISOString()} (${result.totalTransactions} txns)`,
    );

    return result;
  }

  /**
   * Analyze date ranges across multiple banks and ledger
   * Supports multi-bank reconciliation
   */
  async analyzeDateRanges(
    bankFiles: Array<{ bankId: string; transactions: any[] }>,
    ledgerTransactions: any[],
  ): Promise<DateRangeAnalysisDto> {
    this.logger.log('Analyzing date ranges for multi-bank reconciliation');

    // Get ledger date range
    const ledgerRange = await this.detectLedgerDateRange(ledgerTransactions);

    // Get combined bank date range (across all banks)
    const allBankTransactions = bankFiles.flatMap(bf => bf.transactions);
    const bankRange = await this.detectBankDateRange(allBankTransactions, 'all_banks');

    // Check for mismatches
    const hasDateMismatch = this.checkDateMismatch(bankRange, ledgerRange);

    // Suggest optimal date range
    const suggestedRange = this.suggestDateRange(bankRange, ledgerRange);

    const analysis: DateRangeAnalysisDto = {
      bankDateRange: {
        earliest: bankRange.earliest.toISOString(),
        latest: bankRange.latest.toISOString(),
        totalTransactions: bankRange.totalTransactions,
      },
      ledgerDateRange: {
        earliest: ledgerRange.earliest.toISOString(),
        latest: ledgerRange.latest.toISOString(),
        totalTransactions: ledgerRange.totalTransactions,
      },
      hasDateMismatch,
      suggestedRange: suggestedRange
        ? {
            from: suggestedRange.from.toISOString(),
            to: suggestedRange.to.toISOString(),
            coverage: suggestedRange.coverage,
          }
        : undefined,
    };

    this.logger.log(`Date range analysis complete. Mismatch: ${hasDateMismatch}`);
    return analysis;
  }

  /**
   * Parse date from various formats
   */
  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    // Try ISO format first
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    // Try common formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
    const formats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY or MM/DD/YYYY
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY or MM-DD-YYYY
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        // Assume DD/MM/YYYY for slash-separated dates
        if (format === formats[0]) {
          const day = parseInt(match[1], 10);
          const month = parseInt(match[2], 10) - 1;
          const year = parseInt(match[3], 10);
          const date = new Date(year, month, day);
          if (!isNaN(date.getTime())) return date;
        }
      }
    }

    this.logger.warn(`Could not parse date: ${dateStr}`);
    return null;
  }

  /**
   * Detect if there are significant gaps in transactions
   */
  private detectGaps(dates: Date[]): boolean {
    if (dates.length < 2) return false;

    const avgGap =
      (dates[dates.length - 1].getTime() - dates[0].getTime()) / (dates.length - 1);

    for (let i = 1; i < dates.length; i++) {
      const gap = dates[i].getTime() - dates[i - 1].getTime();
      if (gap > avgGap * 3) {
        // Gap is 3x larger than average
        this.logger.warn(
          `Significant gap detected between ${dates[i - 1].toISOString()} and ${dates[i].toISOString()}`,
        );
        return true;
      }
    }

    return false;
  }

  /**
   * Check if bank and ledger date ranges mismatch
   */
  private checkDateMismatch(
    bankRange: DateRangeResult,
    ledgerRange: DateRangeResult,
  ): boolean {
    const bankStart = bankRange.earliest.getTime();
    const bankEnd = bankRange.latest.getTime();
    const ledgerStart = ledgerRange.earliest.getTime();
    const ledgerEnd = ledgerRange.latest.getTime();

    // Check if ranges don't overlap
    if (bankEnd < ledgerStart || ledgerEnd < bankStart) {
      this.logger.warn('Bank and ledger date ranges do not overlap!');
      return true;
    }

    // Check if one range is significantly larger than the other
    const bankDuration = bankEnd - bankStart;
    const ledgerDuration = ledgerEnd - ledgerStart;
    const durationRatio = Math.max(bankDuration, ledgerDuration) / Math.min(bankDuration, ledgerDuration);

    if (durationRatio > 2) {
      this.logger.warn(
        `Significant duration difference: bank=${bankDuration}ms, ledger=${ledgerDuration}ms`,
      );
      return true;
    }

    return false;
  }

  /**
   * Suggest optimal date range for reconciliation
   */
  private suggestDateRange(
    bankRange: DateRangeResult,
    ledgerRange: DateRangeResult,
  ): { from: Date; to: Date; coverage: number } | null {
    // Find overlapping range
    const overlapStart = new Date(
      Math.max(bankRange.earliest.getTime(), ledgerRange.earliest.getTime()),
    );
    const overlapEnd = new Date(
      Math.min(bankRange.latest.getTime(), ledgerRange.latest.getTime()),
    );

    if (overlapStart > overlapEnd) {
      this.logger.warn('No overlapping date range found');
      return null;
    }

    // Calculate coverage (percentage of total period covered by overlap)
    const totalStart = new Date(
      Math.min(bankRange.earliest.getTime(), ledgerRange.earliest.getTime()),
    );
    const totalEnd = new Date(
      Math.max(bankRange.latest.getTime(), ledgerRange.latest.getTime()),
    );

    const overlapDuration = overlapEnd.getTime() - overlapStart.getTime();
    const totalDuration = totalEnd.getTime() - totalStart.getTime();
    const coverage = Math.round((overlapDuration / totalDuration) * 100);

    return {
      from: overlapStart,
      to: overlapEnd,
      coverage,
    };
  }
}
