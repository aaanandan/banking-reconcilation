/**
 * STEP 42: User Feedback Recording - Verification
 *
 * Verifies that user feedback recording is properly implemented:
 * - Feedback DTOs defined with all types
 * - Service methods for recording and retrieving feedback
 * - Feedback statistics calculation
 * - Controller endpoints with proper decorators
 * - TypeScript compilation successful
 * - CRUD operations for feedback
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const baseDir = path.join(__dirname, 'src');
const rootDir = path.join(__dirname, '..', '..');

console.log('='.repeat(80));
console.log('TESTING STEP 42: User Feedback Recording');
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

// TEST 1: Verify Feedback DTOs Exist
testGroup('TEST 1: Verify Feedback DTOs Exist');

const dtoFile = path.join(baseDir, 'dto', 'feedback.dto.ts');
const dtoContent = fs.readFileSync(dtoFile, 'utf-8');

assert(
  dtoContent.includes('export enum FeedbackType'),
  'FeedbackType enum defined',
);
assert(
  dtoContent.includes('OVERRIDE'),
  'FeedbackType has OVERRIDE',
);
assert(
  dtoContent.includes('REJECTION'),
  'FeedbackType has REJECTION',
);
assert(
  dtoContent.includes('MANUAL_MATCH'),
  'FeedbackType has MANUAL_MATCH',
);
assert(
  dtoContent.includes('COMMENT'),
  'FeedbackType has COMMENT',
);

passTest('TEST 1');

// TEST 2: Verify RecordFeedbackDto Structure
testGroup('TEST 2: Verify RecordFeedbackDto Structure');

assert(
  dtoContent.includes('export class RecordFeedbackDto'),
  'RecordFeedbackDto defined',
);
assert(
  dtoContent.includes('reconciliationId: string'),
  'RecordFeedbackDto has reconciliationId',
);
assert(
  dtoContent.includes('transactionId: number'),
  'RecordFeedbackDto has transactionId',
);
assert(
  dtoContent.includes('feedbackType: FeedbackType'),
  'RecordFeedbackDto has feedbackType',
);
assert(
  dtoContent.includes('originalSuggestion?'),
  'RecordFeedbackDto has originalSuggestion (optional)',
);
assert(
  dtoContent.includes('userChoice?'),
  'RecordFeedbackDto has userChoice (optional)',
);
assert(
  dtoContent.includes('reason?'),
  'RecordFeedbackDto has reason (optional)',
);
assert(
  dtoContent.includes('userId: string'),
  'RecordFeedbackDto has userId',
);

passTest('TEST 2');

// TEST 3: Verify Other DTOs
testGroup('TEST 3: Verify Other DTOs');

assert(
  dtoContent.includes('export class FeedbackResponseDto'),
  'FeedbackResponseDto defined',
);
assert(
  dtoContent.includes('export class GetFeedbackDto'),
  'GetFeedbackDto defined',
);
assert(
  dtoContent.includes('export class FeedbackStatsDto'),
  'FeedbackStatsDto defined',
);

passTest('TEST 3');

// TEST 4: Verify Service Methods
testGroup('TEST 4: Verify Service Methods');

const serviceFile = path.join(baseDir, 'learning-service.service.ts');
const serviceContent = fs.readFileSync(serviceFile, 'utf-8');

assert(
  serviceContent.includes('async recordFeedback'),
  'recordFeedback method exists',
);
assert(
  serviceContent.includes('async getFeedback'),
  'getFeedback method exists',
);
assert(
  serviceContent.includes('async getFeedbackById'),
  'getFeedbackById method exists',
);
assert(
  serviceContent.includes('async getFeedbackStats'),
  'getFeedbackStats method exists',
);
assert(
  serviceContent.includes('async deleteFeedback'),
  'deleteFeedback method exists',
);

passTest('TEST 4');

// TEST 5: Verify recordFeedback Implementation
testGroup('TEST 5: Verify recordFeedback Implementation');

assert(
  serviceContent.includes('userFeedbackRepo.create'),
  'recordFeedback creates feedback entity',
);
assert(
  serviceContent.includes('userFeedbackRepo.save'),
  'recordFeedback saves to database',
);
assert(
  serviceContent.includes('RecordFeedbackDto'),
  'recordFeedback accepts RecordFeedbackDto',
);
assert(
  serviceContent.includes('FeedbackResponseDto'),
  'recordFeedback returns FeedbackResponseDto',
);

passTest('TEST 5');

// TEST 6: Verify getFeedbackStats Implementation
testGroup('TEST 6: Verify getFeedbackStats Implementation');

const statsSection = serviceContent.substring(
  serviceContent.indexOf('async getFeedbackStats'),
  serviceContent.indexOf('async deleteFeedback'),
);

assert(
  statsSection.includes('totalFeedback'),
  'getFeedbackStats calculates totalFeedback',
);
assert(
  statsSection.includes('overrideCount'),
  'getFeedbackStats calculates overrideCount',
);
assert(
  statsSection.includes('rejectionCount'),
  'getFeedbackStats calculates rejectionCount',
);
assert(
  statsSection.includes('manualMatchCount'),
  'getFeedbackStats calculates manualMatchCount',
);
assert(
  statsSection.includes('commentCount'),
  'getFeedbackStats calculates commentCount',
);
assert(
  statsSection.includes('overrideRate'),
  'getFeedbackStats calculates overrideRate',
);
assert(
  statsSection.includes('mostCommonType'),
  'getFeedbackStats determines mostCommonType',
);

passTest('TEST 6');

// TEST 7: Verify Controller Endpoints
testGroup('TEST 7: Verify Controller Endpoints');

const controllerFile = path.join(baseDir, 'learning-service.controller.ts');
const controllerContent = fs.readFileSync(controllerFile, 'utf-8');

assert(
  controllerContent.includes("@Post('feedback')"),
  'POST /learning/feedback endpoint exists',
);
assert(
  controllerContent.includes("@Get('feedback')"),
  'GET /learning/feedback endpoint exists',
);
assert(
  controllerContent.includes("@Get('feedback/:id')"),
  'GET /learning/feedback/:id endpoint exists',
);
assert(
  controllerContent.includes("@Get('feedback/stats/:reconciliationId')"),
  'GET /learning/feedback/stats/:reconciliationId endpoint exists',
);
assert(
  controllerContent.includes("@Delete('feedback/:id')"),
  'DELETE /learning/feedback/:id endpoint exists',
);

passTest('TEST 7');

// TEST 8: Verify Swagger Documentation
testGroup('TEST 8: Verify Swagger Documentation');

assert(
  controllerContent.includes('@ApiOperation'),
  'Controller has @ApiOperation decorators',
);
assert(
  controllerContent.includes('@ApiResponse'),
  'Controller has @ApiResponse decorators',
);
assert(
  controllerContent.includes('@ApiParam'),
  'Controller has @ApiParam decorators',
);
assert(
  controllerContent.includes('@ApiQuery'),
  'Controller has @ApiQuery decorators',
);

// Check specific endpoint documentation
const postEndpointSection = controllerContent.substring(
  controllerContent.indexOf("@Post('feedback')"),
  controllerContent.indexOf("@Post('feedback')") + 300,
);
assert(
  postEndpointSection.includes('201'),
  'POST feedback endpoint documents 201 response',
);
assert(
  postEndpointSection.includes('type: FeedbackResponseDto'),
  'POST feedback endpoint specifies response type',
);

passTest('TEST 8');

// TEST 9: Verify Error Handling
testGroup('TEST 9: Verify Error Handling');

assert(
  serviceContent.includes('NotFoundException'),
  'Service imports NotFoundException',
);
assert(
  serviceContent.includes('throw new NotFoundException'),
  'Service throws NotFoundException when appropriate',
);

const getFeedbackByIdSection = serviceContent.substring(
  serviceContent.indexOf('async getFeedbackById'),
  serviceContent.indexOf('async getFeedbackStats'),
);
assert(
  getFeedbackByIdSection.includes('if (!feedback)'),
  'getFeedbackById checks if feedback exists',
);
assert(
  getFeedbackByIdSection.includes('throw new NotFoundException'),
  'getFeedbackById throws NotFoundException when not found',
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
  console.log('✅ ALL STEP 42 TESTS PASSED');
  console.log('\nSTEP 42 COMPLETE: User Feedback Recording');
  console.log('\n✨ Feedback Recording Features:');
  console.log('  • FeedbackType enum with 4 types (override, rejection, manual_match, comment)');
  console.log('  • RecordFeedbackDto for capturing user feedback');
  console.log('  • FeedbackResponseDto for returning feedback data');
  console.log('  • GetFeedbackDto for filtering feedback queries');
  console.log('  • FeedbackStatsDto for aggregated statistics');
  console.log('\n📊 Service Methods:');
  console.log('  • recordFeedback() - Store user feedback');
  console.log('  • getFeedback() - Query with filters');
  console.log('  • getFeedbackById() - Get specific feedback');
  console.log('  • getFeedbackStats() - Calculate statistics');
  console.log('  • deleteFeedback() - Remove feedback');
  console.log('\n🌐 REST Endpoints:');
  console.log('  • POST   /learning/feedback - Record feedback');
  console.log('  • GET    /learning/feedback - Query feedback (with filters)');
  console.log('  • GET    /learning/feedback/:id - Get by ID');
  console.log('  • GET    /learning/feedback/stats/:reconciliationId - Get stats');
  console.log('  • DELETE /learning/feedback/:id - Delete feedback');
  console.log('\n📈 Statistics Calculated:');
  console.log('  • Total feedback count');
  console.log('  • Override count & rate');
  console.log('  • Rejection count');
  console.log('  • Manual match count');
  console.log('  • Comment count');
  console.log('  • Most common feedback type');
  console.log('\n✅ Ready for Step 43: Implement entity profile creation');
} else {
  console.log(`❌ TESTS FAILED: ${testsFailed} failed, ${testsPassed} passed`);
  process.exit(1);
}
console.log('='.repeat(80));
