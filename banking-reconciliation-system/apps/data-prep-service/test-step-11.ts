/**
 * Test Script for Step 11: Multi-File Upload Analysis
 *
 * This script tests the multi-file analysis functionality without requiring
 * a database connection or full NestJS app startup.
 */

import { DataPrepService } from './src/data-prep.service';
import { ColumnDetectionService } from './src/services/column-detection.service';
import { DateRangeService } from './src/services/date-range.service';
import { AutoMappingService } from './src/services/auto-mapping.service';
import { DataNormalizationService } from './src/services/data-normalization.service';
import * as fs from 'fs';
import * as path from 'path';

async function testMultiFileAnalysis() {
  console.log('='.repeat(80));
  console.log('TESTING STEP 11: Multi-File Upload Analysis');
  console.log('='.repeat(80));
  console.log('');

  // Initialize services
  const columnDetection = new ColumnDetectionService();
  const dateRange = new DateRangeService();
  const autoMapping = new AutoMappingService();
  const normalization = new DataNormalizationService();
  const dataPrepService = new DataPrepService(
    columnDetection,
    dateRange,
    autoMapping,
    normalization,
  );

  // Read test CSV files
  const testDataDir = path.join(__dirname, '../../test-data');

  const hdfc = fs.readFileSync(path.join(testDataDir, 'HDFC_Bank.csv'));
  const icici = fs.readFileSync(path.join(testDataDir, 'ICICI_Bank.csv'));
  const ledger = fs.readFileSync(path.join(testDataDir, 'Ledger.csv'));

  // Mock Multer.File objects
  const bankFiles: Express.Multer.File[] = [
    {
      fieldname: 'bankFiles',
      originalname: 'HDFC_Bank.csv',
      encoding: '7bit',
      mimetype: 'text/csv',
      buffer: hdfc,
      size: hdfc.length,
    } as Express.Multer.File,
    {
      fieldname: 'bankFiles',
      originalname: 'ICICI_Bank.csv',
      encoding: '7bit',
      mimetype: 'text/csv',
      buffer: icici,
      size: icici.length,
    } as Express.Multer.File,
  ];

  const ledgerFile: Express.Multer.File = {
    fieldname: 'ledgerFile',
    originalname: 'Ledger.csv',
    encoding: '7bit',
    mimetype: 'text/csv',
    buffer: ledger,
    size: ledger.length,
  } as Express.Multer.File;

  try {
    console.log('📁 Processing files:');
    console.log('  - Bank file 1: HDFC_Bank.csv');
    console.log('  - Bank file 2: ICICI_Bank.csv');
    console.log('  - Ledger file: Ledger.csv');
    console.log('');

    // Call the service
    const result = await dataPrepService.analyzeMultiBankFiles(bankFiles, ledgerFile);

    console.log('✅ ANALYSIS COMPLETE');
    console.log('');
    console.log('-'.repeat(80));
    console.log('RESULTS SUMMARY');
    console.log('-'.repeat(80));
    console.log('');

    // Display bank files analysis
    console.log(`📊 Bank Files Analyzed: ${result.bankFiles.length}`);
    console.log('');

    result.bankFiles.forEach((bank, index) => {
      console.log(`Bank ${index + 1}: ${bank.bankName} (${bank.bankId})`);
      console.log(`  Filename: ${bank.filename}`);
      console.log(`  Total Rows: ${bank.totalRows}`);
      console.log(`  Date Range: ${bank.dateRange.earliest} to ${bank.dateRange.latest}`);
      console.log(`  Transactions: ${bank.dateRange.totalTransactions}`);
      console.log(`  Has Gaps: ${bank.dateRange.hasGaps}`);
      console.log(`  Column Detection Confidence: ${bank.columnDetection.confidence}%`);
      console.log(`  Auto-Mapping Confidence: ${bank.autoMapping.confidence}%`);
      console.log(`  Core Fields Detected:`);
      console.log(`    - Date: ${bank.columnDetection.coreFields.date?.name || 'NOT FOUND'}`);
      console.log(`    - Amount: ${bank.columnDetection.coreFields.amount?.name || 'NOT FOUND'}`);
      console.log(`    - Description: ${bank.columnDetection.coreFields.description?.name || 'NOT FOUND'}`);
      console.log('');
    });

    // Display ledger analysis
    console.log(`📒 Ledger File: ${result.ledgerFile.filename}`);
    console.log(`  Total Rows: ${result.ledgerFile.totalRows}`);
    console.log(`  Date Range: ${result.ledgerFile.dateRange.earliest} to ${result.ledgerFile.dateRange.latest}`);
    console.log(`  Transactions: ${result.ledgerFile.dateRange.totalTransactions}`);
    console.log(`  Has Gaps: ${result.ledgerFile.dateRange.hasGaps}`);
    console.log(`  Column Detection Confidence: ${result.ledgerFile.columnDetection.confidence}%`);
    console.log(`  Auto-Mapping Confidence: ${result.ledgerFile.autoMapping.confidence}%`);
    console.log('');

    // Display date range analysis
    console.log('📅 Date Range Analysis:');
    console.log(`  Bank Date Range: ${result.dateRangeAnalysis.bankDateRange.earliest} to ${result.dateRangeAnalysis.bankDateRange.latest}`);
    console.log(`  Ledger Date Range: ${result.dateRangeAnalysis.ledgerDateRange.earliest} to ${result.dateRangeAnalysis.ledgerDateRange.latest}`);
    console.log(`  Has Date Mismatch: ${result.dateRangeAnalysis.hasDateMismatch}`);
    if (result.dateRangeAnalysis.suggestedRange) {
      console.log(`  Suggested Range: ${result.dateRangeAnalysis.suggestedRange.from} to ${result.dateRangeAnalysis.suggestedRange.to}`);
      console.log(`  Coverage: ${result.dateRangeAnalysis.suggestedRange.coverage}%`);
    }
    console.log('');

    // Display summary
    console.log('📈 Overall Summary:');
    console.log(`  Total Bank Files: ${result.summary.totalBankFiles}`);
    console.log(`  Total Bank Transactions: ${result.summary.totalBankTransactions}`);
    console.log(`  Total Ledger Transactions: ${result.summary.totalLedgerTransactions}`);
    console.log(`  All Mappings Valid: ${result.summary.allMappingsValid}`);
    console.log(`  Average Confidence: ${result.summary.averageConfidence}%`);
    console.log(`  Ready for Reconciliation: ${result.summary.readyForReconciliation}`);
    console.log('');

    console.log('='.repeat(80));
    if (result.summary.readyForReconciliation) {
      console.log('✅ TEST PASSED: System is ready for reconciliation!');
    } else {
      console.log('⚠️  TEST WARNING: System may have issues (check date mismatch or low confidence)');
    }
    console.log('='.repeat(80));

    // Verify expectations
    const allTestsPassed =
      result.bankFiles.length === 2 &&
      result.summary.allMappingsValid &&
      result.summary.averageConfidence >= 50;

    if (allTestsPassed) {
      console.log('');
      console.log('✅ ALL TESTS PASSED');
      process.exit(0);
    } else {
      console.log('');
      console.log('❌ SOME TESTS FAILED');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ TEST FAILED WITH ERROR:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testMultiFileAnalysis();
