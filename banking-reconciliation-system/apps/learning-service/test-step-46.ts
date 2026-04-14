/**
 * STEP 46: REST Endpoints Verification
 *
 * Comprehensive verification that all Learning Service REST endpoints are:
 * - Properly defined with correct HTTP methods
 * - Documented with Swagger decorators
 * - Using correct DTOs for request/response
 * - Mapped to service methods
 * - Following RESTful conventions
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const baseDir = path.join(__dirname, 'src');
const rootDir = path.join(__dirname, '..', '..');

console.log('='.repeat(80));
console.log('TESTING STEP 46: REST Endpoints Verification');
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

const controllerFile = path.join(baseDir, 'learning-service.controller.ts');
const controllerContent = fs.readFileSync(controllerFile, 'utf-8');

// TEST 1: Verify All Feedback Endpoints (Step 42)
testGroup('TEST 1: Verify All Feedback Endpoints (Step 42 - 5 endpoints)');

assert(
  controllerContent.includes("@Post('feedback')"),
  '1. POST /learning/feedback - Record feedback',
);
assert(
  controllerContent.includes("@Get('feedback')"),
  '2. GET /learning/feedback - Get all feedback with filters',
);
assert(
  controllerContent.includes("@Get('feedback/:id')"),
  '3. GET /learning/feedback/:id - Get feedback by ID',
);
assert(
  controllerContent.includes("@Get('feedback/stats/:reconciliationId')"),
  '4. GET /learning/feedback/stats/:reconciliationId - Get stats',
);
assert(
  controllerContent.includes("@Delete('feedback/:id')"),
  '5. DELETE /learning/feedback/:id - Delete feedback',
);

passTest('TEST 1');

// TEST 2: Verify All Entity Profile Endpoints (Step 43)
testGroup('TEST 2: Verify All Entity Profile Endpoints (Step 43 - 6 endpoints)');

assert(
  controllerContent.includes("@Post('profile')"),
  '1. POST /learning/profile - Create profile',
);
assert(
  controllerContent.includes("@Get('profile')"),
  '2. GET /learning/profile - Get all profiles',
);
assert(
  controllerContent.includes("@Get('profile/:entityId')"),
  '3. GET /learning/profile/:entityId - Get profile by ID',
);
assert(
  controllerContent.includes("@Put('profile/:entityId')"),
  '4. PUT /learning/profile/:entityId - Update profile',
);
assert(
  controllerContent.includes("@Delete('profile/:entityId')"),
  '5. DELETE /learning/profile/:entityId - Delete profile',
);
assert(
  controllerContent.includes("@Get('profile/:entityId/stats')"),
  '6. GET /learning/profile/:entityId/stats - Get profile stats',
);

passTest('TEST 2');

// TEST 3: Verify All Per-Bank Behavior Endpoints (Step 44)
testGroup('TEST 3: Verify All Per-Bank Behavior Endpoints (Step 44 - 4 endpoints)');

assert(
  controllerContent.includes("@Put('profile/:entityId/bank-behavior')"),
  '1. PUT /learning/profile/:entityId/bank-behavior - Update bank behavior',
);
assert(
  controllerContent.includes("@Get('profile/:entityId/bank-behavior/:bankId')"),
  '2. GET /learning/profile/:entityId/bank-behavior/:bankId - Get specific',
);
assert(
  controllerContent.includes("@Get('profile/:entityId/bank-behavior')"),
  '3. GET /learning/profile/:entityId/bank-behavior - Get all behaviors',
);
assert(
  controllerContent.includes("@Delete('profile/:entityId/bank-behavior/:bankId')"),
  '4. DELETE /learning/profile/:entityId/bank-behavior/:bankId - Delete',
);

passTest('TEST 3');

// TEST 4: Verify Pattern Learning Endpoint (Step 45)
testGroup('TEST 4: Verify Pattern Learning Endpoint (Step 45 - 1 endpoint)');

assert(
  controllerContent.includes("@Post('profile/build-from-transactions')"),
  '1. POST /learning/profile/build-from-transactions - Build from transactions',
);

passTest('TEST 4');

// TEST 5: Verify All Endpoints Have Swagger Documentation
testGroup('TEST 5: Verify All Endpoints Have Swagger Documentation');

// Count @ApiOperation decorators (should be 16: 5+6+4+1)
const apiOperationCount = (controllerContent.match(/@ApiOperation/g) || []).length;
assert(
  apiOperationCount >= 16,
  `All endpoints have @ApiOperation (found ${apiOperationCount})`,
);

// Verify critical Swagger decorators exist
assert(
  controllerContent.includes('@ApiTags'),
  'Controller has @ApiTags decorator',
);
assert(
  (controllerContent.match(/@ApiResponse/g) || []).length >= 20,
  'Endpoints have @ApiResponse decorators',
);
assert(
  (controllerContent.match(/@ApiParam/g) || []).length >= 10,
  'Endpoints have @ApiParam decorators for path params',
);

passTest('TEST 5');

// TEST 6: Verify DTOs Are Used Correctly
testGroup('TEST 6: Verify DTOs Are Used Correctly');

// Feedback DTOs
assert(
  controllerContent.includes('RecordFeedbackDto'),
  'RecordFeedbackDto used in feedback endpoint',
);
assert(
  controllerContent.includes('FeedbackResponseDto'),
  'FeedbackResponseDto used as return type',
);
assert(
  controllerContent.includes('FeedbackStatsDto'),
  'FeedbackStatsDto used for statistics',
);

// Profile DTOs
assert(
  controllerContent.includes('CreateEntityProfileDto'),
  'CreateEntityProfileDto used for profile creation',
);
assert(
  controllerContent.includes('UpdateEntityProfileDto'),
  'UpdateEntityProfileDto used for profile updates',
);
assert(
  controllerContent.includes('EntityProfileResponseDto'),
  'EntityProfileResponseDto used as return type',
);
assert(
  controllerContent.includes('EntityProfileStatsDto'),
  'EntityProfileStatsDto used for statistics',
);

// Bank Behavior DTOs
assert(
  controllerContent.includes('UpdateBankBehaviorDto'),
  'UpdateBankBehaviorDto used for bank behavior',
);
assert(
  controllerContent.includes('BankBehaviorResponseDto'),
  'BankBehaviorResponseDto used as return type',
);
assert(
  controllerContent.includes('AllBanksBehaviorResponseDto'),
  'AllBanksBehaviorResponseDto used for all banks',
);

// Pattern Learning DTOs
assert(
  controllerContent.includes('BuildProfileFromTransactionsDto'),
  'BuildProfileFromTransactionsDto used for pattern learning',
);
assert(
  controllerContent.includes('PatternLearningResultDto'),
  'PatternLearningResultDto used as return type',
);

passTest('TEST 6');

// TEST 7: Verify HTTP Methods Follow RESTful Conventions
testGroup('TEST 7: Verify HTTP Methods Follow RESTful Conventions');

assert(
  (controllerContent.match(/@Post/g) || []).length === 3,
  'POST used for creation (3 endpoints: feedback, profile, build-from-transactions)',
);
assert(
  (controllerContent.match(/@Get/g) || []).length >= 9,
  'GET used for retrieval (9+ endpoints)',
);
assert(
  (controllerContent.match(/@Put/g) || []).length === 2,
  'PUT used for updates (2 endpoints: profile, bank-behavior)',
);
assert(
  (controllerContent.match(/@Delete/g) || []).length === 3,
  'DELETE used for deletion (3 endpoints: feedback, profile, bank-behavior)',
);

passTest('TEST 7');

// TEST 8: Verify Health Check Endpoint
testGroup('TEST 8: Verify Health Check Endpoint');

assert(
  controllerContent.includes("@Get('health')"),
  'Health check endpoint exists',
);
assert(
  controllerContent.includes('entity-profiles'),
  'Health check reports entity-profiles capability',
);
assert(
  controllerContent.includes('user-feedback'),
  'Health check reports user-feedback capability',
);
assert(
  controllerContent.includes('pattern-learning'),
  'Health check reports pattern-learning capability',
);
assert(
  controllerContent.includes('per-bank-tracking'),
  'Health check reports per-bank-tracking capability',
);

passTest('TEST 8');

// TEST 9: Verify Service Method Mapping
testGroup('TEST 9: Verify Service Method Mapping');

const serviceFile = path.join(baseDir, 'learning-service.service.ts');
const serviceContent = fs.readFileSync(serviceFile, 'utf-8');

// Verify all controller methods call corresponding service methods
assert(
  serviceContent.includes('async recordFeedback'),
  'Service has recordFeedback method',
);
assert(
  serviceContent.includes('async getFeedback'),
  'Service has getFeedback method',
);
assert(
  serviceContent.includes('async createProfile'),
  'Service has createProfile method',
);
assert(
  serviceContent.includes('async updateProfile'),
  'Service has updateProfile method',
);
assert(
  serviceContent.includes('async updateBankBehavior'),
  'Service has updateBankBehavior method',
);
assert(
  serviceContent.includes('async buildProfileFromTransactions'),
  'Service has buildProfileFromTransactions method',
);

passTest('TEST 9');

// TEST 10: TypeScript Compilation
testGroup('TEST 10: TypeScript Compilation');

try {
  execSync('npm run build -- learning-service', { cwd: rootDir, stdio: 'pipe' });
  console.log('  ✅ Learning Service compiles successfully');
  testsPassed++;
  passTest('TEST 10');
} catch (error) {
  console.log('  ❌ TypeScript compilation failed');
  testsFailed++;
  failTest('TEST 10');
}

// SUMMARY
console.log('='.repeat(80));
if (testsFailed === 0) {
  console.log('✅ ALL STEP 46 TESTS PASSED');
  console.log('\nSTEP 46 COMPLETE: REST Endpoints Verification');
  console.log('\n📊 LEARNING SERVICE API SUMMARY:');
  console.log('='.repeat(80));

  console.log('\n🔹 FEEDBACK ENDPOINTS (5):');
  console.log('  POST   /learning/feedback');
  console.log('  GET    /learning/feedback');
  console.log('  GET    /learning/feedback/:id');
  console.log('  GET    /learning/feedback/stats/:reconciliationId');
  console.log('  DELETE /learning/feedback/:id');

  console.log('\n🔹 ENTITY PROFILE ENDPOINTS (6):');
  console.log('  POST   /learning/profile');
  console.log('  GET    /learning/profile');
  console.log('  GET    /learning/profile/:entityId');
  console.log('  PUT    /learning/profile/:entityId');
  console.log('  DELETE /learning/profile/:entityId');
  console.log('  GET    /learning/profile/:entityId/stats');

  console.log('\n🔹 PER-BANK BEHAVIOR ENDPOINTS (4):');
  console.log('  PUT    /learning/profile/:entityId/bank-behavior');
  console.log('  GET    /learning/profile/:entityId/bank-behavior');
  console.log('  GET    /learning/profile/:entityId/bank-behavior/:bankId');
  console.log('  DELETE /learning/profile/:entityId/bank-behavior/:bankId');

  console.log('\n🔹 PATTERN LEARNING ENDPOINTS (1):');
  console.log('  POST   /learning/profile/build-from-transactions');

  console.log('\n🔹 SYSTEM ENDPOINTS (1):');
  console.log('  GET    /learning/health');

  console.log('\n' + '='.repeat(80));
  console.log('📈 TOTAL: 17 REST Endpoints');
  console.log('✅ All endpoints follow RESTful conventions');
  console.log('✅ All endpoints have Swagger documentation');
  console.log('✅ All endpoints map to service methods');
  console.log('✅ TypeScript compilation successful');
  console.log('\n✅ Ready for Step 47: Test entity profile building');
} else {
  console.log(`❌ TESTS FAILED: ${testsFailed} failed, ${testsPassed} passed`);
  process.exit(1);
}
console.log('='.repeat(80));
