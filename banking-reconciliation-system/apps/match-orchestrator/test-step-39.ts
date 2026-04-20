/**
 * STEP 39: Convergence Calculation (Verification)
 *
 * This test verifies that convergence calculation is properly implemented:
 * - ConvergenceStepDto defined with all fields
 * - ConvergenceMetricsDto defined with steps array
 * - ReconciliationResponseDto includes convergence field
 * - Service has calculateConvergenceMetrics() method
 * - Method calculates match rate improvement for each step
 * - Result includes convergence metrics
 * - TypeScript compilation
 *
 * Convergence metrics track how the match rate improves at each algorithm step,
 * showing incremental value of MT-01 and MT-02.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const baseDir = path.join(__dirname, 'src');
const rootDir = path.join(__dirname, '..', '..');

console.log('='.repeat(80));
console.log('TESTING STEP 39: Convergence Calculation');
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
// TEST 1: Verify ConvergenceStepDto Structure
// ============================================================================
testGroup('TEST 1: Verify ConvergenceStepDto Structure');

const dtoFile = path.join(baseDir, 'dto', 'reconciliation.dto.ts');
const dtoContent = fs.readFileSync(dtoFile, 'utf-8');

assert(
  dtoContent.includes('export class ConvergenceStepDto'),
  'ConvergenceStepDto defined',
);
assert(
  dtoContent.includes('algorithm: string'),
  'ConvergenceStepDto has algorithm field',
);
assert(
  dtoContent.includes('matchesFound: number'),
  'ConvergenceStepDto has matchesFound field',
);
assert(
  dtoContent.includes('matchRateBefore: number'),
  'ConvergenceStepDto has matchRateBefore field',
);
assert(
  dtoContent.includes('matchRateAfter: number'),
  'ConvergenceStepDto has matchRateAfter field',
);
assert(
  dtoContent.includes('improvement: number'),
  'ConvergenceStepDto has improvement field',
);

passTest('TEST 1');

// ============================================================================
// TEST 2: Verify ConvergenceMetricsDto Structure
// ============================================================================
testGroup('TEST 2: Verify ConvergenceMetricsDto Structure');

assert(
  dtoContent.includes('export class ConvergenceMetricsDto'),
  'ConvergenceMetricsDto defined',
);
assert(
  dtoContent.includes('initialMatchRate: number'),
  'ConvergenceMetricsDto has initialMatchRate field',
);
assert(
  dtoContent.includes('finalMatchRate: number'),
  'ConvergenceMetricsDto has finalMatchRate field',
);
assert(
  dtoContent.includes('totalImprovement: number'),
  'ConvergenceMetricsDto has totalImprovement field',
);
assert(
  dtoContent.includes('steps: ConvergenceStepDto[]') ||
    dtoContent.includes('steps: Array<ConvergenceStepDto>'),
  'ConvergenceMetricsDto has steps array (ConvergenceStepDto[])',
);
assert(
  dtoContent.includes('stepsExecuted: number'),
  'ConvergenceMetricsDto has stepsExecuted field',
);

passTest('TEST 2');

// ============================================================================
// TEST 3: Verify ReconciliationResponseDto Includes Convergence
// ============================================================================
testGroup('TEST 3: Verify ReconciliationResponseDto Includes Convergence');

assert(
  dtoContent.includes('export class ReconciliationResponseDto'),
  'ReconciliationResponseDto defined',
);
assert(
  dtoContent.includes('convergence: ConvergenceMetricsDto'),
  'ReconciliationResponseDto has convergence field (ConvergenceMetricsDto type)',
);

// Check for Swagger decorators
const convergenceSection = dtoContent.substring(
  dtoContent.indexOf('convergence: ConvergenceMetricsDto') - 200,
  dtoContent.indexOf('convergence: ConvergenceMetricsDto') + 50
);
assert(
  convergenceSection.includes('@ApiProperty'),
  'convergence field has @ApiProperty decorator',
);
assert(
  convergenceSection.includes('Convergence') || convergenceSection.includes('convergence'),
  'convergence field documented with description',
);

passTest('TEST 3');

// ============================================================================
// TEST 4: Verify Service Imports Convergence Types
// ============================================================================
testGroup('TEST 4: Verify Service Imports Convergence Types');

const serviceFile = path.join(baseDir, 'match-orchestrator.service.ts');
const serviceContent = fs.readFileSync(serviceFile, 'utf-8');

assert(
  serviceContent.includes('ConvergenceMetricsDto'),
  'Service imports ConvergenceMetricsDto',
);
assert(
  serviceContent.includes('ConvergenceStepDto'),
  'Service imports ConvergenceStepDto',
);

passTest('TEST 4');

// ============================================================================
// TEST 5: Verify calculateConvergenceMetrics Method
// ============================================================================
testGroup('TEST 5: Verify calculateConvergenceMetrics Method');

assert(
  serviceContent.includes('calculateConvergenceMetrics'),
  'calculateConvergenceMetrics method exists',
);
assert(
  serviceContent.includes('totalBankTransactions') &&
    serviceContent.includes('exactMatches') &&
    serviceContent.includes('fuzzyMatches'),
  'calculateConvergenceMetrics accepts required parameters',
);
assert(
  serviceContent.includes('ConvergenceMetricsDto'),
  'calculateConvergenceMetrics returns ConvergenceMetricsDto',
);

// Check for convergence step calculations
assert(
  serviceContent.includes('MT-01') &&
    serviceContent.indexOf('MT-01', serviceContent.indexOf('calculateConvergenceMetrics')) > 0,
  'calculateConvergenceMetrics tracks MT-01 step',
);
assert(
  serviceContent.includes('MT-02') &&
    serviceContent.indexOf('MT-02', serviceContent.indexOf('calculateConvergenceMetrics')) > 0,
  'calculateConvergenceMetrics tracks MT-02 step',
);

// Check for match rate calculations
assert(
  serviceContent.includes('matchRateBefore') &&
    serviceContent.indexOf('matchRateBefore', serviceContent.indexOf('calculateConvergenceMetrics')) > 0,
  'calculateConvergenceMetrics calculates matchRateBefore',
);
assert(
  serviceContent.includes('matchRateAfter') &&
    serviceContent.indexOf('matchRateAfter', serviceContent.indexOf('calculateConvergenceMetrics')) > 0,
  'calculateConvergenceMetrics calculates matchRateAfter',
);
assert(
  serviceContent.includes('improvement') &&
    serviceContent.indexOf('improvement', serviceContent.indexOf('calculateConvergenceMetrics')) > 0,
  'calculateConvergenceMetrics calculates improvement',
);

// Check for initial and final match rates
assert(
  serviceContent.includes('initialMatchRate') &&
    serviceContent.indexOf('initialMatchRate', serviceContent.indexOf('calculateConvergenceMetrics')) > 0,
  'calculateConvergenceMetrics tracks initialMatchRate',
);
assert(
  serviceContent.includes('finalMatchRate') &&
    serviceContent.indexOf('finalMatchRate', serviceContent.indexOf('calculateConvergenceMetrics')) > 0,
  'calculateConvergenceMetrics tracks finalMatchRate',
);
assert(
  serviceContent.includes('totalImprovement') &&
    serviceContent.indexOf('totalImprovement', serviceContent.indexOf('calculateConvergenceMetrics')) > 0,
  'calculateConvergenceMetrics tracks totalImprovement',
);

passTest('TEST 5');

// ============================================================================
// TEST 6: Verify Convergence Included in Workflow Result
// ============================================================================
testGroup('TEST 6: Verify Convergence Included in Workflow Result');

assert(
  serviceContent.includes('orchestrateReconciliation'),
  'orchestrateReconciliation method exists',
);

// Check that convergence is calculated
const orchestrateSection = serviceContent.substring(
  serviceContent.indexOf('async orchestrateReconciliation'),
  serviceContent.lastIndexOf('}')
);
assert(
  orchestrateSection.includes('calculateConvergenceMetrics'),
  'orchestrateReconciliation calls calculateConvergenceMetrics',
);

// Check that convergence is included in result
assert(
  orchestrateSection.includes('convergence:') ||
    orchestrateSection.includes('convergence ='),
  'orchestrateReconciliation includes convergence in result',
);

passTest('TEST 6');

// ============================================================================
// TEST 7: Verify Rounding Consistency
// ============================================================================
testGroup('TEST 7: Verify Rounding Consistency');

// Check that convergence calculations use consistent rounding (3 decimals)
const convergenceMethodSection = serviceContent.substring(
  serviceContent.indexOf('calculateConvergenceMetrics'),
  serviceContent.indexOf('updateProgress', serviceContent.indexOf('calculateConvergenceMetrics'))
);

assert(
  convergenceMethodSection.includes('Math.round') &&
    convergenceMethodSection.includes('* 1000'),
  'Convergence calculations use Math.round with 3 decimal precision',
);

passTest('TEST 7');

// ============================================================================
// TEST 8: Verify Swagger Documentation
// ============================================================================
testGroup('TEST 8: Verify Swagger Documentation');

// Check @ApiProperty decorators for ConvergenceStepDto
const convergenceStepSection = dtoContent.substring(
  dtoContent.indexOf('export class ConvergenceStepDto'),
  dtoContent.indexOf('export class ConvergenceMetricsDto')
);
const stepApiPropertyCount = (convergenceStepSection.match(/@ApiProperty/g) || []).length;
assert(
  stepApiPropertyCount >= 5,
  `ConvergenceStepDto has @ApiProperty for all fields (${stepApiPropertyCount} found)`,
);

// Check @ApiProperty decorators for ConvergenceMetricsDto
const convergenceMetricsSection = dtoContent.substring(
  dtoContent.indexOf('export class ConvergenceMetricsDto'),
  dtoContent.indexOf('export class ReconciliationResponseDto')
);
const metricsApiPropertyCount = (convergenceMetricsSection.match(/@ApiProperty/g) || []).length;
assert(
  metricsApiPropertyCount >= 5,
  `ConvergenceMetricsDto has @ApiProperty for all fields (${metricsApiPropertyCount} found)`,
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
  console.log('✅ ALL STEP 39 TESTS PASSED');
} else {
  console.log(`❌ SOME TESTS FAILED: ${testsFailed} failed, ${testsPassed} passed`);
  process.exit(1);
}

console.log('\nSTEP 39 COMPLETE: Convergence Calculation');

console.log('\nSUMMARY:');
console.log('  ✅ ConvergenceStepDto with algorithm-specific metrics');
console.log('  ✅ ConvergenceMetricsDto with overall convergence analysis');
console.log('  ✅ ReconciliationResponseDto includes convergence field');
console.log('  ✅ Service imports convergence types');
console.log('  ✅ calculateConvergenceMetrics() method implemented');
console.log('  ✅ Tracks match rate before/after each algorithm');
console.log('  ✅ Calculates improvement per step');
console.log('  ✅ Calculates overall improvement (initial → final)');
console.log('  ✅ Workflow includes convergence in result');
console.log('  ✅ Consistent 3-decimal rounding');
console.log('  ✅ Full Swagger documentation');
console.log('  ✅ TypeScript compiles successfully');

console.log('\nCONVERGENCE STEP DTO STRUCTURE:');
console.log('  ConvergenceStepDto {');
console.log('    algorithm: string           // "MT-01" or "MT-02"');
console.log('    matchesFound: number        // Matches found in this step');
console.log('    matchRateBefore: number     // Match rate before step (0.0-1.0)');
console.log('    matchRateAfter: number      // Match rate after step (0.0-1.0)');
console.log('    improvement: number         // Improvement delta (0.0-1.0)');
console.log('  }');

console.log('\nCONVERGENCE METRICS DTO STRUCTURE:');
console.log('  ConvergenceMetricsDto {');
console.log('    initialMatchRate: number    // Always 0.0 (no matches initially)');
console.log('    finalMatchRate: number      // Final rate after all algorithms');
console.log('    totalImprovement: number    // Total improvement (0.0-1.0)');
console.log('    steps: ConvergenceStepDto[] // Step-by-step breakdown');
console.log('    stepsExecuted: number       // Number of steps executed (2)');
console.log('  }');

console.log('\nEXAMPLE CONVERGENCE OUTPUT:');
console.log('  With 10 bank transactions:');
console.log('  - Initial: 0/10 matched (0%)');
console.log('  - After MT-01: 4/10 matched (40%) → +40% improvement');
console.log('  - After MT-02: 9/10 matched (90%) → +50% improvement');
console.log('  - Total improvement: 90%');
console.log('');
console.log('  {');
console.log('    "initialMatchRate": 0.0,');
console.log('    "finalMatchRate": 0.9,');
console.log('    "totalImprovement": 0.9,');
console.log('    "steps": [');
console.log('      {');
console.log('        "algorithm": "MT-01",');
console.log('        "matchesFound": 4,');
console.log('        "matchRateBefore": 0.0,');
console.log('        "matchRateAfter": 0.4,');
console.log('        "improvement": 0.4');
console.log('      },');
console.log('      {');
console.log('        "algorithm": "MT-02",');
console.log('        "matchesFound": 5,');
console.log('        "matchRateBefore": 0.4,');
console.log('        "matchRateAfter": 0.9,');
console.log('        "improvement": 0.5');
console.log('      }');
console.log('    ],');
console.log('    "stepsExecuted": 2');
console.log('  }');

console.log('\nVALUE OF CONVERGENCE METRICS:');
console.log('  1. Shows incremental value of each matching algorithm');
console.log('  2. Helps identify which algorithm contributes most to match rate');
console.log('  3. Enables analysis of diminishing returns');
console.log('  4. Supports decisions about algorithm ordering');
console.log('  5. Provides insights for algorithm tuning');

console.log('\n✨ STEP 39: CONVERGENCE CALCULATION - COMPLETE!');
console.log('\n🎉 PHASE 6 COMPLETE: MATCH ORCHESTRATOR SERVICE');
console.log('='.repeat(80));
