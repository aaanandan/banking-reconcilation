import { Injectable, Logger } from '@nestjs/common';
import { DateRangeDto } from '@app/shared';

interface ColumnMapping {
  core: {
    date: string;
    amount: string;
    description: string;
  };
  optional: {
    txnType?: string;
    refNumber?: string;
    payerPayee?: string;
    currency?: string;
  };
  metadata: Record<string, string>;
}

interface NormalizedTransaction {
  date: string; // ISO format
  amount: number;
  description: string;
  source: 'bank' | 'ledger';
  bankId?: string;
  bankName?: string;
  optional?: {
    txnType?: 'credit' | 'debit';
    refNumber?: string;
    payerPayee?: string;
    currency?: string;
  };
  metadata?: Record<string, any>;
}

interface NormalizationResult {
  normalized: NormalizedTransaction[];
  totalRecords: number;
  filteredRecords: number;
  excludedRecords: number;
  dateRangeApplied: {
    includeAll: boolean;
    fromDate?: string;
    toDate?: string;
  };
}

@Injectable()
export class DataNormalizationService {
  private readonly logger = new Logger(DataNormalizationService.name);

  /**
   * Step 12: Normalize bank transactions with optional date filtering
   */
  async normalizeBankTransactions(
    csvData: string[][],
    columnMapping: ColumnMapping,
    bankId: string,
    bankName: string,
    dateRangeFilter?: DateRangeDto,
  ): Promise<NormalizationResult> {
    this.logger.log(`Normalizing bank transactions for ${bankName} (${bankId})`);

    const normalized: NormalizedTransaction[] = [];
    let excluded = 0;

    // Skip header row
    for (let i = 1; i < csvData.length; i++) {
      const row = csvData[i];

      try {
        // Extract core fields
        const dateValue = row[this.getColumnIndex(csvData[0], columnMapping.core.date)];
        const amountValue = row[this.getColumnIndex(csvData[0], columnMapping.core.amount)];
        const descriptionValue = row[this.getColumnIndex(csvData[0], columnMapping.core.description)];

        if (!dateValue || !amountValue || !descriptionValue) {
          this.logger.warn(`Row ${i + 1}: Missing core fields, skipping`);
          excluded++;
          continue;
        }

        // Parse date
        const parsedDate = this.parseDate(dateValue);
        if (!parsedDate) {
          this.logger.warn(`Row ${i + 1}: Invalid date "${dateValue}", skipping`);
          excluded++;
          continue;
        }

        // Apply date filtering
        if (dateRangeFilter && !this.isDateInRange(parsedDate, dateRangeFilter)) {
          excluded++;
          continue;
        }

        // Parse amount
        const parsedAmount = this.parseAmount(amountValue);
        if (isNaN(parsedAmount)) {
          this.logger.warn(`Row ${i + 1}: Invalid amount "${amountValue}", skipping`);
          excluded++;
          continue;
        }

        // Build normalized transaction
        const transaction: NormalizedTransaction = {
          date: parsedDate.toISOString(),
          amount: parsedAmount,
          description: descriptionValue.trim(),
          source: 'bank',
          bankId,
          bankName,
        };

        // Extract optional fields
        const optional: any = {};
        if (columnMapping.optional.txnType) {
          const typeValue = row[this.getColumnIndex(csvData[0], columnMapping.optional.txnType)];
          if (typeValue) {
            optional.txnType = this.normalizeTxnType(typeValue);
          }
        }
        if (columnMapping.optional.refNumber) {
          const refValue = row[this.getColumnIndex(csvData[0], columnMapping.optional.refNumber)];
          if (refValue) {
            optional.refNumber = refValue.trim();
          }
        }
        if (columnMapping.optional.payerPayee) {
          const payerPayeeValue = row[this.getColumnIndex(csvData[0], columnMapping.optional.payerPayee)];
          if (payerPayeeValue) {
            optional.payerPayee = payerPayeeValue.trim();
          }
        }
        if (columnMapping.optional.currency) {
          const currencyValue = row[this.getColumnIndex(csvData[0], columnMapping.optional.currency)];
          if (currencyValue) {
            optional.currency = currencyValue.trim().toUpperCase();
          }
        }

        if (Object.keys(optional).length > 0) {
          transaction.optional = optional;
        }

        // Extract metadata fields
        const metadata: Record<string, any> = {};
        for (const [key, columnName] of Object.entries(columnMapping.metadata)) {
          const value = row[this.getColumnIndex(csvData[0], columnName)];
          if (value && value.trim()) {
            metadata[key] = value.trim();
          }
        }

        if (Object.keys(metadata).length > 0) {
          transaction.metadata = metadata;
        }

        normalized.push(transaction);
      } catch (error) {
        this.logger.error(`Row ${i + 1}: Error normalizing - ${error instanceof Error ? error.message : String(error)}`);
        excluded++;
      }
    }

    const result: NormalizationResult = {
      normalized,
      totalRecords: csvData.length - 1,
      filteredRecords: normalized.length,
      excludedRecords: excluded,
      dateRangeApplied: {
        includeAll: dateRangeFilter?.includeAll ?? true,
        fromDate: dateRangeFilter?.fromDate,
        toDate: dateRangeFilter?.toDate,
      },
    };

    this.logger.log(
      `Normalized ${normalized.length}/${csvData.length - 1} transactions for ${bankName}. Excluded: ${excluded}`,
    );

    return result;
  }

  /**
   * Normalize ledger transactions with optional date filtering
   */
  async normalizeLedgerTransactions(
    csvData: string[][],
    columnMapping: ColumnMapping,
    dateRangeFilter?: DateRangeDto,
  ): Promise<NormalizationResult> {
    this.logger.log('Normalizing ledger transactions');

    const normalized: NormalizedTransaction[] = [];
    let excluded = 0;

    // Skip header row
    for (let i = 1; i < csvData.length; i++) {
      const row = csvData[i];

      try {
        // Extract core fields
        const dateValue = row[this.getColumnIndex(csvData[0], columnMapping.core.date)];
        const amountValue = row[this.getColumnIndex(csvData[0], columnMapping.core.amount)];
        const descriptionValue = row[this.getColumnIndex(csvData[0], columnMapping.core.description)];

        if (!dateValue || !amountValue || !descriptionValue) {
          this.logger.warn(`Row ${i + 1}: Missing core fields, skipping`);
          excluded++;
          continue;
        }

        // Parse date
        const parsedDate = this.parseDate(dateValue);
        if (!parsedDate) {
          this.logger.warn(`Row ${i + 1}: Invalid date "${dateValue}", skipping`);
          excluded++;
          continue;
        }

        // Apply date filtering
        if (dateRangeFilter && !this.isDateInRange(parsedDate, dateRangeFilter)) {
          excluded++;
          continue;
        }

        // Parse amount
        const parsedAmount = this.parseAmount(amountValue);
        if (isNaN(parsedAmount)) {
          this.logger.warn(`Row ${i + 1}: Invalid amount "${amountValue}", skipping`);
          excluded++;
          continue;
        }

        // Build normalized transaction
        const transaction: NormalizedTransaction = {
          date: parsedDate.toISOString(),
          amount: parsedAmount,
          description: descriptionValue.trim(),
          source: 'ledger',
        };

        // Extract optional fields (same as bank)
        const optional: any = {};
        if (columnMapping.optional.txnType) {
          const typeValue = row[this.getColumnIndex(csvData[0], columnMapping.optional.txnType)];
          if (typeValue) {
            optional.txnType = this.normalizeTxnType(typeValue);
          }
        }
        if (columnMapping.optional.refNumber) {
          const refValue = row[this.getColumnIndex(csvData[0], columnMapping.optional.refNumber)];
          if (refValue) {
            optional.refNumber = refValue.trim();
          }
        }
        if (columnMapping.optional.payerPayee) {
          const payerPayeeValue = row[this.getColumnIndex(csvData[0], columnMapping.optional.payerPayee)];
          if (payerPayeeValue) {
            optional.payerPayee = payerPayeeValue.trim();
          }
        }
        if (columnMapping.optional.currency) {
          const currencyValue = row[this.getColumnIndex(csvData[0], columnMapping.optional.currency)];
          if (currencyValue) {
            optional.currency = currencyValue.trim().toUpperCase();
          }
        }

        if (Object.keys(optional).length > 0) {
          transaction.optional = optional;
        }

        // Extract metadata fields
        const metadata: Record<string, any> = {};
        for (const [key, columnName] of Object.entries(columnMapping.metadata)) {
          const value = row[this.getColumnIndex(csvData[0], columnName)];
          if (value && value.trim()) {
            metadata[key] = value.trim();
          }
        }

        if (Object.keys(metadata).length > 0) {
          transaction.metadata = metadata;
        }

        normalized.push(transaction);
      } catch (error) {
        this.logger.error(`Row ${i + 1}: Error normalizing - ${error instanceof Error ? error.message : String(error)}`);
        excluded++;
      }
    }

    const result: NormalizationResult = {
      normalized,
      totalRecords: csvData.length - 1,
      filteredRecords: normalized.length,
      excludedRecords: excluded,
      dateRangeApplied: {
        includeAll: dateRangeFilter?.includeAll ?? true,
        fromDate: dateRangeFilter?.fromDate,
        toDate: dateRangeFilter?.toDate,
      },
    };

    this.logger.log(
      `Normalized ${normalized.length}/${csvData.length - 1} ledger transactions. Excluded: ${excluded}`,
    );

    return result;
  }

  /**
   * Get column index from header row
   */
  private getColumnIndex(headers: string[], columnName: string): number {
    const index = headers.findIndex(h => h.toLowerCase().trim() === columnName.toLowerCase().trim());
    if (index === -1) {
      throw new Error(`Column "${columnName}" not found in headers`);
    }
    return index;
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

    // Try common formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD-MM-YYYY
    const formats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY or MM/DD/YYYY
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        // Assume DD/MM/YYYY for slash/dash-separated dates (common in Indian banking)
        if (format === formats[0] || format === formats[2]) {
          const day = parseInt(match[1], 10);
          const month = parseInt(match[2], 10) - 1;
          const year = parseInt(match[3], 10);
          const date = new Date(year, month, day);
          if (!isNaN(date.getTime())) return date;
        } else if (format === formats[1]) {
          // YYYY-MM-DD
          const year = parseInt(match[1], 10);
          const month = parseInt(match[2], 10) - 1;
          const day = parseInt(match[3], 10);
          const date = new Date(year, month, day);
          if (!isNaN(date.getTime())) return date;
        }
      }
    }

    return null;
  }

  /**
   * Parse amount from string (handles commas, decimals, negative values)
   */
  private parseAmount(amountStr: string): number {
    if (!amountStr) return NaN;

    // Remove commas and whitespace
    const cleaned = amountStr.replace(/,/g, '').trim();

    // Parse as float
    return parseFloat(cleaned);
  }

  /**
   * Normalize transaction type to 'credit' or 'debit'
   */
  private normalizeTxnType(typeStr: string): 'credit' | 'debit' {
    const normalized = typeStr.toLowerCase().trim();

    if (normalized === 'cr' || normalized === 'credit' || normalized === 'c') {
      return 'credit';
    }

    if (normalized === 'dr' || normalized === 'debit' || normalized === 'd') {
      return 'debit';
    }

    // Default to credit if unclear
    return 'credit';
  }

  /**
   * Check if date is within the specified range
   */
  private isDateInRange(date: Date, dateRangeFilter: DateRangeDto): boolean {
    // If includeAll is true, don't filter by date
    if (dateRangeFilter.includeAll) {
      return true;
    }

    const dateTime = date.getTime();

    // Check fromDate
    if (dateRangeFilter.fromDate) {
      const fromDate = new Date(dateRangeFilter.fromDate);
      if (dateTime < fromDate.getTime()) {
        return false;
      }
    }

    // Check toDate
    if (dateRangeFilter.toDate) {
      const toDate = new Date(dateRangeFilter.toDate);
      if (dateTime > toDate.getTime()) {
        return false;
      }
    }

    return true;
  }
}
