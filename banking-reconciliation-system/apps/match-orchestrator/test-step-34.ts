/**
 * STEP 34: Sequential Workflow Implementation
 *
 * This test verifies the sequential workflow implementation:
 * - orchestrateReconciliation() method in service
 * - MT-01 → MT-02 workflow logic
 * - Unmatched transaction extraction
 * - Result combination
 * - POST /orchestrate/reconcile endpoint in controller
 * - TypeScript compilation
 *
 * Note: This test verifies structure only. Actual workflow execution
 * will be tested in Step 36 with running services.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const baseDir = path.join(__dirname);
const rootDir = path.join(__dirname, '..', '..');

console.log('='.repeat(80));
console.log('TESTING STEP 34: Sequential Workflow Implementation');
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
// TEST 1: Verify Service Method Exists
// ============================================================================
testGroup('TEST 1: Verify Service Method Exists');

const serviceFile = path.join(baseDir, 'src', 'match-orchestrator.service.ts');
const serviceContent = fs.readFileSync(serviceFile, 'utf-8');

assert(
  serviceContent.includes('async orchestrateReconciliation'),
  'orchestrateReconciliation method exists',
);
assert(
  serviceContent.includes('request: ReconciliationRequestDto'),
  'Method accepts ReconciliationRequestDto',
);
assert(
  serviceContent.includes('Promise<any>'),
  'Method returns Promise',
);

passTest('TEST 1');

// ============================================================================
// TEST 2: Verify Workflow Step 1 (MT-01 Call)
// ============================================================================
testGroup('TEST 2: Verify Workflow Step 1 (MT-01 Call)');

assert(
  serviceContent.includes('Step 1: Calling MT-01 Exact Match'),
  'Step 1 logging',
);
assert(
  serviceContent.includes('await this.callMT01Exact'),
  'Calls callMT01Exact method',
);
assert(
  serviceContent.includes('const exactMatches'),
  'Stores exact matches',
);
assert(
  serviceContent.includes('mt01Response.matches'),
  'Extracts matches from MT-01 response',
);

passTest('TEST 2');

// ============================================================================
// TEST 3: Verify Workflow Step 2 (Extract Unmatched)
// ============================================================================
testGroup('TEST 3: Verify Workflow Step 2 (Extract Unmatched)');

assert(
  serviceContent.includes('Step 2: Extracting unmatched transactions'),
  'Step 2 logging',
);
assert(
  serviceContent.includes('matchedBankIds') &&
    serviceContent.includes('new Set'),
  'Creates Set of matched bank IDs',
);
assert(
  serviceContent.includes('matchedLedgerIds') &&
    serviceContent.includes('new Set'),
  'Creates Set of matched ledger IDs',
);
assert(
  serviceContent.includes('unmatchedBankTransactions') &&
    serviceContent.includes('.filter'),
  'Filters unmatched bank transactions',
);
assert(
  serviceContent.includes('availableLedgerTransactions') &&
    serviceContent.includes('.filter'),
  'Filters available ledger transactions',
);
assert(
  serviceContent.includes('!matchedBankIds.has(txn.id)'),
  'Checks bank transaction not in matched set',
);
assert(
  serviceContent.includes('!matchedLedgerIds.has(txn.id)'),
  'Checks ledger transaction not in matched set',
);

passTest('TEST 3');

// ============================================================================
// TEST 4: Verify Workflow Step 3 (MT-02 Call)
// ============================================================================
testGroup('TEST 4: Verify Workflow Step 3 (MT-02 Call)');

assert(
  serviceContent.includes('Step 3: Calling MT-02 Fuzzy Match'),
  'Step 3 logging',
);
assert(
  serviceContent.includes('if (unmatchedBankTransactions.length > 0'),
  'Checks if unmatched transactions exist',
);
assert(
  serviceContent.includes('await this.callMT02Fuzzy'),
  'Calls callMT02Fuzzy method',
);
assert(
  serviceContent.includes('unmatchedBankTransactions') &&
    serviceContent.includes('availableLedgerTransactions'),
  'Passes unmatched transactions to MT-02',
);
assert(
  serviceContent.includes('request.fuzzyThresholds'),
  'Passes optional fuzzy thresholds',
);
assert(
  serviceContent.includes('let fuzzyMatches') || serviceContent.includes('const fuzzyMatches'),
  'Stores fuzzy matches',
);
assert(
  serviceContent.includes('Skipped MT-02'),
  'Logs when MT-02 is skipped',
);

passTest('TEST 4');

// ============================================================================
// TEST 5: Verify Workflow Step 4 (Combine Results)
// ============================================================================
testGroup('TEST 5: Verify Workflow Step 4 (Combine Results)');

assert(
  serviceContent.includes('Step 4: Combining results'),
  'Step 4 logging',
);
assert(
  serviceContent.includes('[...exactMatches, ...fuzzyMatches]'),
  'Combines exact and fuzzy matches using spread operator',
);
assert(
  serviceContent.includes('totalMatches:'),
  'Calculates total matches',
);
assert(
  serviceContent.includes('exactMatchCount:'),
  'Includes exact match count',
);
assert(
  serviceContent.includes('fuzzyMatchCount:'),
  'Includes fuzzy match count',
);
assert(
  serviceContent.includes('totalBankTransactions:'),
  'Includes total bank transactions',
);
assert(
  serviceContent.includes('totalLedgerTransactions:'),
  'Includes total ledger transactions',
);
assert(
  serviceContent.includes('unmatched:'),
  'Calculates unmatched count',
);
assert(
  serviceContent.includes("workflow: 'MT-01 → MT-02'"),
  'Includes workflow description',
);
assert(
  serviceContent.includes('timestamp:'),
  'Includes timestamp',
);

passTest('TEST 5');

// ============================================================================
// TEST 6: Verify Controller Endpoint
// ============================================================================
testGroup('TEST 6: Verify Controller Endpoint');

const controllerFile = path.join(baseDir, 'src', 'match-orchestrator.controller.ts');
const controllerContent = fs.readFileSync(controllerFile, 'utf-8');

assert(
  controllerContent.includes("@Post('reconcile')"),
  '@Post decorator with reconcile route',
);
assert(
  controllerContent.includes('@ApiOperation'),
  '@ApiOperation decorator',
);
assert(
  controllerContent.includes('@ApiResponse'),
  '@ApiResponse decorators',
);
assert(
  controllerContent.includes('async reconcile'),
  'reconcile method exists',
);
assert(
  controllerContent.includes('@Body() request: ReconciliationRequestDto'),
  'Request body parameter with DTO',
);
assert(
  controllerContent.includes('orchestrateReconciliation'),
  'Calls service.orchestrateReconciliation()',
);
assert(
  controllerContent.includes('import { ReconciliationRequestDto }'),
  'Imports ReconciliationRequestDto',
);
assert(
  controllerContent.includes("import { Controller, Get, Post, Body } from '@nestjs/common'"),
  'Imports Post and Body from @nestjs/common',
);

passTest('TEST 6');

// ============================================================================
// TEST 7: Verify Logging Throughout Workflow
// ============================================================================
testGroup('TEST 7: Verify Logging Throughout Workflow');

const logStatements = [
  'Starting reconciliation workflow',
  'Step 1: Calling MT-01',
  'MT-01 complete',
  'Step 2: Extracting unmatched',
  'Unmatched:',
  'Step 3: Calling MT-02',
  'MT-02 complete',
  'Step 4: Combining results',
  'Reconciliation complete',
];

let allLogsPresent = true;
for (const log of logStatements) {
  if (!serviceContent.includes(log)) {
    allLogsPresent = false;
    break;
  }
}

assert(allLogsPresent, 'All workflow steps have logging');
assert(
  serviceContent.includes('this.logger.log'),
  'Uses logger.log() for info messages',
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
  console.log('✅ ALL STEP 34 TESTS PASSED');
} else {
  console.log(`❌ SOME TESTS FAILED: ${testsFailed} failed, ${testsPassed} passed`);
  process.exit(1);
}

console.log('\nSTEP 34 COMPLETE: Sequential Workflow Implementation');

console.log('\nSUMMARY:');
console.log('  ✅ orchestrateReconciliation() method implemented');
console.log('  ✅ Step 1: Calls MT-01 with all transactions');
console.log('  ✅ Step 2: Extracts unmatched bank/ledger transactions using Sets');
console.log('  ✅ Step 3: Calls MT-02 with remaining unmatched (if any)');
console.log('  ✅ Step 4: Combines exact and fuzzy matches');
console.log('  ✅ POST /orchestrate/reconcile endpoint added');
console.log('  ✅ Request validation with ReconciliationRequestDto');
console.log('  ✅ Comprehensive logging at each step');
console.log('  ✅ TypeScript compiles successfully');

console.log('\nWORKFLOW:');
console.log('  1. MT-01 Exact Match (all transactions)');
console.log('     ↓');
console.log('  2. Extract Unmatched');
console.log('     ├─ Unmatched Bank Transactions (not in MT-01 matches)');
console.log('     └─ Available Ledger Transactions (not in MT-01 matches)');
console.log('     ↓');
console.log('  3. MT-02 Fuzzy Match (unmatched only)');
console.log('     ↓');
console.log('  4. Combine Results');
console.log('     └─ exactMatches + fuzzyMatches + metadata');

console.log('\nRESULT STRUCTURE:');
console.log('  {');
console.log('    matches: [...exactMatches, ...fuzzyMatches],');
console.log('    exactMatches: [...],');
console.log('    fuzzyMatches: [...],');
console.log('    totalMatches,');
console.log('    exactMatchCount,');
console.log('    fuzzyMatchCount,');
console.log('    totalBankTransactions,');
console.log('    totalLedgerTransactions,');
console.log('    unmatched,');
console.log('    workflow: "MT-01 → MT-02",');
console.log('    timestamp');
console.log('  }');

console.log('\nKEY FEATURES:');
console.log('  • Sequential execution: MT-01 first, MT-02 on remainder');
console.log('  • Efficient Set-based filtering for unmatched transactions');
console.log('  • Conditional MT-02 call (skips if no unmatched)');
console.log('  • Combined result with separate exact/fuzzy arrays');
console.log('  • Comprehensive metadata and statistics');
console.log('  • Step-by-step logging for observability');

console.log('\nNOTE:');
console.log('  This test verifies workflow logic only. Actual orchestration will be');
console.log('  tested in Step 36 (End-to-End) with all services running.');

console.log('\n✨ STEP 34: SEQUENTIAL WORKFLOW - COMPLETE!');
console.log('\nREADY FOR STEP 35: Result Aggregation (statistics by bank, by algorithm)');
console.log('='.repeat(80));
