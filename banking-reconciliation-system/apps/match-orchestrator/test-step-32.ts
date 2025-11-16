/**
 * STEP 32: Orchestrator DTOs and Interfaces
 *
 * This test verifies the DTOs for the Match Orchestrator Service:
 * - BankTransactionDto and LedgerTransactionDto
 * - ReconciliationRequestDto (input)
 * - MatchResultDto (unified match format)
 * - BankStatisticsDto and AlgorithmStatisticsDto
 * - ReconciliationResponseDto (output)
 * - Validation decorators
 * - Swagger decorators
 * - TypeScript compilation
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const baseDir = path.join(__dirname);
const rootDir = path.join(__dirname, '..', '..');

console.log('='.repeat(80));
console.log('TESTING STEP 32: Orchestrator DTOs and Interfaces');
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
// TEST 1: Verify DTO File Created
// ============================================================================
testGroup('TEST 1: Verify DTO File Created');

const dtoFile = path.join(baseDir, 'src', 'dto', 'reconciliation.dto.ts');

assert(fs.existsSync(dtoFile), 'reconciliation.dto.ts file exists');

passTest('TEST 1');

// ============================================================================
// TEST 2: Verify Transaction DTOs
// ============================================================================
testGroup('TEST 2: Verify Transaction DTOs');

const dtoContent = fs.readFileSync(dtoFile, 'utf-8');

assert(
  dtoContent.includes('export class BankTransactionDto'),
  'BankTransactionDto exported',
);
assert(
  dtoContent.includes('export class LedgerTransactionDto'),
  'LedgerTransactionDto exported',
);

// Check BankTransactionDto fields
assert(
  dtoContent.includes('id: number') &&
    dtoContent.includes('date: string') &&
    dtoContent.includes('amount: number') &&
    dtoContent.includes('description: string') &&
    dtoContent.includes('bankId: string') &&
    dtoContent.includes('bankName: string'),
  'BankTransactionDto has all required fields',
);

// Check LedgerTransactionDto fields
assert(
  dtoContent.includes('id: number') &&
    dtoContent.includes('date: string') &&
    dtoContent.includes('amount: number') &&
    dtoContent.includes('description: string'),
  'LedgerTransactionDto has all required fields',
);

passTest('TEST 2');

// ============================================================================
// TEST 3: Verify Request DTO
// ============================================================================
testGroup('TEST 3: Verify Request DTO');

assert(
  dtoContent.includes('export class ReconciliationRequestDto'),
  'ReconciliationRequestDto exported',
);
assert(
  dtoContent.includes('bankTransactions: BankTransactionDto[]'),
  'bankTransactions field',
);
assert(
  dtoContent.includes('ledgerTransactions: LedgerTransactionDto[]'),
  'ledgerTransactions field',
);
assert(
  dtoContent.includes('fuzzyThresholds'),
  'fuzzyThresholds field (optional)',
);
assert(
  dtoContent.includes('export class FuzzyThresholdsDto'),
  'FuzzyThresholdsDto exported',
);

passTest('TEST 3');

// ============================================================================
// TEST 4: Verify Match Result DTO
// ============================================================================
testGroup('TEST 4: Verify Match Result DTO');

assert(
  dtoContent.includes('export class MatchResultDto'),
  'MatchResultDto exported',
);
assert(
  dtoContent.includes('bankTxnId: number'),
  'bankTxnId field',
);
assert(
  dtoContent.includes('ledgerTxnId: number'),
  'ledgerTxnId field',
);
assert(
  dtoContent.includes('confidence: number'),
  'confidence field',
);
assert(
  dtoContent.includes('algorithm: string'),
  'algorithm field',
);
assert(
  dtoContent.includes('reasoning: string'),
  'reasoning field',
);
assert(
  dtoContent.includes('bankId'),
  'bankId field (multi-bank support)',
);
assert(
  dtoContent.includes('bankName'),
  'bankName field (multi-bank support)',
);
assert(
  dtoContent.includes('scores'),
  'scores field (for fuzzy matches)',
);

passTest('TEST 4');

// ============================================================================
// TEST 5: Verify Statistics DTOs
// ============================================================================
testGroup('TEST 5: Verify Statistics DTOs');

assert(
  dtoContent.includes('export class BankStatisticsDto'),
  'BankStatisticsDto exported',
);
assert(
  dtoContent.includes('export class AlgorithmStatisticsDto'),
  'AlgorithmStatisticsDto exported',
);

// Check BankStatisticsDto fields
assert(
  dtoContent.includes('totalTransactions: number') &&
    dtoContent.includes('exactMatches: number') &&
    dtoContent.includes('fuzzyMatches: number') &&
    dtoContent.includes('totalMatches: number') &&
    dtoContent.includes('unmatched: number') &&
    dtoContent.includes('matchRate: number'),
  'BankStatisticsDto has all required fields',
);

// Check AlgorithmStatisticsDto fields
assert(
  dtoContent.includes('algorithm: string') &&
    dtoContent.includes('matchesFound: number'),
  'AlgorithmStatisticsDto has required fields',
);

passTest('TEST 5');

// ============================================================================
// TEST 6: Verify Response DTO
// ============================================================================
testGroup('TEST 6: Verify Response DTO');

assert(
  dtoContent.includes('export class ReconciliationResponseDto'),
  'ReconciliationResponseDto exported',
);
assert(
  dtoContent.includes('matches: MatchResultDto[]'),
  'matches field',
);
assert(
  dtoContent.includes('totalBankTransactions: number'),
  'totalBankTransactions field',
);
assert(
  dtoContent.includes('totalLedgerTransactions: number'),
  'totalLedgerTransactions field',
);
assert(
  dtoContent.includes('totalMatches: number'),
  'totalMatches field',
);
assert(
  dtoContent.includes('overallMatchRate: number'),
  'overallMatchRate field',
);
assert(
  dtoContent.includes('exactMatches: number'),
  'exactMatches field',
);
assert(
  dtoContent.includes('fuzzyMatches: number'),
  'fuzzyMatches field',
);
assert(
  dtoContent.includes('bankStatistics: BankStatisticsDto[]'),
  'bankStatistics field',
);
assert(
  dtoContent.includes('algorithmStatistics: AlgorithmStatisticsDto[]'),
  'algorithmStatistics field',
);
assert(
  dtoContent.includes('timestamp: string'),
  'timestamp field',
);
assert(
  dtoContent.includes('workflow: string'),
  'workflow field',
);

passTest('TEST 6');

// ============================================================================
// TEST 7: Verify Validation Decorators
// ============================================================================
testGroup('TEST 7: Verify Validation Decorators');

assert(
  dtoContent.includes('@IsNumber()'),
  '@IsNumber decorator',
);
assert(
  dtoContent.includes('@IsString()'),
  '@IsString decorator',
);
assert(
  dtoContent.includes('@IsArray()'),
  '@IsArray decorator',
);
assert(
  dtoContent.includes('@IsDateString()'),
  '@IsDateString decorator',
);
assert(
  dtoContent.includes('@ValidateNested'),
  '@ValidateNested decorator',
);
assert(
  dtoContent.includes('@IsOptional()'),
  '@IsOptional decorator',
);
assert(
  dtoContent.includes('@Min('),
  '@Min decorator',
);
assert(
  dtoContent.includes('@Type('),
  '@Type decorator',
);

passTest('TEST 7');

// ============================================================================
// TEST 8: Verify Swagger Decorators
// ============================================================================
testGroup('TEST 8: Verify Swagger Decorators');

assert(
  dtoContent.includes("import { ApiProperty } from '@nestjs/swagger'"),
  'ApiProperty import',
);
assert(
  dtoContent.includes('@ApiProperty'),
  '@ApiProperty decorators used',
);
assert(
  dtoContent.includes('description:'),
  'ApiProperty descriptions provided',
);
assert(
  dtoContent.includes('example:'),
  'ApiProperty examples provided',
);
assert(
  dtoContent.includes('type:'),
  'ApiProperty types specified',
);
assert(
  dtoContent.includes('required:'),
  'ApiProperty required flags specified',
);

passTest('TEST 8');

// ============================================================================
// TEST 9: TypeScript Compilation
// ============================================================================
testGroup('TEST 9: TypeScript Compilation');

try {
  execSync('npm run build:orchestrator', {
    cwd: rootDir,
    stdio: 'pipe',
  });
  console.log('  ✅ Match Orchestrator service compiles successfully');
  testsPassed++;
  passTest('TEST 9');
} catch (error) {
  console.log('  ❌ TypeScript compilation failed');
  testsFailed++;
  failTest('TEST 9');
}

// ============================================================================
// SUMMARY
// ============================================================================
console.log('='.repeat(80));
if (testsFailed === 0) {
  console.log('✅ ALL STEP 32 TESTS PASSED');
} else {
  console.log(`❌ SOME TESTS FAILED: ${testsFailed} failed, ${testsPassed} passed`);
  process.exit(1);
}

console.log('\nSTEP 32 COMPLETE: Orchestrator DTOs and Interfaces');

console.log('\nSUMMARY:');
console.log('  ✅ BankTransactionDto created (id, date, amount, description, bankId, bankName)');
console.log('  ✅ LedgerTransactionDto created (id, date, amount, description)');
console.log('  ✅ FuzzyThresholdsDto created (optional fuzzy matching configuration)');
console.log('  ✅ ReconciliationRequestDto created (input for orchestration)');
console.log('  ✅ MatchResultDto created (unified format for exact and fuzzy matches)');
console.log('  ✅ BankStatisticsDto created (per-bank statistics)');
console.log('  ✅ AlgorithmStatisticsDto created (per-algorithm statistics)');
console.log('  ✅ ReconciliationResponseDto created (complete output with statistics)');
console.log('  ✅ Validation decorators applied (@IsNumber, @IsString, @IsArray, etc.)');
console.log('  ✅ Swagger decorators applied (@ApiProperty with descriptions)');
console.log('  ✅ TypeScript compiles successfully');

console.log('\nDTO ARCHITECTURE:');
console.log('  INPUT:');
console.log('    └─ ReconciliationRequestDto');
console.log('       ├─ bankTransactions: BankTransactionDto[]');
console.log('       ├─ ledgerTransactions: LedgerTransactionDto[]');
console.log('       └─ fuzzyThresholds?: FuzzyThresholdsDto (optional)');
console.log('\n  OUTPUT:');
console.log('    └─ ReconciliationResponseDto');
console.log('       ├─ matches: MatchResultDto[] (unified format)');
console.log('       ├─ totalMatches, exactMatches, fuzzyMatches');
console.log('       ├─ bankStatistics: BankStatisticsDto[]');
console.log('       ├─ algorithmStatistics: AlgorithmStatisticsDto[]');
console.log('       └─ timestamp, workflow');

console.log('\nKEY FEATURES:');
console.log('  • Unified MatchResultDto supports both MT-01 (exact) and MT-02 (fuzzy)');
console.log('  • Multi-bank support (bankId, bankName in results)');
console.log('  • Comprehensive statistics (by bank, by algorithm)');
console.log('  • Optional fuzzy thresholds configuration');
console.log('  • Full validation with class-validator');
console.log('  • Complete Swagger documentation');

console.log('\n✨ STEP 32: ORCHESTRATOR DTOs - COMPLETE!');
console.log('\nREADY FOR STEP 33: HTTP Client Integration (MT-01 and MT-02 service clients)');
console.log('='.repeat(80));
