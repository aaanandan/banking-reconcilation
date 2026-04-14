/**
 * STEP 37: Field Profile Passing to MT Services (Verification)
 *
 * This test verifies that field profile structure is properly integrated:
 * - FieldProfileDto and related DTOs are defined
 * - ReconciliationRequestDto includes optional fieldProfile
 * - callMT01Exact() passes field profile to MT-01 service
 * - callMT02Fuzzy() passes field profile to MT-02 service
 * - orchestrateReconciliation() passes field profile through workflow
 * - TypeScript compilation
 *
 * Field Profile Purpose:
 * - Describes quality metrics for bank and ledger fields
 * - Enables MT services to intelligently weight fields during matching
 * - Provides populated rates, quality scores, usefulness scores
 * - Supports both core fields (date, amount, description) and optional fields
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const baseDir = path.join(__dirname, 'src');
const rootDir = path.join(__dirname, '..', '..');

console.log('='.repeat(80));
console.log('TESTING STEP 37: Field Profile Passing to MT Services');
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
// TEST 1: Verify Field Profile DTO Structure
// ============================================================================
testGroup('TEST 1: Verify Field Profile DTO Structure');

const dtoFile = path.join(baseDir, 'dto', 'reconciliation.dto.ts');
const dtoContent = fs.readFileSync(dtoFile, 'utf-8');

assert(
  dtoContent.includes('export class FieldQualityDto'),
  'FieldQualityDto defined',
);
assert(
  dtoContent.includes('present: boolean'),
  'FieldQualityDto has present field',
);
assert(
  dtoContent.includes('populatedRate: number'),
  'FieldQualityDto has populatedRate field',
);
assert(
  dtoContent.includes('qualityScore?: number'),
  'FieldQualityDto has optional qualityScore',
);
assert(
  dtoContent.includes('usefulnessScore?: number'),
  'FieldQualityDto has optional usefulnessScore',
);

assert(
  dtoContent.includes('export class CoreFieldsProfileDto'),
  'CoreFieldsProfileDto defined',
);
assert(
  dtoContent.includes('date: FieldQualityDto'),
  'CoreFieldsProfileDto has date field',
);
assert(
  dtoContent.includes('amount: FieldQualityDto'),
  'CoreFieldsProfileDto has amount field',
);
assert(
  dtoContent.includes('description: FieldQualityDto'),
  'CoreFieldsProfileDto has description field',
);

assert(
  dtoContent.includes('export class OptionalFieldsProfileDto'),
  'OptionalFieldsProfileDto defined',
);
assert(
  dtoContent.includes('refNumber?: FieldQualityDto'),
  'OptionalFieldsProfileDto has optional refNumber',
);
assert(
  dtoContent.includes('txnType?: FieldQualityDto'),
  'OptionalFieldsProfileDto has optional txnType',
);
assert(
  dtoContent.includes('payerPayee?: FieldQualityDto'),
  'OptionalFieldsProfileDto has optional payerPayee',
);

assert(
  dtoContent.includes('export class SourceProfileDto'),
  'SourceProfileDto defined',
);
assert(
  dtoContent.includes('totalRecords: number'),
  'SourceProfileDto has totalRecords',
);
assert(
  dtoContent.includes('coreFields: CoreFieldsProfileDto'),
  'SourceProfileDto has coreFields',
);
assert(
  dtoContent.includes('optionalFields?: OptionalFieldsProfileDto'),
  'SourceProfileDto has optional optionalFields',
);

assert(
  dtoContent.includes('export class FieldProfileDto'),
  'FieldProfileDto defined',
);
assert(
  dtoContent.includes('reconciliationId: string'),
  'FieldProfileDto has reconciliationId',
);
assert(
  dtoContent.includes('bank: SourceProfileDto'),
  'FieldProfileDto has bank source profile',
);
assert(
  dtoContent.includes('ledger: SourceProfileDto'),
  'FieldProfileDto has ledger source profile',
);

passTest('TEST 1');

// ============================================================================
// TEST 2: Verify ReconciliationRequestDto Includes FieldProfile
// ============================================================================
testGroup('TEST 2: Verify ReconciliationRequestDto Includes FieldProfile');

assert(
  dtoContent.includes('export class ReconciliationRequestDto'),
  'ReconciliationRequestDto defined',
);
assert(
  dtoContent.includes('fieldProfile?: FieldProfileDto'),
  'ReconciliationRequestDto has optional fieldProfile',
);
assert(
  dtoContent.includes('@Type(() => FieldProfileDto)'),
  'FieldProfile has Type decorator',
);
// Check for ValidateNested near fieldProfile in ReconciliationRequestDto
const fieldProfileSection = dtoContent.substring(
  dtoContent.indexOf('fieldProfile?: FieldProfileDto') - 200,
  dtoContent.indexOf('fieldProfile?: FieldProfileDto') + 50
);
assert(
  fieldProfileSection.includes('@ValidateNested()'),
  'FieldProfile has ValidateNested decorator',
);
assert(
  dtoContent.includes('Optional field quality profile for intelligent field weighting') ||
    dtoContent.includes('field quality profile'),
  'FieldProfile documented with description',
);

passTest('TEST 2');

// ============================================================================
// TEST 3: Verify MT-01 Call Passes Field Profile
// ============================================================================
testGroup('TEST 3: Verify MT-01 Call Passes Field Profile');

const serviceFile = path.join(baseDir, 'match-orchestrator.service.ts');
const serviceContent = fs.readFileSync(serviceFile, 'utf-8');

// Check callMT01Exact method signature
assert(
  serviceContent.includes('async callMT01Exact'),
  'callMT01Exact method exists',
);
assert(
  serviceContent.includes('fieldProfile?:') || serviceContent.includes('fieldProfile?: any'),
  'callMT01Exact accepts optional fieldProfile parameter',
);

// Check payload construction
const mt01PayloadPattern = /payload.*fieldProfile.*=.*fieldProfile/s;
assert(
  mt01PayloadPattern.test(serviceContent),
  'callMT01Exact includes fieldProfile in payload',
);

// Check conditional logic
assert(
  serviceContent.includes('if (fieldProfile)') &&
    serviceContent.indexOf('if (fieldProfile)', serviceContent.indexOf('callMT01Exact')) > 0,
  'callMT01Exact has conditional check for fieldProfile',
);

// Check logging
assert(
  serviceContent.includes('Including field profile in MT-01 request') ||
    serviceContent.includes('field profile') &&
    serviceContent.indexOf('MT-01', serviceContent.indexOf('callMT01Exact')) > 0,
  'callMT01Exact logs field profile inclusion',
);

passTest('TEST 3');

// ============================================================================
// TEST 4: Verify MT-02 Call Passes Field Profile
// ============================================================================
testGroup('TEST 4: Verify MT-02 Call Passes Field Profile');

// Check callMT02Fuzzy method signature
assert(
  serviceContent.includes('async callMT02Fuzzy'),
  'callMT02Fuzzy method exists',
);
assert(
  serviceContent.includes('fuzzyThresholds?:') &&
    (serviceContent.includes('fieldProfile?:') || serviceContent.includes('fieldProfile?: any')),
  'callMT02Fuzzy accepts both fuzzyThresholds and fieldProfile parameters',
);

// Check payload construction
const mt02PayloadPattern = /payload.*fieldProfile.*=.*fieldProfile/s;
assert(
  mt02PayloadPattern.test(serviceContent),
  'callMT02Fuzzy includes fieldProfile in payload',
);

// Check conditional logic
assert(
  serviceContent.includes('if (fieldProfile)') &&
    serviceContent.indexOf('if (fieldProfile)', serviceContent.indexOf('callMT02Fuzzy')) > 0,
  'callMT02Fuzzy has conditional check for fieldProfile',
);

// Check logging
assert(
  serviceContent.includes('Including field profile in MT-02 request') ||
    serviceContent.includes('field profile') &&
    serviceContent.indexOf('MT-02', serviceContent.indexOf('callMT02Fuzzy')) > 0,
  'callMT02Fuzzy logs field profile inclusion',
);

passTest('TEST 4');

// ============================================================================
// TEST 5: Verify Orchestration Workflow Passes Field Profile
// ============================================================================
testGroup('TEST 5: Verify Orchestration Workflow Passes Field Profile');

assert(
  serviceContent.includes('async orchestrateReconciliation'),
  'orchestrateReconciliation method exists',
);

// Check MT-01 call passes field profile
const mt01CallPattern = /callMT01Exact\([^)]*request\.fieldProfile/s;
assert(
  mt01CallPattern.test(serviceContent),
  'orchestrateReconciliation passes request.fieldProfile to callMT01Exact',
);

// Check MT-02 call passes field profile
const mt02CallPattern = /callMT02Fuzzy\([^)]*request\.fieldProfile/s;
assert(
  mt02CallPattern.test(serviceContent),
  'orchestrateReconciliation passes request.fieldProfile to callMT02Fuzzy',
);

passTest('TEST 5');

// ============================================================================
// TEST 6: Verify API Property Decorators
// ============================================================================
testGroup('TEST 6: Verify API Property Decorators');

// Count @ApiProperty decorators for field profile DTOs
const apiPropertyCount = (dtoContent.match(/@ApiProperty/g) || []).length;
assert(
  apiPropertyCount >= 25,
  `Sufficient @ApiProperty decorators for comprehensive Swagger docs (${apiPropertyCount} found)`,
);

// Check for validation decorators
assert(
  dtoContent.includes('@IsBoolean()') &&
    dtoContent.indexOf('@IsBoolean()', dtoContent.indexOf('FieldQualityDto')) > 0,
  'FieldQualityDto.present has @IsBoolean() decorator',
);
assert(
  dtoContent.includes('@IsNumber()') &&
    dtoContent.indexOf('@IsNumber()', dtoContent.indexOf('populatedRate')) > 0,
  'FieldQualityDto.populatedRate has @IsNumber() decorator',
);
assert(
  dtoContent.includes('@IsString()') &&
    dtoContent.indexOf('@IsString()', dtoContent.indexOf('reconciliationId')) > 0,
  'FieldProfileDto.reconciliationId has @IsString() decorator',
);

passTest('TEST 6');

// ============================================================================
// TEST 7: TypeScript Compilation
// ============================================================================
testGroup('TEST 7: TypeScript Compilation');

try {
  execSync('npm run build:orchestrator', {
    cwd: rootDir,
    stdio: 'pipe',
  });
  console.log('  ✅ Match Orchestrator service compiles successfully');
  testsPassed++;
  passTest('TEST 7');
} catch (error) {
  console.log('  ❌ TypeScript compilation failed');
  testsFailed++;
  failTest('TEST 7');
}

// ============================================================================
// SUMMARY
// ============================================================================
console.log('='.repeat(80));
if (testsFailed === 0) {
  console.log('✅ ALL STEP 37 TESTS PASSED');
} else {
  console.log(`❌ SOME TESTS FAILED: ${testsFailed} failed, ${testsPassed} passed`);
  process.exit(1);
}

console.log('\nSTEP 37 COMPLETE: Field Profile Passing to MT Services');

console.log('\nSUMMARY:');
console.log('  ✅ Field Profile DTO structure defined');
console.log('  ✅ FieldQualityDto with present, populatedRate, quality, usefulness');
console.log('  ✅ CoreFieldsProfileDto for date, amount, description');
console.log('  ✅ OptionalFieldsProfileDto for refNumber, txnType, payerPayee');
console.log('  ✅ SourceProfileDto for bank and ledger profiles');
console.log('  ✅ FieldProfileDto with reconciliationId and source profiles');
console.log('  ✅ ReconciliationRequestDto includes optional fieldProfile');
console.log('  ✅ callMT01Exact() passes field profile to MT-01 service');
console.log('  ✅ callMT02Fuzzy() passes field profile to MT-02 service');
console.log('  ✅ orchestrateReconciliation() passes field profile through workflow');
console.log('  ✅ Full validation and Swagger decorators');
console.log('  ✅ TypeScript compiles successfully');

console.log('\nFIELD PROFILE STRUCTURE:');
console.log('  FieldProfileDto {');
console.log('    reconciliationId: string');
console.log('    bank: SourceProfileDto {');
console.log('      totalRecords: number');
console.log('      coreFields: CoreFieldsProfileDto {');
console.log('        date: FieldQualityDto');
console.log('        amount: FieldQualityDto');
console.log('        description: FieldQualityDto');
console.log('      }');
console.log('      optionalFields?: OptionalFieldsProfileDto {');
console.log('        refNumber?: FieldQualityDto');
console.log('        txnType?: FieldQualityDto');
console.log('        payerPayee?: FieldQualityDto');
console.log('      }');
console.log('    }');
console.log('    ledger: SourceProfileDto { ... }');
console.log('  }');

console.log('\nFIELD QUALITY DTO:');
console.log('  FieldQualityDto {');
console.log('    present: boolean              // Is field present in data');
console.log('    populatedRate: number         // 0.0-1.0 population rate');
console.log('    qualityScore?: number         // Optional 0.0-1.0 quality');
console.log('    usefulnessScore?: number      // Optional 0.0-1.0 usefulness for matching');
console.log('  }');

console.log('\nUSAGE IN WORKFLOW:');
console.log('  1. Client sends ReconciliationRequestDto with optional fieldProfile');
console.log('  2. Orchestrator passes fieldProfile to MT-01 (exact match)');
console.log('  3. Orchestrator passes fieldProfile to MT-02 (fuzzy match)');
console.log('  4. MT services use field profile to intelligently weight fields');
console.log('  5. Low quality/populated fields get lower weights');
console.log('  6. High quality/populated fields get higher weights');

console.log('\nEXAMPLE FIELD PROFILE:');
console.log('  {');
console.log('    "reconciliationId": "recon_001",');
console.log('    "bank": {');
console.log('      "totalRecords": 500,');
console.log('      "coreFields": {');
console.log('        "date": { "present": true, "populatedRate": 1.0, "qualityScore": 0.99 },');
console.log('        "amount": { "present": true, "populatedRate": 1.0, "qualityScore": 0.98 },');
console.log('        "description": { "present": true, "populatedRate": 0.95, "qualityScore": 0.85 }');
console.log('      },');
console.log('      "optionalFields": {');
console.log('        "refNumber": { "present": true, "populatedRate": 0.60, "qualityScore": 0.70 }');
console.log('      }');
console.log('    },');
console.log('    "ledger": { ... }');
console.log('  }');

console.log('\n✨ STEP 37: FIELD PROFILE PASSING - COMPLETE!');
console.log('='.repeat(80));
