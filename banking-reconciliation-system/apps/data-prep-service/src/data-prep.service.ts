import { Injectable, Logger } from '@nestjs/common';
import { ColumnDetectionService } from './services/column-detection.service';
import { DateRangeService } from './services/date-range.service';
import { AutoMappingService } from './services/auto-mapping.service';
import { DataNormalizationService } from './services/data-normalization.service';
import { MultiFilesAnalysisResponseDto, BankFileAnalysisDto } from '@app/shared';
import * as Papa from 'papaparse';

interface ParsedBankFile {
  bankId: string;
  bankName: string;
  filename: string;
  csvData: string[][];
}

@Injectable()
export class DataPrepService {
  private readonly logger = new Logger(DataPrepService.name);

  constructor(
    private readonly columnDetection: ColumnDetectionService,
    private readonly dateRange: DateRangeService,
    private readonly autoMapping: AutoMappingService,
    private readonly normalization: DataNormalizationService,
  ) {}

  getHello(): string {
    return 'Data Prep Service is running!';
  }

  /**
   * Step 11: Analyze multiple bank files and ledger file
   * Returns comprehensive analysis with column detection, date ranges, and auto-mappings
   */
  async analyzeMultiBankFiles(
    bankFiles: Express.Multer.File[],
    ledgerFile: Express.Multer.File,
  ): Promise<MultiFilesAnalysisResponseDto> {
    this.logger.log(`Analyzing ${bankFiles.length} bank files and 1 ledger file`);

    // Parse all CSV files
    const parsedBankFiles = await this.parseBankFiles(bankFiles);
    const parsedLedgerFile = await this.parseLedgerFile(ledgerFile);

    // Analyze each bank file
    const bankAnalysisResults: BankFileAnalysisDto[] = [];
    const bankDetectionResults: Array<{ bankId: string; bankName: string; detectionResult: any }> = [];

    for (const bankFile of parsedBankFiles) {
      this.logger.log(`Analyzing bank file: ${bankFile.filename} (${bankFile.bankId})`);

      // 1. Detect columns
      const columnDetectionResult = await this.columnDetection.detectColumns(bankFile.csvData);

      // 2. Parse transactions for date range analysis
      const bankTransactions = this.extractTransactions(bankFile.csvData, columnDetectionResult);

      // 3. Detect date range
      const dateRangeResult = await this.dateRange.detectBankDateRange(
        bankTransactions,
        bankFile.bankId,
      );

      // 4. Create auto-mapping
      const autoMappingResult = await this.autoMapping.autoMapColumns(
        columnDetectionResult,
        bankFile.bankId,
      );

      // Build analysis result
      bankAnalysisResults.push({
        bankId: bankFile.bankId,
        bankName: bankFile.bankName,
        filename: bankFile.filename,
        totalRows: bankFile.csvData.length - 1, // Exclude header
        columnDetection: columnDetectionResult,
        dateRange: {
          earliest: dateRangeResult.earliest.toISOString(),
          latest: dateRangeResult.latest.toISOString(),
          totalTransactions: dateRangeResult.totalTransactions,
          hasGaps: dateRangeResult.hasGaps,
        },
        autoMapping: autoMappingResult,
      });

      // Store for multi-bank mapping
      bankDetectionResults.push({
        bankId: bankFile.bankId,
        bankName: bankFile.bankName,
        detectionResult: columnDetectionResult,
      });
    }

    // Analyze ledger file
    this.logger.log(`Analyzing ledger file: ${parsedLedgerFile.filename}`);

    const ledgerColumnDetection = await this.columnDetection.detectColumns(
      parsedLedgerFile.csvData,
    );
    const ledgerTransactions = this.extractTransactions(
      parsedLedgerFile.csvData,
      ledgerColumnDetection,
    );
    const ledgerDateRangeResult = await this.dateRange.detectLedgerDateRange(ledgerTransactions);
    const ledgerAutoMapping = await this.autoMapping.autoMapColumns(ledgerColumnDetection);

    // Compare date ranges across all files
    const dateRangeAnalysis = await this.dateRange.analyzeDateRanges(
      parsedBankFiles.map(bf => ({
        bankId: bf.bankId,
        transactions: this.extractTransactions(
          bf.csvData,
          bankAnalysisResults.find(br => br.bankId === bf.bankId)!.columnDetection,
        ),
      })),
      ledgerTransactions,
    );

    // Calculate summary
    const totalBankTransactions = bankAnalysisResults.reduce(
      (sum, bf) => sum + bf.totalRows,
      0,
    );
    const allMappingsValid = bankAnalysisResults.every(
      bf => this.autoMapping.validateMapping(bf.autoMapping),
    );
    const averageConfidence =
      bankAnalysisResults.reduce((sum, bf) => sum + bf.autoMapping.confidence, 0) /
      bankAnalysisResults.length;

    const response: MultiFilesAnalysisResponseDto = {
      bankFiles: bankAnalysisResults,
      ledgerFile: {
        filename: parsedLedgerFile.filename,
        totalRows: parsedLedgerFile.csvData.length - 1,
        columnDetection: ledgerColumnDetection,
        dateRange: {
          earliest: ledgerDateRangeResult.earliest.toISOString(),
          latest: ledgerDateRangeResult.latest.toISOString(),
          totalTransactions: ledgerDateRangeResult.totalTransactions,
          hasGaps: ledgerDateRangeResult.hasGaps,
        },
        autoMapping: ledgerAutoMapping,
      },
      dateRangeAnalysis,
      summary: {
        totalBankFiles: bankFiles.length,
        totalBankTransactions,
        totalLedgerTransactions: parsedLedgerFile.csvData.length - 1,
        allMappingsValid,
        averageConfidence: Math.round(averageConfidence),
        readyForReconciliation: allMappingsValid && !dateRangeAnalysis.hasDateMismatch,
      },
    };

    this.logger.log(
      `Analysis complete. Ready for reconciliation: ${response.summary.readyForReconciliation}`,
    );

    return response;
  }

  /**
   * Parse bank CSV files from uploaded files
   */
  private async parseBankFiles(files: Express.Multer.File[]): Promise<ParsedBankFile[]> {
    const parsedFiles: ParsedBankFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const csvData = await this.parseCSV(file.buffer.toString('utf-8'));

      // Extract bank name from filename (e.g., "HDFC_Statement.csv" -> "HDFC")
      const bankName = this.extractBankNameFromFilename(file.originalname);
      const bankId = `bank_${i + 1}`;

      parsedFiles.push({
        bankId,
        bankName,
        filename: file.originalname,
        csvData,
      });

      this.logger.log(
        `Parsed bank file: ${file.originalname} -> ${bankId} (${bankName}), ${csvData.length} rows`,
      );
    }

    return parsedFiles;
  }

  /**
   * Parse ledger CSV file from uploaded file
   */
  private async parseLedgerFile(
    file: Express.Multer.File,
  ): Promise<{ filename: string; csvData: string[][] }> {
    const csvData = await this.parseCSV(file.buffer.toString('utf-8'));

    this.logger.log(`Parsed ledger file: ${file.originalname}, ${csvData.length} rows`);

    return {
      filename: file.originalname,
      csvData,
    };
  }

  /**
   * Parse CSV content using papaparse
   */
  private async parseCSV(csvContent: string): Promise<string[][]> {
    return new Promise((resolve, reject) => {
      Papa.parse(csvContent, {
        complete: (results) => {
          resolve(results.data as string[][]);
        },
        error: (error: Error) => {
          reject(error);
        },
        skipEmptyLines: true,
      });
    });
  }

  /**
   * Extract bank name from filename
   * Examples: "HDFC_Statement.csv" -> "HDFC", "icici-bank.csv" -> "ICICI"
   */
  private extractBankNameFromFilename(filename: string): string {
    // Remove file extension
    const nameWithoutExt = filename.replace(/\.(csv|CSV)$/, '');

    // Extract first word (assuming format: "BankName_Something.csv")
    const parts = nameWithoutExt.split(/[_\-\s]/);
    const bankName = parts[0].toUpperCase();

    return bankName || 'UNKNOWN';
  }

  /**
   * Extract transaction data from CSV using column detection results
   */
  private extractTransactions(csvData: string[][], columnDetection: any): any[] {
    const transactions: any[] = [];

    // Skip header row
    for (let i = 1; i < csvData.length; i++) {
      const row = csvData[i];

      const transaction: any = {};

      // Extract date
      if (columnDetection.coreFields.date) {
        transaction.date = row[columnDetection.coreFields.date.index];
      }

      // Extract amount
      if (columnDetection.coreFields.amount) {
        transaction.amount = row[columnDetection.coreFields.amount.index];
      }

      // Extract description
      if (columnDetection.coreFields.description) {
        transaction.description = row[columnDetection.coreFields.description.index];
      }

      transactions.push(transaction);
    }

    return transactions;
  }

  // Data validation and preparation will be implemented in Step 12
  async validateAndPrepareData(data: any) {
    // Implementation coming in Step 12
    return { message: 'Data preparation not yet implemented' };
  }
}
