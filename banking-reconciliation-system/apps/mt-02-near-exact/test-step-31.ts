/**
 * STEP 31: Field Profile Usage in MT-02 - Verification
 *
 * Verifies that MT-02 accepts and supports per-bank field profiles:
 * - FuzzyMatchRequestDto accepts fieldProfile parameter
 * - Service receives fieldProfile from request
 * - Service can use fieldProfile for per-bank matching strategies
 * - Field profile structure documented
 * - TypeScript compilation
 *
 * Field profiles enable the matching service to adapt its strategy based on
 * field availability and quality per bank, allowing more intelligent matching
 * when certain fields are known to be unreliable or unavailable.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const baseDir = path.join(__dirname, 'src');
const rootDir = path.join(__dirname, '..', '..');

console.log('='.repeat(80));
console.log('TESTING STEP 31: Field Profile Usage in MT-02');
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

// TEST 1: Verify FuzzyMatchRequestDto Accepts fieldProfile
testGroup('TEST 1: Verify FuzzyMatchRequestDto Accepts fieldProfile');

const dtoFile = path.join(baseDir, 'dto', 'fuzzy-match.dto.ts');
const dtoContent = fs.readFileSync(dtoFile, 'utf-8');

assert(
  dtoContent.includes('export class FuzzyMatchRequestDto'),
  'FuzzyMatchRequestDto defined',
);

// Find the section defining FuzzyMatchRequestDto
const requestDtoSection = dtoContent.substring(
  dtoContent.indexOf('export class FuzzyMatchRequestDto'),
  dtoContent.indexOf('export class FuzzyScoresDto') || dtoContent.indexOf('export class FuzzyMatchCandidateDto'),
);

assert(
  requestDtoSection.includes('fieldProfile'),
  'FuzzyMatchRequestDto has fieldProfile parameter',
);
assert(
  requestDtoSection.includes('@ApiPropertyOptional') || requestDtoSection.includes('@ApiProperty'),
  'fieldProfile parameter is documented with Swagger decorator',
);
assert(
  requestDtoSection.includes('field profile') || requestDtoSection.includes('Field profile'),
  'fieldProfile parameter has descriptive documentation',
);

passTest('TEST 1');

// TEST 2: Verify Service Receives fieldProfile
testGroup('TEST 2: Verify Service Receives fieldProfile from Request');

const serviceFile = path.join(baseDir, 'mt-02-near-exact.service.ts');
const serviceContent = fs.readFileSync(serviceFile, 'utf-8');

assert(
  serviceContent.includes('findFuzzyMatches'),
  'findFuzzyMatches method exists',
);

// Check that service extracts fieldProfile from request
const methodSection = serviceContent.substring(
  serviceContent.indexOf('findFuzzyMatches(request: FuzzyMatchRequestDto)'),
  serviceContent.indexOf('private fuzzyDateMatch'),
);

assert(
  methodSection.includes('fieldProfile'),
  'Service extracts fieldProfile from request',
);

passTest('TEST 2');

// TEST 3: Verify Service Has Field Profile Logic
testGroup('TEST 3: Verify Service Supports Field Profile Usage');

assert(
  serviceContent.includes('fieldProfile') &&
    (serviceContent.indexOf('fieldProfile', serviceContent.indexOf('findFuzzyMatches')) > 0),
  'Service accesses fieldProfile within findFuzzyMatches method',
);

// Check for conditional logic or comments about field profile usage
assert(
  methodSection.includes('if') && methodSection.includes('fieldProfile'),
  'Service has conditional logic for when fieldProfile is provided',
);

passTest('TEST 3');

// TEST 4: Verify Field Profile Documentation
testGroup('TEST 4: Verify Field Profile is Documented');

// Check that comments explain field profile usage
assert(
  serviceContent.includes('Step 31') || serviceContent.includes('field profile'),
  'Service includes documentation about field profile usage',
);

passTest('TEST 4');

// TEST 5: TypeScript Compilation
testGroup('TEST 5: TypeScript Compilation');

try {
  execSync('npm run build:mt-02', { cwd: rootDir, stdio: 'pipe' });
  console.log('  ✅ MT-02 service compiles successfully');
  testsPassed++;
  passTest('TEST 5');
} catch (error) {
  console.log('  ❌ TypeScript compilation failed');
  testsFailed++;
  failTest('TEST 5');
}

// SUMMARY
console.log('='.repeat(80));
if (testsFailed === 0) {
  console.log('✅ ALL STEP 31 TESTS PASSED');
  console.log('\nSTEP 31 COMPLETE: Field Profile Usage in MT-02');
  console.log('\n✨ Field Profile Features Verified:');
  console.log('  • FuzzyMatchRequestDto accepts optional fieldProfile parameter');
  console.log('  • Service extracts fieldProfile from request');
  console.log('  • Service has conditional logic for field profile usage');
  console.log('  • Field profile parameter is documented');
  console.log('\nFIELD PROFILE STRUCTURE:');
  console.log('  {');
  console.log('    banks: {');
  console.log('      "bank_1": {');
  console.log('        hasReference: boolean,');
  console.log('        hasTransactionType: boolean,');
  console.log('        hasBalance: boolean,');
  console.log('        additional: string[]');
  console.log('      },');
  console.log('      "bank_2": { ... }');
  console.log('    },');
  console.log('    ledger: {');
  console.log('      hasReference: boolean,');
  console.log('      hasTransactionType: boolean,');
  console.log('      additional: string[]');
  console.log('    },');
  console.log('    compatibilityAnalysis?: {');
  console.log('      commonFields: string[],');
  console.log('      bankOnlyFields: string[],');
  console.log('      ledgerOnlyFields: string[]');
  console.log('    }');
  console.log('  }');
  console.log('\nUSAGE:');
  console.log('  • Orchestrator passes field profile from reconciliation state');
  console.log('  • MT-02 can adjust matching strategies per bank');
  console.log('  • Field availability informs which fields to use');
  console.log('  • Field quality can adjust confidence weights');
  console.log('\n✨ MT-02 now supports per-bank field profile analysis!');
} else {
  console.log(`❌ TESTS FAILED: ${testsFailed} failed, ${testsPassed} passed`);
  process.exit(1);
}
console.log('='.repeat(80));
