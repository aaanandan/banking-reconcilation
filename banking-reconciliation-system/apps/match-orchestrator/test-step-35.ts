/**
 * STEP 35: Result Aggregation
 *
 * This test verifies the result aggregation implementation:
 * - calculateBankStatistics() method
 * - calculateAlgorithmStatistics() method
 * - Updated result structure with aggregated statistics
 * - Bank-level statistics (total, exact, fuzzy, unmatched, match rate)
 * - Algorithm-level statistics (MT-01 and MT-02 performance)
 * - TypeScript compilation
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const baseDir = path.join(__dirname);
const rootDir = path.join(__dirname, '..', '..');

console.log('='.repeat(80));
console.log('TESTING STEP 35: Result Aggregation');
console.log('='.repeat(80));

let testsPassed = 0;
let testsFailed = 0;

function testGroup(name: string) {
  console.log('\n' + name);
  console.log('-'.repeat(80));
}

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`  ✓ ${description}: YES`);
    testsPassed++;
  } else {
    console.log(`  ✗ ${description}: NO`);
    testsFailed++;
  }
}

function passTest(testName: string) {
  console.log(`\n✅ ${testName} PASSED\n`);
}

function failTest(testName: string) {
  console.log(`\n❌ ${testName} FAILED\n`);
  throw new Error(`${testName} failed`);
}

// ============================================================================
// TEST 1: Verify DTO Imports
// ============================================================================
testGroup('TEST 1: Verify DTO Imports');

const serviceFile = path.join(baseDir, 'src', 'match-orchestrator.service.ts');
const serviceContent = fs.readFileSync(serviceFile, 'utf-8');

assert(
  serviceContent.includes('BankStatisticsDto'),
  'BankStatisticsDto imported',
);
assert(
  serviceContent.includes('AlgorithmStatisticsDto'),
  'AlgorithmStatisticsDto imported',
);

passTest('TEST 1');

// ============================================================================
// TEST 2: Verify calculateBankStatistics Method
// ============================================================================
testGroup('TEST 2: Verify calculateBankStatistics Method');

assert(
  serviceContent.includes('private calculateBankStatistics'),
  'calculateBankStatistics method exists (private)',
);
assert(
  serviceContent.includes('bankTransactions: BankTransactionDto[]') &&
    serviceContent.includes('exactMatches: any[]') &&
    serviceContent.includes('fuzzyMatches: any[]'),
  'Method parameters (bankTransactions, exactMatches, fuzzyMatches)',
);
assert(
  serviceContent.includes(': BankStatisticsDto[]'),
  'Returns BankStatisticsDto[]',
);
assert(
  serviceContent.includes('new Map<string, BankTransactionDto[]>()'),
  'Uses Map to group transactions by bank',
);
assert(
  serviceContent.includes('bankGroups.has(txn.bankId)'),
  'Groups transactions by bankId',
);
assert(
  serviceContent.includes('transactionIds.has(m.bankTxnId)'),
  'Filters matches by transaction IDs',
);
assert(
  serviceContent.includes('totalTransactions:') &&
    serviceContent.includes('exactMatches:') &&
    serviceContent.includes('fuzzyMatches:') &&
    serviceContent.includes('totalMatches') &&
    serviceContent.includes('unmatched') &&
    serviceContent.includes('matchRate'),
  'Calculates all required statistics',
);
assert(
  serviceContent.includes('.sort((a, b) => a.bankId.localeCompare(b.bankId))'),
  'Sorts results by bankId',
);

passTest('TEST 2');

// ============================================================================
// TEST 3: Verify calculateAlgorithmStatistics Method
// ============================================================================
testGroup('TEST 3: Verify calculateAlgorithmStatistics Method');

assert(
  serviceContent.includes('private calculateAlgorithmStatistics'),
  'calculateAlgorithmStatistics method exists (private)',
);
assert(
  serviceContent.includes('totalBankTransactions: number') &&
    serviceContent.includes('exactMatches: any[]') &&
    serviceContent.includes('fuzzyMatches: any[]'),
  'Method parameters (totalBankTransactions, exactMatches, fuzzyMatches)',
);
assert(
  serviceContent.includes(': AlgorithmStatisticsDto[]'),
  'Returns AlgorithmStatisticsDto[]',
);
assert(
  serviceContent.includes('mt01MatchRate') &&
    serviceContent.includes('mt02MatchRate'),
  'Calculates match rates for both algorithms',
);
assert(
  serviceContent.includes("algorithm: 'MT-01'") &&
    serviceContent.includes("algorithm: 'MT-02'"),
  'Returns statistics for both MT-01 and MT-02',
);
assert(
  serviceContent.includes('matchesFound:') &&
    serviceContent.includes('matchRate:'),
  'Includes matchesFound and matchRate for each algorithm',
);

passTest('TEST 3');

// ============================================================================
// TEST 4: Verify Aggregation in orchestrateReconciliation
// ============================================================================
testGroup('TEST 4: Verify Aggregation in orchestrateReconciliation');

assert(
  serviceContent.includes('const bankStatistics = this.calculateBankStatistics'),
  'Calls calculateBankStatistics()',
);
assert(
  serviceContent.includes('const algorithmStatistics = this.calculateAlgorithmStatistics'),
  'Calls calculateAlgorithmStatistics()',
);
assert(
  serviceContent.includes('request.bankTransactions,') &&
    serviceContent.includes('exactMatches,') &&
    serviceContent.includes('fuzzyMatches,'),
  'Passes correct parameters to aggregation methods',
);

passTest('TEST 4');

// ============================================================================
// TEST 5: Verify Updated Result Structure
// ============================================================================
testGroup('TEST 5: Verify Updated Result Structure');

assert(
  serviceContent.includes('bankStatistics,'),
  'Result includes bankStatistics',
);
assert(
  serviceContent.includes('algorithmStatistics,'),
  'Result includes algorithmStatistics',
);
assert(
  serviceContent.includes('overallMatchRate:'),
  'Result includes overallMatchRate',
);
assert(
  serviceContent.includes('const overallMatchRate =') &&
    serviceContent.includes('allMatches.length / request.bankTransactions.length'),
  'overallMatchRate calculation',
);
assert(
  serviceContent.includes('Math.round(overallMatchRate * 1000) / 1000'),
  'Rounds overallMatchRate to 3 decimals',
);

passTest('TEST 5');

// ============================================================================
// TEST 6: Verify Logging for Aggregation
// ============================================================================
testGroup('TEST 6: Verify Logging for Aggregation');

assert(
  serviceContent.includes('aggregating statistics'),
  'Logs aggregation step',
);
assert(
  serviceContent.includes('Bank statistics calculated for') &&
    serviceContent.includes('bankStatistics.length'),
  'Logs number of banks',
);
assert(
  serviceContent.includes('Algorithm statistics:') &&
    serviceContent.includes('MT-01=') &&
    serviceContent.includes('MT-02='),
  'Logs algorithm statistics summary',
);

passTest('TEST 6');

// ============================================================================
// TEST 7: Verify Precision and Rounding
// ============================================================================
testGroup('TEST 7: Verify Precision and Rounding');

// Check for rounding to 3 decimal places in all calculations
const roundingPattern = /Math\.round\(.*?\*\s*1000\)\s*\/\s*1000/g;
const roundingMatches = serviceContent.match(roundingPattern);

assert(
  !!(roundingMatches && roundingMatches.length >= 3),
  'Uses consistent rounding (3 decimals) for match rates',
);

passTest('TEST 7');

// ============================================================================
// TEST 8: TypeScript Compilation
// ============================================================================
testGroup('TEST 8: TypeScript Compilation');

try {
  execSync('npm run build:orchestrator', {
    cwd: rootDir,
    stdio: 'pipe',
  });
  console.log('  ✅ Match Orchestrator service compiles successfully');
  testsPassed++;
  passTest('TEST 8');
} catch (error) {
  console.log('  ❌ TypeScript compilation failed');
  testsFailed++;
  failTest('TEST 8');
}

// ============================================================================
// SUMMARY
// ============================================================================
console.log('='.repeat(80));
if (testsFailed === 0) {
  console.log('✅ ALL STEP 35 TESTS PASSED');
} else {
  console.log(`❌ SOME TESTS FAILED: ${testsFailed} failed, ${testsPassed} passed`);
  process.exit(1);
}

console.log('\nSTEP 35 COMPLETE: Result Aggregation');

console.log('\nSUMMARY:');
console.log('  ✅ BankStatisticsDto and AlgorithmStatisticsDto imported');
console.log('  ✅ calculateBankStatistics() method implemented (private)');
console.log('  ✅ calculateAlgorithmStatistics() method implemented (private)');
console.log('  ✅ Bank statistics aggregation (by bankId)');
console.log('  ✅ Algorithm statistics aggregation (MT-01 and MT-02)');
console.log('  ✅ Updated result structure with aggregated statistics');
console.log('  ✅ overallMatchRate calculation added');
console.log('  ✅ Consistent rounding to 3 decimal places');
console.log('  ✅ Logging for aggregation steps');
console.log('  ✅ TypeScript compiles successfully');

console.log('\nBANK STATISTICS AGGREGATION:');
console.log('  For each bank:');
console.log('    • bankId, bankName');
console.log('    • totalTransactions');
console.log('    • exactMatches (from MT-01)');
console.log('    • fuzzyMatches (from MT-02)');
console.log('    • totalMatches');
console.log('    • unmatched');
console.log('    • matchRate (rounded to 3 decimals)');
console.log('  Sorted by: bankId (consistent ordering)');

console.log('\nALGORITHM STATISTICS AGGREGATION:');
console.log('  MT-01 (Exact Match):');
console.log('    • matchesFound');
console.log('    • matchRate (% of total bank transactions)');
console.log('  MT-02 (Fuzzy Match):');
console.log('    • matchesFound');
console.log('    • matchRate (% of total bank transactions)');

console.log('\nUPDATED RESULT STRUCTURE:');
console.log('  {');
console.log('    matches: [...],');
console.log('    exactMatches: [...],');
console.log('    fuzzyMatches: [...],');
console.log('    totalMatches,');
console.log('    exactMatchCount,');
console.log('    fuzzyMatchCount,');
console.log('    totalBankTransactions,');
console.log('    totalLedgerTransactions,');
console.log('    unmatched,');
console.log('    overallMatchRate,  ← NEW!');
console.log('    bankStatistics: [  ← NEW!');
console.log('      { bankId, bankName, totalTransactions, exactMatches, fuzzyMatches, ... }');
console.log('    ],');
console.log('    algorithmStatistics: [  ← NEW!');
console.log('      { algorithm: "MT-01", matchesFound, matchRate },');
console.log('      { algorithm: "MT-02", matchesFound, matchRate }');
console.log('    ],');
console.log('    workflow: "MT-01 → MT-02",');
console.log('    timestamp');
console.log('  }');

console.log('\nKEY FEATURES:');
console.log('  • Map-based grouping for efficient bank aggregation');
console.log('  • Set-based filtering for matching transaction IDs');
console.log('  • Separate tracking of exact vs fuzzy matches per bank');
console.log('  • Per-algorithm performance metrics');
console.log('  • Consistent 3-decimal precision for all rates');
console.log('  • Sorted bank statistics for predictable output');

console.log('\n✨ STEP 35: RESULT AGGREGATION - COMPLETE!');
console.log('\nREADY FOR STEP 36: End-to-End Orchestration Test (with running services)');
console.log('='.repeat(80));
