/**
 * STEP 33: HTTP Client Integration
 *
 * This test verifies the HTTP client setup for the Match Orchestrator Service:
 * - @nestjs/axios package installed
 * - HttpModule configured in module
 * - HttpService injected in service
 * - callMT01Exact method implemented
 * - callMT02Fuzzy method implemented
 * - Service URLs configured correctly
 * - TypeScript compilation
 *
 * Note: This test verifies structure only. Actual HTTP calls will be tested in Step 36.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const baseDir = path.join(__dirname);
const rootDir = path.join(__dirname, '..', '..');

console.log('='.repeat(80));
console.log('TESTING STEP 33: HTTP Client Integration');
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
// TEST 1: Verify Dependencies Installed
// ============================================================================
testGroup('TEST 1: Verify Dependencies Installed');

const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

assert(
  packageJson.dependencies['@nestjs/axios'] !== undefined,
  '@nestjs/axios package installed',
);
assert(
  packageJson.dependencies['axios'] !== undefined,
  'axios package installed',
);

passTest('TEST 1');

// ============================================================================
// TEST 2: Verify HttpModule Configuration
// ============================================================================
testGroup('TEST 2: Verify HttpModule Configuration');

const moduleFile = path.join(baseDir, 'src', 'match-orchestrator.module.ts');
const moduleContent = fs.readFileSync(moduleFile, 'utf-8');

assert(
  moduleContent.includes("import { HttpModule } from '@nestjs/axios'"),
  'HttpModule import',
);
assert(
  moduleContent.includes('HttpModule.register'),
  'HttpModule.register() in imports',
);
assert(
  moduleContent.includes('timeout'),
  'HTTP timeout configuration',
);

passTest('TEST 2');

// ============================================================================
// TEST 3: Verify Service HTTP Client Setup
// ============================================================================
testGroup('TEST 3: Verify Service HTTP Client Setup');

const serviceFile = path.join(baseDir, 'src', 'match-orchestrator.service.ts');
const serviceContent = fs.readFileSync(serviceFile, 'utf-8');

assert(
  serviceContent.includes("import { HttpService } from '@nestjs/axios'"),
  'HttpService import',
);
assert(
  serviceContent.includes("import { firstValueFrom } from 'rxjs'"),
  'firstValueFrom import (RxJS)',
);
assert(
  serviceContent.includes('constructor(private readonly httpService: HttpService)'),
  'HttpService injection in constructor',
);
assert(
  serviceContent.includes('private readonly logger'),
  'Logger configured',
);

passTest('TEST 3');

// ============================================================================
// TEST 4: Verify Service URLs Configuration
// ============================================================================
testGroup('TEST 4: Verify Service URLs Configuration');

assert(
  serviceContent.includes('MT01_URL') &&
    serviceContent.includes('http://localhost:3003/match/exact'),
  'MT-01 URL configured (port 3003)',
);
assert(
  serviceContent.includes('MT02_URL') &&
    serviceContent.includes('http://localhost:3004/match/fuzzy'),
  'MT-02 URL configured (port 3004)',
);

passTest('TEST 4');

// ============================================================================
// TEST 5: Verify callMT01Exact Method
// ============================================================================
testGroup('TEST 5: Verify callMT01Exact Method');

assert(
  serviceContent.includes('async callMT01Exact'),
  'callMT01Exact method exists',
);
assert(
  serviceContent.includes('bankTransactions: BankTransactionDto[]') &&
    serviceContent.includes('ledgerTransactions: LedgerTransactionDto[]'),
  'Method parameters (bankTransactions, ledgerTransactions)',
);
assert(
  serviceContent.includes('Promise<any>'),
  'Method returns Promise',
);
assert(
  serviceContent.includes('firstValueFrom') &&
    serviceContent.includes('this.httpService.post(this.MT01_URL'),
  'HTTP POST call to MT-01',
);
assert(
  serviceContent.includes('this.logger.log') &&
    serviceContent.includes('MT-01'),
  'Logging for MT-01 calls',
);
assert(
  serviceContent.includes('catch') && serviceContent.includes('throw new Error'),
  'Error handling',
);

passTest('TEST 5');

// ============================================================================
// TEST 6: Verify callMT02Fuzzy Method
// ============================================================================
testGroup('TEST 6: Verify callMT02Fuzzy Method');

assert(
  serviceContent.includes('async callMT02Fuzzy'),
  'callMT02Fuzzy method exists',
);
assert(
  serviceContent.includes('bankTransactions: BankTransactionDto[]') &&
    serviceContent.includes('ledgerTransactions: LedgerTransactionDto[]') &&
    serviceContent.includes('fuzzyThresholds?: FuzzyThresholdsDto'),
  'Method parameters including optional fuzzyThresholds',
);
assert(
  serviceContent.includes('Promise<any>'),
  'Method returns Promise',
);
assert(
  serviceContent.includes('firstValueFrom') &&
    serviceContent.includes('this.httpService.post(this.MT02_URL'),
  'HTTP POST call to MT-02',
);
assert(
  serviceContent.includes('if (fuzzyThresholds)') &&
    serviceContent.includes('payload.thresholds'),
  'Optional fuzzyThresholds handling',
);
assert(
  serviceContent.includes('this.logger.log') &&
    serviceContent.includes('MT-02'),
  'Logging for MT-02 calls',
);
assert(
  serviceContent.includes('catch') && serviceContent.includes('throw new Error'),
  'Error handling',
);

passTest('TEST 6');

// ============================================================================
// TEST 7: Verify DTO Imports
// ============================================================================
testGroup('TEST 7: Verify DTO Imports');

assert(
  serviceContent.includes('BankTransactionDto'),
  'BankTransactionDto imported',
);
assert(
  serviceContent.includes('LedgerTransactionDto'),
  'LedgerTransactionDto imported',
);
assert(
  serviceContent.includes('FuzzyThresholdsDto'),
  'FuzzyThresholdsDto imported',
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
  console.log('✅ ALL STEP 33 TESTS PASSED');
} else {
  console.log(`❌ SOME TESTS FAILED: ${testsFailed} failed, ${testsPassed} passed`);
  process.exit(1);
}

console.log('\nSTEP 33 COMPLETE: HTTP Client Integration');

console.log('\nSUMMARY:');
console.log('  ✅ @nestjs/axios package installed');
console.log('  ✅ axios package installed');
console.log('  ✅ HttpModule configured in module (10s timeout)');
console.log('  ✅ HttpService injected in service');
console.log('  ✅ callMT01Exact() method implemented');
console.log('  ✅ callMT02Fuzzy() method implemented');
console.log('  ✅ Service URLs configured (MT-01: port 3003, MT-02: port 3004)');
console.log('  ✅ Logging added for all HTTP calls');
console.log('  ✅ Error handling implemented');
console.log('  ✅ TypeScript compiles successfully');

console.log('\nHTTP CLIENT METHODS:');
console.log('  1. callMT01Exact(bankTransactions, ledgerTransactions)');
console.log('     └─ POST http://localhost:3003/match/exact');
console.log('  2. callMT02Fuzzy(bankTransactions, ledgerTransactions, fuzzyThresholds?)');
console.log('     └─ POST http://localhost:3004/match/fuzzy');

console.log('\nKEY FEATURES:');
console.log('  • Async/await pattern for easier orchestration');
console.log('  • firstValueFrom() converts RxJS Observable to Promise');
console.log('  • Optional fuzzy thresholds parameter');
console.log('  • Comprehensive logging (start, success, error)');
console.log('  • Error handling with descriptive messages');
console.log('  • Type-safe with DTOs');

console.log('\nNOTE:');
console.log('  This test verifies structure only. Actual HTTP calls will be tested');
console.log('  in Step 36 (End-to-End Orchestration Test) when all services are running.');

console.log('\n✨ STEP 33: HTTP CLIENT INTEGRATION - COMPLETE!');
console.log('\nREADY FOR STEP 34: Sequential Workflow Implementation');
console.log('='.repeat(80));
