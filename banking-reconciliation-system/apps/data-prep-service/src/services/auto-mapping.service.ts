import { Injectable, Logger } from '@nestjs/common';

interface ColumnMapping {
  core: {
    date: string;  // Source column name
    amount: string;
    description: string;
  };
  optional: {
    txnType?: string;
    refNumber?: string;
    payerPayee?: string;
    currency?: string;
  };
  metadata: Record<string, string>;  // Additional columns mapped to metadata
  confidence: number;
}

@Injectable()
export class AutoMappingService {
  private readonly logger = new Logger(AutoMappingService.name);

  /**
   * Automatically create column mapping from detection results
   * Supports per-bank mapping (reusable for multi-bank)
   */
  async autoMapColumns(
    detectionResult: any,
    bankId?: string,
  ): Promise<ColumnMapping> {
    const prefix = bankId ? `[${bankId}]` : '';
    this.logger.log(`${prefix} Creating auto-mapping from detected columns`);

    const { coreFields, optionalFields, additionalColumns, confidence } = detectionResult;

    // Validate core fields are detected
    if (!coreFields.date || !coreFields.amount || !coreFields.description) {
      const missing = [];
      if (!coreFields.date) missing.push('date');
      if (!coreFields.amount) missing.push('amount');
      if (!coreFields.description) missing.push('description');

      throw new Error(
        `${prefix} Cannot create mapping: missing core fields [${missing.join(', ')}]`,
      );
    }

    // Build core mapping
    const coreMapping = {
      date: coreFields.date.name,
      amount: coreFields.amount.name,
      description: coreFields.description.name,
    };

    // Build optional mapping
    const optionalMapping: Record<string, string> = {};
    if (optionalFields.txnType) {
      optionalMapping.txnType = optionalFields.txnType.name;
    }
    if (optionalFields.refNumber) {
      optionalMapping.refNumber = optionalFields.refNumber.name;
    }
    if (optionalFields.payerPayee) {
      optionalMapping.payerPayee = optionalFields.payerPayee.name;
    }
    if (optionalFields.currency) {
      optionalMapping.currency = optionalFields.currency.name;
    }

    // Build metadata mapping (additional columns)
    const metadataMapping: Record<string, string> = {};
    if (additionalColumns && additionalColumns.length > 0) {
      additionalColumns.forEach((col: any) => {
        const key = this.sanitizeColumnName(col.name);
        metadataMapping[key] = col.name;
      });
    }

    const mapping: ColumnMapping = {
      core: coreMapping,
      optional: optionalMapping,
      metadata: metadataMapping,
      confidence,
    };

    this.logger.log(
      `${prefix} Auto-mapping created with ${confidence}% confidence. ` +
      `Core: ${Object.keys(coreMapping).length}, ` +
      `Optional: ${Object.keys(optionalMapping).length}, ` +
      `Metadata: ${Object.keys(metadataMapping).length}`,
    );

    return mapping;
  }

  /**
   * Create mappings for multiple banks
   * Returns array of mappings with bankId
   */
  async autoMapMultipleBanks(
    bankDetectionResults: Array<{ bankId: string; bankName: string; detectionResult: any }>,
  ): Promise<Array<{ bankId: string; bankName: string; mapping: ColumnMapping }>> {
    this.logger.log(`Creating auto-mappings for ${bankDetectionResults.length} banks`);

    const mappings = [];

    for (const bank of bankDetectionResults) {
      try {
        const mapping = await this.autoMapColumns(bank.detectionResult, bank.bankId);
        mappings.push({
          bankId: bank.bankId,
          bankName: bank.bankName,
          mapping,
        });
        this.logger.log(`✓ Mapping created for ${bank.bankName} (${bank.bankId})`);
      } catch (error) {
        this.logger.error(
          `✗ Failed to create mapping for ${bank.bankName} (${bank.bankId}): ${error instanceof Error ? error.message : String(error)}`,
        );
        throw error;
      }
    }

    this.logger.log(`Successfully created ${mappings.length} bank mappings`);
    return mappings;
  }

  /**
   * Validate a mapping configuration
   * Ensures all required fields are mapped
   */
  validateMapping(mapping: ColumnMapping): boolean {
    // Check core fields
    if (!mapping.core.date || !mapping.core.amount || !mapping.core.description) {
      this.logger.error('Invalid mapping: missing core fields');
      return false;
    }

    // Check confidence threshold
    if (mapping.confidence < 50) {
      this.logger.warn(`Low confidence mapping: ${mapping.confidence}%`);
      return false;
    }

    return true;
  }

  /**
   * Sanitize column name for use as metadata key
   * Removes special characters, converts to camelCase
   */
  private sanitizeColumnName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')  // Replace non-alphanumeric with underscore
      .replace(/^_|_$/g, '')         // Remove leading/trailing underscores
      .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());  // camelCase
  }
}
