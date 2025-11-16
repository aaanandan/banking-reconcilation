/**
 * STEP 50: Question Queue Management - Verification
 *
 * Verifies that the Queue Management methods work correctly:
 * 1. All queue management methods exist
 * 2. Bulk operations (answer, delete, update priority/timing)
 * 3. Clear answered questions
 * 4. Expire questions by criteria
 * 5. Queue metrics and analytics
 * 6. Reorder queue
 * 7. Immediate attention filtering
 * 8. Reconciliation-based grouping
 * 9. All queue endpoints exist
 * 10. TypeScript compilation
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const baseDir = path.join(__dirname, 'src');
const rootDir = path.join(__dirname, '..', '..');

console.log('='.repeat(80));
console.log('TESTING STEP 50: Question Queue Management');
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

// TEST 1: Verify All Queue Management Methods Exist
testGroup('TEST 1: Verify All Queue Management Methods Exist');

const serviceFile = path.join(baseDir, 'question-manager-service.service.ts');
const serviceContent = fs.readFileSync(serviceFile, 'utf-8');

assert(
  serviceContent.includes('async bulkAnswerQuestions'),
  'bulkAnswerQuestions method exists',
);
assert(
  serviceContent.includes('async bulkDeleteQuestions'),
  'bulkDeleteQuestions method exists',
);
assert(
  serviceContent.includes('async bulkUpdatePriority'),
  'bulkUpdatePriority method exists',
);
assert(
  serviceContent.includes('async bulkUpdateTiming'),
  'bulkUpdateTiming method exists',
);
assert(
  serviceContent.includes('async clearAnsweredQuestions'),
  'clearAnsweredQuestions method exists',
);
assert(
  serviceContent.includes('async expireQuestions'),
  'expireQuestions method exists',
);
assert(
  serviceContent.includes('async getQueueMetrics'),
  'getQueueMetrics method exists',
);
assert(
  serviceContent.includes('async reorderQueue'),
  'reorderQueue method exists',
);
assert(
  serviceContent.includes('async getImmediateAttentionQuestions'),
  'getImmediateAttentionQuestions method exists',
);
assert(
  serviceContent.includes('async getQuestionsByReconciliation'),
  'getQuestionsByReconciliation method exists',
);

passTest('TEST 1');

// TEST 2: Verify Bulk Answer Implementation
testGroup('TEST 2: Verify Bulk Answer Implementation');

const bulkAnswerMethod = serviceContent.substring(
  serviceContent.indexOf('async bulkAnswerQuestions'),
  serviceContent.indexOf('async bulkDeleteQuestions'),
);

assert(
  bulkAnswerMethod.includes('for (const item of answers)'),
  'Iterates through all answers',
);
assert(
  bulkAnswerMethod.includes('answerQuestion(item.id'),
  'Calls answerQuestion for each',
);
assert(
  bulkAnswerMethod.includes('NotFoundException'),
  'Handles NotFoundException',
);
assert(
  bulkAnswerMethod.includes('results.push'),
  'Collects results',
);
assert(
  bulkAnswerMethod.includes('return results'),
  'Returns array of answered questions',
);

passTest('TEST 2');

// TEST 3: Verify Bulk Delete Implementation
testGroup('TEST 3: Verify Bulk Delete Implementation');

const bulkDeleteMethod = serviceContent.substring(
  serviceContent.indexOf('async bulkDeleteQuestions'),
  serviceContent.indexOf('async bulkUpdatePriority'),
);

assert(
  bulkDeleteMethod.includes('let deleted = 0'),
  'Tracks deletion count',
);
assert(
  bulkDeleteMethod.includes('for (const id of ids)'),
  'Iterates through all IDs',
);
assert(
  bulkDeleteMethod.includes('deleteQuestion(id)'),
  'Calls deleteQuestion for each',
);
assert(
  bulkDeleteMethod.includes('deleted++'),
  'Increments counter on success',
);
assert(
  bulkDeleteMethod.includes('return { deleted }'),
  'Returns deletion count',
);

passTest('TEST 3');

// TEST 4: Verify Bulk Update Priority Implementation
testGroup('TEST 4: Verify Bulk Update Priority Implementation');

const bulkUpdatePriorityMethod = serviceContent.substring(
  serviceContent.indexOf('async bulkUpdatePriority'),
  serviceContent.indexOf('async bulkUpdateTiming'),
);

assert(
  bulkUpdatePriorityMethod.includes('questionRepo.findOne'),
  'Finds question by ID',
);
assert(
  bulkUpdatePriorityMethod.includes('question.priority = priority'),
  'Updates priority',
);
assert(
  bulkUpdatePriorityMethod.includes('questionRepo.save'),
  'Saves updated question',
);
assert(
  bulkUpdatePriorityMethod.includes('toQuestionResponse'),
  'Converts to response DTO',
);

passTest('TEST 4');

// TEST 5: Verify Bulk Update Timing Implementation
testGroup('TEST 5: Verify Bulk Update Timing Implementation');

const bulkUpdateTimingMethod = serviceContent.substring(
  serviceContent.indexOf('async bulkUpdateTiming'),
  serviceContent.indexOf('async clearAnsweredQuestions'),
);

assert(
  bulkUpdateTimingMethod.includes('questionRepo.findOne'),
  'Finds question by ID',
);
assert(
  bulkUpdateTimingMethod.includes('question.timing = timing'),
  'Updates timing',
);
assert(
  bulkUpdateTimingMethod.includes('questionRepo.save'),
  'Saves updated question',
);
assert(
  bulkUpdateTimingMethod.includes('toQuestionResponse'),
  'Converts to response DTO',
);

passTest('TEST 5');

// TEST 6: Verify Clear Answered Questions Implementation
testGroup('TEST 6: Verify Clear Answered Questions Implementation');

const clearAnsweredMethod = serviceContent.substring(
  serviceContent.indexOf('async clearAnsweredQuestions'),
  serviceContent.indexOf('async expireQuestions'),
);

assert(
  clearAnsweredMethod.includes('createQueryBuilder'),
  'Uses query builder',
);
assert(
  clearAnsweredMethod.includes('answeredAt IS NOT NULL'),
  'Filters for answered questions',
);
assert(
  clearAnsweredMethod.includes('beforeDate'),
  'Supports optional date filter',
);
assert(
  clearAnsweredMethod.includes('questionRepo.remove'),
  'Removes questions',
);
assert(
  clearAnsweredMethod.includes('cleared: questions.length'),
  'Returns count of cleared questions',
);

passTest('TEST 6');

// TEST 7: Verify Expire Questions Implementation
testGroup('TEST 7: Verify Expire Questions Implementation');

const expireQuestionsMethod = serviceContent.substring(
  serviceContent.indexOf('async expireQuestions'),
  serviceContent.indexOf('async getQueueMetrics'),
);

assert(
  expireQuestionsMethod.includes('olderThanDays'),
  'Supports olderThanDays parameter',
);
assert(
  expireQuestionsMethod.includes('setDate'),
  'Calculates cutoff date',
);
assert(
  expireQuestionsMethod.includes('params.timing'),
  'Supports timing filter',
);
assert(
  expireQuestionsMethod.includes('params.type'),
  'Supports type filter',
);
assert(
  expireQuestionsMethod.includes('question.expiresAt = now'),
  'Sets expiration date',
);
assert(
  expireQuestionsMethod.includes('questionRepo.save'),
  'Saves expired questions',
);
assert(
  expireQuestionsMethod.includes('expired: questions.length'),
  'Returns count of expired questions',
);

passTest('TEST 7');

// TEST 8: Verify Queue Metrics Implementation
testGroup('TEST 8: Verify Queue Metrics Implementation');

const queueMetricsMethod = serviceContent.substring(
  serviceContent.indexOf('async getQueueMetrics'),
  serviceContent.indexOf('async reorderQueue'),
);

assert(
  queueMetricsMethod.includes('totalUnanswered'),
  'Calculates total unanswered',
);
assert(
  queueMetricsMethod.includes('byPriority'),
  'Breaks down by priority',
);
assert(
  queueMetricsMethod.includes('byTiming'),
  'Breaks down by timing',
);
assert(
  queueMetricsMethod.includes('avgTimeToAnswer'),
  'Calculates average time to answer',
);
assert(
  queueMetricsMethod.includes('oldestUnanswered'),
  'Finds oldest unanswered',
);
assert(
  queueMetricsMethod.includes('newestUnanswered'),
  'Finds newest unanswered',
);
assert(
  queueMetricsMethod.includes('answeredAt.getTime() - q.createdAt.getTime()'),
  'Calculates time difference',
);
assert(
  queueMetricsMethod.includes('1000 * 60 * 60'),
  'Converts to hours',
);

passTest('TEST 8');

// TEST 9: Verify Reorder Queue Implementation
testGroup('TEST 9: Verify Reorder Queue Implementation');

const reorderQueueMethod = serviceContent.substring(
  serviceContent.indexOf('async reorderQueue'),
  serviceContent.indexOf('async getImmediateAttentionQuestions'),
);

assert(
  reorderQueueMethod.includes('answeredAt: IsNull()'),
  'Filters for unanswered',
);
assert(
  reorderQueueMethod.includes("priority: 'DESC'"),
  'Orders by priority descending',
);
assert(
  reorderQueueMethod.includes("createdAt: 'ASC'"),
  'Orders by creation date ascending',
);
assert(
  reorderQueueMethod.includes('map((q) => this.toQuestionResponse(q))'),
  'Maps to response DTOs',
);

passTest('TEST 9');

// TEST 10: Verify Immediate Attention Implementation
testGroup('TEST 10: Verify Immediate Attention Implementation');

const immediateAttentionMethod = serviceContent.substring(
  serviceContent.indexOf('async getImmediateAttentionQuestions'),
  serviceContent.indexOf('async getQuestionsByReconciliation'),
);

assert(
  immediateAttentionMethod.includes('QuestionTiming.IMMEDIATE'),
  'Filters for IMMEDIATE timing',
);
assert(
  immediateAttentionMethod.includes('QuestionPriority.CRITICAL'),
  'Filters for CRITICAL priority',
);
assert(
  immediateAttentionMethod.includes('where: ['),
  'Uses OR condition with array',
);
assert(
  immediateAttentionMethod.includes('answeredAt: IsNull()'),
  'Filters for unanswered',
);

passTest('TEST 10');

// TEST 11: Verify Reconciliation Grouping Implementation
testGroup('TEST 11: Verify Reconciliation Grouping Implementation');

const reconciliationMethod = serviceContent.substring(
  serviceContent.indexOf('async getQuestionsByReconciliation'),
  serviceContent.indexOf('private toQuestionResponse'),
);

assert(
  reconciliationMethod.includes('relatedReconciliationId: reconciliationId'),
  'Filters by reconciliation ID',
);
assert(
  reconciliationMethod.includes('total: questions.length'),
  'Returns total count',
);
assert(
  reconciliationMethod.includes('answeredAt !== null'),
  'Counts answered',
);
assert(
  reconciliationMethod.includes('answeredAt === null'),
  'Counts unanswered',
);
assert(
  reconciliationMethod.includes('questions: questions.map'),
  'Returns question list',
);

passTest('TEST 11');

// TEST 12: Verify Controller Endpoints
testGroup('TEST 12: Verify Controller Endpoints');

const controllerFile = path.join(
  baseDir,
  'question-manager-service.controller.ts',
);
const controllerContent = fs.readFileSync(controllerFile, 'utf-8');

assert(
  controllerContent.includes("@Put('bulk/answer')"),
  'PUT /questions/bulk/answer endpoint exists',
);
assert(
  controllerContent.includes("@Delete('bulk/delete')"),
  'DELETE /questions/bulk/delete endpoint exists',
);
assert(
  controllerContent.includes("@Put('bulk/priority')"),
  'PUT /questions/bulk/priority endpoint exists',
);
assert(
  controllerContent.includes("@Put('bulk/timing')"),
  'PUT /questions/bulk/timing endpoint exists',
);
assert(
  controllerContent.includes("@Delete('answered/clear')"),
  'DELETE /questions/answered/clear endpoint exists',
);
assert(
  controllerContent.includes("@Post('expire')"),
  'POST /questions/expire endpoint exists',
);
assert(
  controllerContent.includes("@Get('queue/metrics')"),
  'GET /questions/queue/metrics endpoint exists',
);
assert(
  controllerContent.includes("@Get('queue/reorder')"),
  'GET /questions/queue/reorder endpoint exists',
);
assert(
  controllerContent.includes("@Get('queue/immediate-attention')"),
  'GET /questions/queue/immediate-attention endpoint exists',
);
assert(
  controllerContent.includes("@Get('reconciliation/:reconciliationId')"),
  'GET /questions/reconciliation/:reconciliationId endpoint exists',
);

passTest('TEST 12');

// TEST 13: Verify Endpoint Parameter Handling
testGroup('TEST 13: Verify Endpoint Parameter Handling');

const bulkAnswerEndpoint = controllerContent.substring(
  controllerContent.indexOf("@Put('bulk/answer')"),
  controllerContent.indexOf("@Delete('bulk/delete')"),
);

assert(
  bulkAnswerEndpoint.includes('Array<{ id: string; answer: any }>'),
  'Bulk answer accepts array of id/answer pairs',
);
assert(
  bulkAnswerEndpoint.includes('bulkAnswerQuestions(answers)'),
  'Passes answers to service',
);

const bulkDeleteEndpoint = controllerContent.substring(
  controllerContent.indexOf("@Delete('bulk/delete')"),
  controllerContent.indexOf("@Put('bulk/priority')"),
);

assert(
  bulkDeleteEndpoint.includes('{ ids: string[] }'),
  'Bulk delete accepts array of IDs',
);

passTest('TEST 13');

// TEST 14: Verify Error Handling
testGroup('TEST 14: Verify Error Handling');

assert(
  bulkAnswerMethod.includes('!(error instanceof NotFoundException)'),
  'Bulk answer handles NotFoundException',
);
assert(
  bulkDeleteMethod.includes('!(error instanceof NotFoundException)'),
  'Bulk delete handles NotFoundException',
);
assert(
  bulkAnswerMethod.includes('throw error'),
  'Re-throws other errors',
);

passTest('TEST 14');

// TEST 15: TypeScript Compilation
testGroup('TEST 15: TypeScript Compilation');

try {
  execSync('npm run build -- question-manager-service', {
    cwd: rootDir,
    stdio: 'pipe',
  });
  console.log('  ✅ Question Manager Service compiles successfully');
  testsPassed++;
  passTest('TEST 15');
} catch (error) {
  console.log('  ❌ TypeScript compilation failed');
  testsFailed++;
  failTest('TEST 15');
}

// SUMMARY
console.log('='.repeat(80));
if (testsFailed === 0) {
  console.log('✅ ALL STEP 50 TESTS PASSED');
  console.log('\nSTEP 50 COMPLETE: Question Queue Management');

  console.log('\n🔧 Queue Management Methods (10 total):');
  console.log(
    '  1. bulkAnswerQuestions() - Answer multiple questions at once',
  );
  console.log('  2. bulkDeleteQuestions() - Delete multiple questions at once');
  console.log('  3. bulkUpdatePriority() - Update priority for multiple questions');
  console.log('  4. bulkUpdateTiming() - Update timing for multiple questions');
  console.log(
    '  5. clearAnsweredQuestions() - Clear answered questions (optional date filter)',
  );
  console.log('  6. expireQuestions() - Expire questions by age/type/timing');
  console.log('  7. getQueueMetrics() - Get comprehensive queue analytics');
  console.log('  8. reorderQueue() - Get queue in priority order');
  console.log(
    '  9. getImmediateAttentionQuestions() - CRITICAL/IMMEDIATE questions',
  );
  console.log(
    '  10. getQuestionsByReconciliation() - Group questions by reconciliation',
  );

  console.log('\n📊 Queue Metrics Include:');
  console.log('  • Total unanswered questions');
  console.log('  • Breakdown by priority (CRITICAL/HIGH/MEDIUM/LOW)');
  console.log('  • Breakdown by timing (IMMEDIATE/STEP_END/SESSION_END/DEFERRED)');
  console.log('  • Average time to answer (in hours)');
  console.log('  • Oldest unanswered question date');
  console.log('  • Newest unanswered question date');

  console.log('\n🌐 Queue Management Endpoints (10 total):');
  console.log('  • PUT    /questions/bulk/answer - Bulk answer');
  console.log('  • DELETE /questions/bulk/delete - Bulk delete');
  console.log('  • PUT    /questions/bulk/priority - Bulk update priority');
  console.log('  • PUT    /questions/bulk/timing - Bulk update timing');
  console.log('  • DELETE /questions/answered/clear - Clear answered questions');
  console.log('  • POST   /questions/expire - Expire questions by criteria');
  console.log('  • GET    /questions/queue/metrics - Get queue metrics');
  console.log('  • GET    /questions/queue/reorder - Reorder queue');
  console.log('  • GET    /questions/queue/immediate-attention - Get urgent questions');
  console.log('  • GET    /questions/reconciliation/:id - Get questions by reconciliation');

  console.log('\n✅ Features:');
  console.log('  • Bulk operations with error handling (skip not found)');
  console.log('  • Flexible expiration by age, type, or timing');
  console.log('  • Comprehensive queue analytics');
  console.log('  • Priority-based ordering (DESC priority, ASC createdAt)');
  console.log('  • Immediate attention filtering (CRITICAL + IMMEDIATE)');
  console.log('  • Reconciliation-based grouping with counts');
  console.log('  • Average response time calculation');
  console.log('  • Optional date filtering for cleanup');

  console.log('\n✅ Ready for Step 51: Implement answer processing');
} else {
  console.log(`❌ TESTS FAILED: ${testsFailed} failed, ${testsPassed} passed`);
  process.exit(1);
}
console.log('='.repeat(80));
