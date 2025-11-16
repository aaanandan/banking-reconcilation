import { Injectable, Logger } from '@nestjs/common';

interface ColumnDetectionResult {
  coreFields: {
    date: { index: number; name: string; confidence: number } | null;
    amount: { index: number; name: string; confidence: number } | null;
    description: { index: number; name: string; confidence: number } | null;
  };
  optionalFields: {
    txnType?: { index: number; name: string; confidence: number };
    refNumber?: { index: number; name: string; confidence: number };
    payerPayee?: { index: number; name: string; confidence: number };
    currency?: { index: number; name: string; confidence: number };
  };
  additionalColumns: Array<{ index: number; name: string }>;
  confidence: number;
}

@Injectable()
export class ColumnDetectionService {
  private readonly logger = new Logger(ColumnDetectionService.name);

  // ═══════════════════════════════════════════════════════════
  // Pattern Keywords for Column Detection
  // ═══════════════════════════════════════════════════════════
  private readonly patterns = {
    date: ['date', 'transaction date', 'txn date', 'value date', 'posting date', 'trans date'],
    amount: ['amount', 'debit', 'credit', 'value', 'transaction amount', 'txn amount', 'sum'],
    description: ['description', 'particulars', 'details', 'narration', 'narrative', 'remarks', 'memo'],
    txnType: ['type', 'transaction type', 'dr/cr', 'debit/credit', 'txn type'],
    refNumber: ['ref', 'reference', 'ref no', 'reference number', 'cheque no', 'check no', 'transaction id', 'txn id'],
    payerPayee: ['payer', 'payee', 'party', 'name', 'counterparty', 'beneficiary'],
    currency: ['currency', 'ccy', 'curr'],
  };

  /**
   * Main method: Detects columns from CSV headers
   * Reusable for multi-bank files with different structures
   */
  async detectColumns(csvData: string[][]): Promise<ColumnDetectionResult> {
    if (!csvData || csvData.length === 0) {
      throw new Error('CSV data is empty');
    }

    const headers = csvData[0].map(h => h.trim().toLowerCase());
    this.logger.log(`Detecting columns from headers: ${JSON.stringify(headers)}`);

    const result: ColumnDetectionResult = {
      coreFields: {
        date: null,
        amount: null,
        description: null,
      },
      optionalFields: {},
      additionalColumns: [],
      confidence: 0,
    };

    // Detect core fields (mandatory)
    result.coreFields.date = this.detectField(headers, this.patterns.date, 'date');
    result.coreFields.amount = this.detectField(headers, this.patterns.amount, 'amount');
    result.coreFields.description = this.detectField(headers, this.patterns.description, 'description');

    // Detect optional fields
    const txnType = this.detectField(headers, this.patterns.txnType, 'txnType');
    if (txnType) result.optionalFields.txnType = txnType;

    const refNumber = this.detectField(headers, this.patterns.refNumber, 'refNumber');
    if (refNumber) result.optionalFields.refNumber = refNumber;

    const payerPayee = this.detectField(headers, this.patterns.payerPayee, 'payerPayee');
    if (payerPayee) result.optionalFields.payerPayee = payerPayee;

    const currency = this.detectField(headers, this.patterns.currency, 'currency');
    if (currency) result.optionalFields.currency = currency;

    // Identify additional columns (not mapped)
    const mappedIndices = new Set<number>();
    if (result.coreFields.date) mappedIndices.add(result.coreFields.date.index);
    if (result.coreFields.amount) mappedIndices.add(result.coreFields.amount.index);
    if (result.coreFields.description) mappedIndices.add(result.coreFields.description.index);
    Object.values(result.optionalFields).forEach(field => mappedIndices.add(field.index));

    headers.forEach((header, index) => {
      if (!mappedIndices.has(index) && header.trim().length > 0) {
        result.additionalColumns.push({ index, name: header });
      }
    });

    // Calculate overall confidence
    result.confidence = this.calculateConfidence(result);

    this.logger.log(`Column detection complete. Confidence: ${result.confidence}%`);
    return result;
  }

  /**
   * Detect a specific field using pattern matching
   */
  private detectField(
    headers: string[],
    patterns: string[],
    fieldName: string,
  ): { index: number; name: string; confidence: number } | null {
    let bestMatch: { index: number; score: number; name: string } | null = null;

    headers.forEach((header, index) => {
      const cleanHeader = header.toLowerCase().trim();

      // Check for exact match
      if (patterns.includes(cleanHeader)) {
        bestMatch = { index, score: 100, name: headers[index] };
        return;
      }

      // Check for partial match
      for (const pattern of patterns) {
        if (cleanHeader.includes(pattern) || pattern.includes(cleanHeader)) {
          const score = this.calculateSimilarity(cleanHeader, pattern);
          if (!bestMatch || score > bestMatch.score) {
            bestMatch = { index, score, name: headers[index] };
          }
        }
      }
    });

    if (bestMatch && bestMatch.score >= 60) {
      this.logger.debug(`Detected ${fieldName} at index ${bestMatch.index} (${bestMatch.name}) with ${bestMatch.score}% confidence`);
      return {
        index: bestMatch.index,
        name: bestMatch.name,
        confidence: bestMatch.score,
      };
    }

    this.logger.warn(`Could not detect ${fieldName} column`);
    return null;
  }

  /**
   * Calculate similarity between two strings (simple algorithm)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 100;

    const editDistance = this.levenshteinDistance(str1, str2);
    return Math.round(((longer.length - editDistance) / longer.length) * 100);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(result: ColumnDetectionResult): number {
    const coreFieldsFound = [
      result.coreFields.date,
      result.coreFields.amount,
      result.coreFields.description,
    ].filter(f => f !== null).length;

    if (coreFieldsFound < 3) {
      return Math.round((coreFieldsFound / 3) * 50); // Max 50% if not all core fields found
    }

    // All core fields found - calculate average confidence
    const avgCoreConfidence = [
      result.coreFields.date?.confidence || 0,
      result.coreFields.amount?.confidence || 0,
      result.coreFields.description?.confidence || 0,
    ].reduce((a, b) => a + b, 0) / 3;

    // Bonus for optional fields
    const optionalFieldsCount = Object.keys(result.optionalFields).length;
    const bonus = Math.min(optionalFieldsCount * 5, 20); // Max 20% bonus

    return Math.round(Math.min(avgCoreConfidence + bonus, 100));
  }
}
