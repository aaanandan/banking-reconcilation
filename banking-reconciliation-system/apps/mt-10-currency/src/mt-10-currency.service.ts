import { Injectable } from '@nestjs/common';
import { TransactionDto } from '@app/shared';
import {
  CurrencyClassificationDto,
  CurrencyClassificationRequestDto,
  CurrencyClassificationResponseDto,
} from './dto/classification.dto';

/**
 * MT-10 Currency Conversion Service
 *
 * STEP 60.3: Exception Handler - Identifies currency conversion transactions
 *
 * Purpose:
 * - Identify bank transactions involving currency conversion
 * - Detect exchange rate differences
 * - Common in international transactions and multi-currency accounts
 *
 * Logic:
 * 1. Run AFTER MT-01 & MT-02 on unmatched bank transactions
 * 2. Detect currency conversion indicators:
 *    - Currency-related keywords (conversion, exchange, FX, forex)
 *    - Currency codes in description (USD, EUR, GBP, INR, etc.)
 *    - Exchange rate patterns
 * 3. Extract source and target currencies
 * 4. Mark as: status: 'classified', type: 'currency_conversion'
 *
 * Result:
 * - Transaction removed from "unknown" pool
 * - User sees: "Currency conversion: 1000 USD → 83,000 INR (rate: 83.0)"
 * - Explains why no direct ledger match exists
 */
@Injectable()
export class Mt10CurrencyService {
  // Currency-related keywords
  private readonly CURRENCY_KEYWORDS = [
    'currency',
    'conversion',
    'convert',
    'exchange',
    'exchanged',
    'forex',
    'fx',
    'foreign exchange',
    'rate',
    'exch',
  ];

  // Common currency codes (ISO 4217)
  private readonly CURRENCY_CODES = [
    'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD',
    'INR', 'CNY', 'SGD', 'HKD', 'KRW', 'THB', 'MYR', 'PHP',
    'IDR', 'VND', 'TWD', 'RUB', 'BRL', 'MXN', 'ZAR', 'TRY',
    'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'ILS', 'AED',
  ];

  /**
   * Classify currency conversion transactions
   *
   * Algorithm:
   * 1. Check for currency keywords
   * 2. Extract currency codes from description
   * 3. Detect exchange rate patterns
   * 4. Classify transactions
   */
  classifyCurrencyConversions(
    request: CurrencyClassificationRequestDto,
  ): CurrencyClassificationResponseDto {
    const classifications: CurrencyClassificationDto[] = [];
    const uniqueCurrencies = new Set<string>();

    for (const txn of request.bankTransactions) {
      const classification = this.classifyTransaction(txn);

      if (classification.isCurrencyConversion) {
        classifications.push(classification);
        uniqueCurrencies.add(classification.sourceCurrency);
        uniqueCurrencies.add(classification.targetCurrency);
      }
    }

    return {
      classifications,
      totalCurrencyConversions: classifications.length,
      algorithm: 'MT-10-Currency-Conversion',
      timestamp: new Date().toISOString(),
      summary: {
        totalProcessed: request.bankTransactions.length,
        currencyConversionsFound: classifications.length,
        uniqueCurrencies: Array.from(uniqueCurrencies),
      },
    };
  }

  /**
   * Classify a single transaction
   */
  private classifyTransaction(
    txn: TransactionDto,
  ): CurrencyClassificationDto {
    const hasCurrencyKeywords = this.hasCurrencyKeywords(txn.description);
    const currencies = this.extractCurrencies(txn.description);

    const isCurrencyConversion = hasCurrencyKeywords && currencies.length >= 2;

    let sourceCurrency = 'UNKNOWN';
    let targetCurrency = 'UNKNOWN';
    let exchangeRate = 1.0;
    let confidence = 0.0;

    if (isCurrencyConversion) {
      sourceCurrency = currencies[0];
      targetCurrency = currencies[1];

      // Try to extract exchange rate from description
      exchangeRate = this.extractExchangeRate(txn.description);

      // High confidence if we found both currencies and keywords
      confidence = exchangeRate > 1.0 ? 0.90 : 0.75;
    }

    const reasoning = isCurrencyConversion
      ? `Currency conversion detected: ${sourceCurrency} → ${targetCurrency}. ` +
        `Exchange rate: ${exchangeRate.toFixed(4)}. ` +
        `Keywords found in description.`
      : 'No currency conversion indicators found.';

    return {
      bankTxnId: txn.id,
      isCurrencyConversion,
      sourceCurrency,
      targetCurrency,
      sourceAmount: txn.amount,
      targetAmount: txn.amount * exchangeRate,
      exchangeRate,
      confidence,
      reasoning,
      algorithm: 'MT-10',
      bankId: txn.bankId || 'unknown',
    };
  }

  /**
   * Check if description contains currency keywords
   */
  private hasCurrencyKeywords(description: string): boolean {
    const lowerDesc = description.toLowerCase();
    return this.CURRENCY_KEYWORDS.some((keyword) =>
      lowerDesc.includes(keyword),
    );
  }

  /**
   * Extract currency codes from description
   */
  private extractCurrencies(description: string): string[] {
    const found: string[] = [];
    const upperDesc = description.toUpperCase();

    for (const code of this.CURRENCY_CODES) {
      // Match currency code as whole word
      const regex = new RegExp(`\\b${code}\\b`);
      if (regex.test(upperDesc)) {
        found.push(code);
      }
    }

    return found;
  }

  /**
   * Extract exchange rate from description
   * Looks for patterns like:
   * - "rate 83.5"
   * - "@ 83.5"
   * - "1 USD = 83.5 INR"
   */
  private extractExchangeRate(description: string): number {
    // Pattern 1: "rate X" or "@ X"
    const ratePattern = /(?:rate|@)\s*(\d+\.?\d*)/i;
    const rateMatch = description.match(ratePattern);
    if (rateMatch) {
      return parseFloat(rateMatch[1]);
    }

    // Pattern 2: "= X"
    const equalsPattern = /=\s*(\d+\.?\d*)/;
    const equalsMatch = description.match(equalsPattern);
    if (equalsMatch) {
      return parseFloat(equalsMatch[1]);
    }

    // Default if no rate found
    return 1.0;
  }
}
