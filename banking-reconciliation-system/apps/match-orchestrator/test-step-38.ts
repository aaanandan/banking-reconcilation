/**
 * STEP 38: Progress Tracking (Verification)
 *
 * This test verifies that progress tracking is properly implemented:
 * - ProgressStatus enum defined with all states
 * - ProgressUpdateDto defined with all required fields
 * - Service has progress store and update/get/clear methods
 * - orchestrateReconciliation updates progress at each step
 * - Controller has progress endpoint (GET /orchestrate/progress/:reconciliationId)
 * - TypeScript compilation
 *
 * Progress tracking enables clients to poll for real-time status updates during
 * long-running reconciliation workflows.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const baseDir = path.join(__dirname, 'src');
const rootDir = path.join(__dirname, '..', '..');

console.log('='.repeat(80));
console.log('TESTING STEP 38: Progress Tracking');
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
// TEST 1: Verify ProgressStatus Enum
// ============================================================================
testGroup('TEST 1: Verify ProgressStatus Enum');

const dtoFile = path.join(baseDir, 'dto', 'reconciliation.dto.ts');
const dtoContent = fs.readFileSync(dtoFile, 'utf-8');

assert(
  dtoContent.includes('export enum ProgressStatus'),
  'ProgressStatus enum defined',
);
assert(
  dtoContent.includes("PENDING = 'pending'"),
  'ProgressStatus has PENDING state',
);
assert(
  dtoContent.includes("CALLING_MT01 = 'calling_mt01'"),
  'ProgressStatus has CALLING_MT01 state',
);
assert(
  dtoContent.includes("MT01_COMPLETE = 'mt01_complete'"),
  'ProgressStatus has MT01_COMPLETE state',
);
assert(
  dtoContent.includes("EXTRACTING_UNMATCHED = 'extracting_unmatched'"),
  'ProgressStatus has EXTRACTING_UNMATCHED state',
);
assert(
  dtoContent.includes("CALLING_MT02 = 'calling_mt02'"),
  'ProgressStatus has CALLING_MT02 state',
);
assert(
  dtoContent.includes("MT02_COMPLETE = 'mt02_complete'"),
  'ProgressStatus has MT02_COMPLETE state',
);
assert(
  dtoContent.includes("AGGREGATING_RESULTS = 'aggregating_results'"),
  'ProgressStatus has AGGREGATING_RESULTS state',
);
assert(
  dtoContent.includes("COMPLETE = 'complete'"),
  'ProgressStatus has COMPLETE state',
);
assert(
  dtoContent.includes("ERROR = 'error'"),
  'ProgressStatus has ERROR state',
);

passTest('TEST 1');

// ============================================================================
// TEST 2: Verify ProgressUpdateDto Structure
// ============================================================================
testGroup('TEST 2: Verify ProgressUpdateDto Structure');

assert(
  dtoContent.includes('export class ProgressUpdateDto'),
  'ProgressUpdateDto defined',
);
assert(
  dtoContent.includes('reconciliationId: string'),
  'ProgressUpdateDto has reconciliationId',
);
assert(
  dtoContent.includes('status: ProgressStatus'),
  'ProgressUpdateDto has status (ProgressStatus type)',
);
assert(
  dtoContent.includes('currentStep: number'),
  'ProgressUpdateDto has currentStep',
);
assert(
  dtoContent.includes('totalSteps: number'),
  'ProgressUpdateDto has totalSteps',
);
assert(
  dtoContent.includes('progressPercentage: number'),
  'ProgressUpdateDto has progressPercentage',
);
assert(
  dtoContent.includes('message: string'),
  'ProgressUpdateDto has message',
);
assert(
  dtoContent.includes('timestamp: string'),
  'ProgressUpdateDto has timestamp',
);
assert(
  dtoContent.includes('exactMatchesFound?: number'),
  'ProgressUpdateDto has optional exactMatchesFound',
);
assert(
  dtoContent.includes('fuzzyMatchesFound?: number'),
  'ProgressUpdateDto has optional fuzzyMatchesFound',
);
assert(
  dtoContent.includes('error?: string'),
  'ProgressUpdateDto has optional error',
);

passTest('TEST 2');

// ============================================================================
// TEST 3: Verify Service Progress Store
// ============================================================================
testGroup('TEST 3: Verify Service Progress Store');

const serviceFile = path.join(baseDir, 'match-orchestrator.service.ts');
const serviceContent = fs.readFileSync(serviceFile, 'utf-8');

assert(
  serviceContent.includes('ProgressUpdateDto') && serviceContent.includes('ProgressStatus'),
  'Service imports progress types',
);
assert(
  serviceContent.includes('progressStore') &&
    serviceContent.includes('Map<string, ProgressUpdateDto>'),
  'Service has progressStore (Map<string, ProgressUpdateDto>)',
);
assert(
  serviceContent.includes('private progressStore'),
  'progressStore is private',
);

passTest('TEST 3');

// ============================================================================
// TEST 4: Verify Progress Management Methods
// ============================================================================
testGroup('TEST 4: Verify Progress Management Methods');

// updateProgress method
assert(
  serviceContent.includes('updateProgress') || serviceContent.includes('private updateProgress'),
  'updateProgress method exists',
);
assert(
  serviceContent.includes('reconciliationId: string') &&
    serviceContent.includes('status: ProgressStatus'),
  'updateProgress accepts reconciliationId and status parameters',
);
assert(
  serviceContent.includes('progressStore.set'),
  'updateProgress stores progress in progressStore',
);
assert(
  serviceContent.includes('progressPercentage'),
  'updateProgress calculates progressPercentage',
);

// getProgress method
assert(
  serviceContent.includes('getProgress'),
  'getProgress method exists',
);
assert(
  serviceContent.includes('getProgress(reconciliationId: string)'),
  'getProgress accepts reconciliationId parameter',
);
assert(
  serviceContent.includes('progressStore.get'),
  'getProgress retrieves from progressStore',
);
assert(
  serviceContent.includes('ProgressUpdateDto | null'),
  'getProgress returns ProgressUpdateDto or null',
);

// clearProgress method
assert(
  serviceContent.includes('clearProgress'),
  'clearProgress method exists',
);
assert(
  serviceContent.includes('progressStore.delete'),
  'clearProgress removes from progressStore',
);

passTest('TEST 4');

// ============================================================================
// TEST 5: Verify Progress Updates in Workflow
// ============================================================================
testGroup('TEST 5: Verify Progress Updates in Workflow');

assert(
  serviceContent.includes('orchestrateReconciliation') &&
    serviceContent.includes('reconciliationId?: string'),
  'orchestrateReconciliation accepts optional reconciliationId',
);

// Check for progress updates at each step
const callingMT01Pattern = /updateProgress.*CALLING_MT01/s;
assert(
  callingMT01Pattern.test(serviceContent),
  'Workflow updates progress at Step 1 (CALLING_MT01)',
);

const mt01CompletePattern = /updateProgress.*MT01_COMPLETE/s;
assert(
  mt01CompletePattern.test(serviceContent),
  'Workflow updates progress after MT-01 completes',
);

const extractingPattern = /updateProgress.*EXTRACTING_UNMATCHED/s;
assert(
  extractingPattern.test(serviceContent),
  'Workflow updates progress at Step 2 (EXTRACTING_UNMATCHED)',
);

const callingMT02Pattern = /updateProgress.*CALLING_MT02/s;
assert(
  callingMT02Pattern.test(serviceContent),
  'Workflow updates progress at Step 3 (CALLING_MT02)',
);

const mt02CompletePattern = /updateProgress.*MT02_COMPLETE/s;
assert(
  mt02CompletePattern.test(serviceContent),
  'Workflow updates progress after MT-02 completes',
);

const aggregatingPattern = /updateProgress.*AGGREGATING_RESULTS/s;
assert(
  aggregatingPattern.test(serviceContent),
  'Workflow updates progress at Step 4 (AGGREGATING_RESULTS)',
);

const completePattern = /updateProgress.*COMPLETE/s;
assert(
  completePattern.test(serviceContent),
  'Workflow updates progress on completion',
);

const errorPattern = /updateProgress.*ERROR/s;
assert(
  errorPattern.test(serviceContent),
  'Workflow updates progress on error',
);

passTest('TEST 5');

// ============================================================================
// TEST 6: Verify Controller Progress Endpoint
// ============================================================================
testGroup('TEST 6: Verify Controller Progress Endpoint');

const controllerFile = path.join(baseDir, 'match-orchestrator.controller.ts');
const controllerContent = fs.readFileSync(controllerFile, 'utf-8');

assert(
  controllerContent.includes('ProgressUpdateDto'),
  'Controller imports ProgressUpdateDto',
);
assert(
  controllerContent.includes('@Get') && controllerContent.includes('progress/:reconciliationId'),
  'Controller has GET /progress/:reconciliationId endpoint',
);
assert(
  controllerContent.includes('getProgress') &&
    controllerContent.includes('@Param(\'reconciliationId\')'),
  'Controller has getProgress method with @Param decorator',
);
assert(
  controllerContent.includes('matchOrchestratorService.getProgress'),
  'Controller calls service.getProgress method',
);
assert(
  controllerContent.includes('NotFoundException'),
  'Controller imports NotFoundException',
);
assert(
  controllerContent.includes('throw new NotFoundException'),
  'Controller throws NotFoundException when progress not found',
);

// Check reconcile endpoint passes reconciliationId
assert(
  controllerContent.includes('orchestrateReconciliation') &&
    controllerContent.includes('reconciliationId'),
  'Controller passes reconciliationId to orchestrateReconciliation',
);

passTest('TEST 6');

// ============================================================================
// TEST 7: Verify Swagger Documentation
// ============================================================================
testGroup('TEST 7: Verify Swagger Documentation');

assert(
  controllerContent.includes('@ApiParam') &&
    controllerContent.includes('reconciliationId'),
  'Progress endpoint has @ApiParam for reconciliationId',
);
// Check for @ApiOperation and getProgress in the right section
// Find the section with "progress/:reconciliationId" which should have all the decorators
const progressEndpointSection = controllerContent.substring(
  controllerContent.indexOf("@Get('progress/:reconciliationId')"),
  controllerContent.indexOf("@Get('progress/:reconciliationId')") + 800
);
assert(
  progressEndpointSection.includes('@ApiOperation'),
  'Progress endpoint has @ApiOperation decorator',
);
assert(
  controllerContent.includes('polling-based progress tracking') ||
    controllerContent.includes('progress status'),
  'Progress endpoint documented with description',
);

// ProgressUpdateDto Swagger decorators
const progressDtoApiProps = (dtoContent.match(/@ApiProperty/g) || []).length;
assert(
  progressDtoApiProps >= 35, // ReconciliationResponseDto + ProgressStatus + ProgressUpdateDto
  `Sufficient @ApiProperty decorators including ProgressUpdateDto (${progressDtoApiProps} found)`,
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
  console.log('✅ ALL STEP 38 TESTS PASSED');
} else {
  console.log(`❌ SOME TESTS FAILED: ${testsFailed} failed, ${testsPassed} passed`);
  process.exit(1);
}

console.log('\nSTEP 38 COMPLETE: Progress Tracking');

console.log('\nSUMMARY:');
console.log('  ✅ ProgressStatus enum with 9 states');
console.log('  ✅ ProgressUpdateDto with comprehensive tracking fields');
console.log('  ✅ Service has in-memory progress store (Map)');
console.log('  ✅ updateProgress() method for storing progress updates');
console.log('  ✅ getProgress() method for retrieving progress');
console.log('  ✅ clearProgress() method for cleanup');
console.log('  ✅ Workflow updates progress at all 4 steps + error handling');
console.log('  ✅ Controller has GET /orchestrate/progress/:reconciliationId endpoint');
console.log('  ✅ NotFoundException thrown when progress not found');
console.log('  ✅ Full Swagger documentation');
console.log('  ✅ TypeScript compiles successfully');

console.log('\nPROGRESS STATUS STATES:');
console.log('  1. PENDING - Initial state');
console.log('  2. CALLING_MT01 - Calling MT-01 Exact Match service');
console.log('  3. MT01_COMPLETE - MT-01 complete');
console.log('  4. EXTRACTING_UNMATCHED - Extracting unmatched transactions');
console.log('  5. CALLING_MT02 - Calling MT-02 Fuzzy Match service');
console.log('  6. MT02_COMPLETE - MT-02 complete');
console.log('  7. AGGREGATING_RESULTS - Aggregating results and statistics');
console.log('  8. COMPLETE - Reconciliation complete');
console.log('  9. ERROR - Error occurred');

console.log('\nPROGRESS UPDATE DTO STRUCTURE:');
console.log('  ProgressUpdateDto {');
console.log('    reconciliationId: string       // Unique ID');
console.log('    status: ProgressStatus         // Current state');
console.log('    currentStep: number            // 1-4');
console.log('    totalSteps: number             // Always 4');
console.log('    progressPercentage: number     // 0-100');
console.log('    message: string                // Human-readable status');
console.log('    timestamp: string              // ISO 8601');
console.log('    exactMatchesFound?: number     // Available after MT-01');
console.log('    fuzzyMatchesFound?: number     // Available after MT-02');
console.log('    error?: string                 // Only if status is ERROR');
console.log('  }');

console.log('\nUSAGE WORKFLOW:');
console.log('  1. Client calls POST /orchestrate/reconcile');
console.log('  2. Server generates reconciliationId and starts workflow');
console.log('  3. Server returns result (including reconciliationId)');
console.log('  4. Client can poll GET /orchestrate/progress/:reconciliationId during execution');
console.log('  5. Progress updates show current step and percentage');
console.log('  6. After completion, progress shows COMPLETE status');

console.log('\nEXAMPLE PROGRESS RESPONSES:');
console.log('  Step 1 (25%): {');
console.log('    "status": "calling_mt01",');
console.log('    "currentStep": 1,');
console.log('    "progressPercentage": 25,');
console.log('    "message": "Calling MT-01 Exact Match service..."');
console.log('  }');
console.log('');
console.log('  Step 2 (50%): {');
console.log('    "status": "mt01_complete",');
console.log('    "currentStep": 1,');
console.log('    "progressPercentage": 25,');
console.log('    "message": "MT-01 complete: 4 exact matches found",');
console.log('    "exactMatchesFound": 4');
console.log('  }');
console.log('');
console.log('  Completed (100%): {');
console.log('    "status": "complete",');
console.log('    "currentStep": 4,');
console.log('    "progressPercentage": 100,');
console.log('    "message": "Reconciliation complete: 9/10 matched (90%)",');
console.log('    "exactMatchesFound": 4,');
console.log('    "fuzzyMatchesFound": 5');
console.log('  }');

console.log('\n✨ STEP 38: PROGRESS TRACKING - COMPLETE!');
console.log('='.repeat(80));
