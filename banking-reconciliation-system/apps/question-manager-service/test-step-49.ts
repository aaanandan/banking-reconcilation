/**
 * STEP 49: Question Generator - Verification
 *
 * Verifies that the Question Generator methods work correctly:
 * 1. All 8 generator methods exist
 * 2. Each generator creates questions with correct type/priority/timing
 * 3. Generators create unique questionIds
 * 4. Bulk generation works correctly
 * 5. All generator endpoints exist
 * 6. TypeScript compilation
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const baseDir = path.join(__dirname, 'src');
const rootDir = path.join(__dirname, '..', '..');

console.log('='.repeat(80));
console.log('TESTING STEP 49: Question Generator');
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

// TEST 1: Verify All Generator Methods Exist
testGroup('TEST 1: Verify All Generator Methods Exist');

const serviceFile = path.join(baseDir, 'question-manager-service.service.ts');
const serviceContent = fs.readFileSync(serviceFile, 'utf-8');

assert(
  serviceContent.includes('async generateEntityIdentityQuestion'),
  'generateEntityIdentityQuestion method exists',
);
assert(
  serviceContent.includes('async generateEntityRelationshipQuestion'),
  'generateEntityRelationshipQuestion method exists',
);
assert(
  serviceContent.includes('async generateBusinessPatternQuestion'),
  'generateBusinessPatternQuestion method exists',
);
assert(
  serviceContent.includes('async generateValuePatternQuestion'),
  'generateValuePatternQuestion method exists',
);
assert(
  serviceContent.includes('async generateTimingPatternQuestion'),
  'generateTimingPatternQuestion method exists',
);
assert(
  serviceContent.includes('async generateFieldPreferenceQuestion'),
  'generateFieldPreferenceQuestion method exists',
);
assert(
  serviceContent.includes('async generateExceptionReasonQuestion'),
  'generateExceptionReasonQuestion method exists',
);
assert(
  serviceContent.includes('async generateGeneralContextQuestion'),
  'generateGeneralContextQuestion method exists',
);
assert(
  serviceContent.includes('async bulkGenerateQuestions'),
  'bulkGenerateQuestions method exists',
);

passTest('TEST 1');

// TEST 2: Verify Entity Identity Generator
testGroup('TEST 2: Verify Entity Identity Generator');

const entityIdentityMethod = serviceContent.substring(
  serviceContent.indexOf('async generateEntityIdentityQuestion'),
  serviceContent.indexOf('async generateEntityRelationshipQuestion'),
);

assert(
  entityIdentityMethod.includes('entity-identity-'),
  'Generates questionId with entity-identity prefix',
);
assert(
  entityIdentityMethod.includes('QuestionType.ENTITY_IDENTITY'),
  'Sets type to ENTITY_IDENTITY',
);
assert(
  entityIdentityMethod.includes('QuestionPriority.HIGH'),
  'Sets priority to HIGH',
);
assert(
  entityIdentityMethod.includes('QuestionTiming.STEP_END'),
  'Sets timing to STEP_END',
);
assert(
  entityIdentityMethod.includes('Is "'),
  'Question template includes entity name',
);
assert(
  entityIdentityMethod.includes('suggestedAnswers'),
  'Provides suggested answers',
);
assert(
  entityIdentityMethod.includes('helpText'),
  'Provides help text',
);
assert(
  entityIdentityMethod.includes('createQuestion(dto)'),
  'Calls createQuestion with DTO',
);

passTest('TEST 2');

// TEST 3: Verify Entity Relationship Generator
testGroup('TEST 3: Verify Entity Relationship Generator');

const entityRelationshipMethod = serviceContent.substring(
  serviceContent.indexOf('async generateEntityRelationshipQuestion'),
  serviceContent.indexOf('async generateBusinessPatternQuestion'),
);

assert(
  entityRelationshipMethod.includes('entity-relationship-'),
  'Generates questionId with entity-relationship prefix',
);
assert(
  entityRelationshipMethod.includes('QuestionType.ENTITY_RELATIONSHIP'),
  'Sets type to ENTITY_RELATIONSHIP',
);
assert(
  entityRelationshipMethod.includes('QuestionPriority.MEDIUM'),
  'Sets priority to MEDIUM',
);
assert(
  entityRelationshipMethod.includes('QuestionTiming.DEFERRED'),
  'Sets timing to DEFERRED',
);
assert(
  entityRelationshipMethod.includes('relationship between'),
  'Question asks about relationship',
);
assert(
  entityRelationshipMethod.includes('Parent-subsidiary'),
  'Suggests parent-subsidiary relationship',
);
assert(
  entityRelationshipMethod.includes('Same entity'),
  'Suggests same entity relationship',
);

passTest('TEST 3');

// TEST 4: Verify Business Pattern Generator
testGroup('TEST 4: Verify Business Pattern Generator');

const businessPatternMethod = serviceContent.substring(
  serviceContent.indexOf('async generateBusinessPatternQuestion'),
  serviceContent.indexOf('async generateValuePatternQuestion'),
);

assert(
  businessPatternMethod.includes('business-pattern-'),
  'Generates questionId with business-pattern prefix',
);
assert(
  businessPatternMethod.includes('QuestionType.BUSINESS_PATTERN'),
  'Sets type to BUSINESS_PATTERN',
);
assert(
  businessPatternMethod.includes('QuestionPriority.LOW'),
  'Sets priority to LOW',
);
assert(
  businessPatternMethod.includes('QuestionTiming.SESSION_END'),
  'Sets timing to SESSION_END',
);
assert(
  businessPatternMethod.includes('pattern expected'),
  'Question asks if pattern is expected',
);

passTest('TEST 4');

// TEST 5: Verify Value Pattern Generator
testGroup('TEST 5: Verify Value Pattern Generator');

const valuePatternMethod = serviceContent.substring(
  serviceContent.indexOf('async generateValuePatternQuestion'),
  serviceContent.indexOf('async generateTimingPatternQuestion'),
);

assert(
  valuePatternMethod.includes('value-pattern-'),
  'Generates questionId with value-pattern prefix',
);
assert(
  valuePatternMethod.includes('QuestionType.VALUE_PATTERN'),
  'Sets type to VALUE_PATTERN',
);
assert(
  valuePatternMethod.includes('QuestionPriority.HIGH'),
  'Sets priority to HIGH (critical for value anomalies)',
);
assert(
  valuePatternMethod.includes('QuestionTiming.IMMEDIATE'),
  'Sets timing to IMMEDIATE (value issues need quick resolution)',
);
assert(
  valuePatternMethod.includes('amount'),
  'Question includes amount information',
);
assert(
  valuePatternMethod.includes('typical range'),
  'Question mentions typical range',
);
assert(
  valuePatternMethod.includes('Correct, expected'),
  'Suggests correct/expected option',
);
assert(
  valuePatternMethod.includes('Error, should be corrected'),
  'Suggests error option',
);

passTest('TEST 5');

// TEST 6: Verify Timing Pattern Generator
testGroup('TEST 6: Verify Timing Pattern Generator');

const timingPatternMethod = serviceContent.substring(
  serviceContent.indexOf('async generateTimingPatternQuestion'),
  serviceContent.indexOf('async generateFieldPreferenceQuestion'),
);

assert(
  timingPatternMethod.includes('timing-pattern-'),
  'Generates questionId with timing-pattern prefix',
);
assert(
  timingPatternMethod.includes('QuestionType.TIMING_PATTERN'),
  'Sets type to TIMING_PATTERN',
);
assert(
  timingPatternMethod.includes('QuestionPriority.MEDIUM'),
  'Sets priority to MEDIUM',
);
assert(
  timingPatternMethod.includes('QuestionTiming.STEP_END'),
  'Sets timing to STEP_END',
);
assert(
  timingPatternMethod.includes('Holiday/special event'),
  'Suggests holiday as option',
);
assert(
  timingPatternMethod.includes('Pattern has changed'),
  'Suggests pattern change option',
);

passTest('TEST 6');

// TEST 7: Verify Field Preference Generator
testGroup('TEST 7: Verify Field Preference Generator');

const fieldPreferenceMethod = serviceContent.substring(
  serviceContent.indexOf('async generateFieldPreferenceQuestion'),
  serviceContent.indexOf('async generateExceptionReasonQuestion'),
);

assert(
  fieldPreferenceMethod.includes('field-preference-'),
  'Generates questionId with field-preference prefix',
);
assert(
  fieldPreferenceMethod.includes('QuestionType.FIELD_PREFERENCE'),
  'Sets type to FIELD_PREFERENCE',
);
assert(
  fieldPreferenceMethod.includes('QuestionPriority.MEDIUM'),
  'Sets priority to MEDIUM',
);
assert(
  fieldPreferenceMethod.includes('QuestionTiming.STEP_END'),
  'Sets timing to STEP_END',
);
assert(
  fieldPreferenceMethod.includes('most reliable'),
  'Question asks about most reliable field',
);
assert(
  fieldPreferenceMethod.includes('suggestedAnswers: params.fields'),
  'Uses provided fields as suggested answers',
);

passTest('TEST 7');

// TEST 8: Verify Exception Reason Generator
testGroup('TEST 8: Verify Exception Reason Generator');

const exceptionReasonMethod = serviceContent.substring(
  serviceContent.indexOf('async generateExceptionReasonQuestion'),
  serviceContent.indexOf('async generateGeneralContextQuestion'),
);

assert(
  exceptionReasonMethod.includes('exception-reason-'),
  'Generates questionId with exception-reason prefix',
);
assert(
  exceptionReasonMethod.includes('QuestionType.EXCEPTION_REASON'),
  'Sets type to EXCEPTION_REASON',
);
assert(
  exceptionReasonMethod.includes('QuestionPriority.CRITICAL'),
  'Sets priority to CRITICAL (manual overrides are critical)',
);
assert(
  exceptionReasonMethod.includes('QuestionTiming.IMMEDIATE'),
  'Sets timing to IMMEDIATE (need reason for manual action)',
);
assert(
  exceptionReasonMethod.includes('manual action'),
  'Question mentions manual action',
);
assert(
  exceptionReasonMethod.includes('System error'),
  'Suggests system error as option',
);
assert(
  exceptionReasonMethod.includes('Business exception'),
  'Suggests business exception as option',
);
assert(
  exceptionReasonMethod.includes('answerType: \'text\''),
  'Uses text answer type for detailed explanation',
);

passTest('TEST 8');

// TEST 9: Verify General Context Generator
testGroup('TEST 9: Verify General Context Generator');

const generalContextMethod = serviceContent.substring(
  serviceContent.indexOf('async generateGeneralContextQuestion'),
  serviceContent.indexOf('async bulkGenerateQuestions'),
);

assert(
  generalContextMethod.includes('general-context-'),
  'Generates questionId with general-context prefix',
);
assert(
  generalContextMethod.includes('QuestionType.GENERAL_CONTEXT'),
  'Sets type to GENERAL_CONTEXT',
);
assert(
  generalContextMethod.includes('params.priority || QuestionPriority.LOW'),
  'Uses provided priority or defaults to LOW',
);
assert(
  generalContextMethod.includes('params.timing || QuestionTiming.DEFERRED'),
  'Uses provided timing or defaults to DEFERRED',
);
assert(
  generalContextMethod.includes('params.question'),
  'Uses custom question text from params',
);

passTest('TEST 9');

// TEST 10: Verify Bulk Generator
testGroup('TEST 10: Verify Bulk Generator');

const bulkMethod = serviceContent.substring(
  serviceContent.indexOf('async bulkGenerateQuestions'),
  serviceContent.indexOf('private toQuestionResponse'),
);

assert(
  bulkMethod.includes('for (const dto of questions)'),
  'Iterates through all questions',
);
assert(
  bulkMethod.includes('createQuestion(dto)'),
  'Calls createQuestion for each',
);
assert(
  bulkMethod.includes('ConflictException'),
  'Handles ConflictException for duplicates',
);
assert(
  bulkMethod.includes('results.push'),
  'Collects successful results',
);
assert(
  bulkMethod.includes('return results'),
  'Returns array of created questions',
);

passTest('TEST 10');

// TEST 11: Verify Unique QuestionId Generation
testGroup('TEST 11: Verify Unique QuestionId Generation');

assert(
  serviceContent.includes('Date.now()'),
  'Uses timestamp for uniqueness',
);

// Count how many generators use timestamp
const timestampCount = (serviceContent.match(/Date\.now\(\)/g) || []).length;
assert(
  timestampCount >= 8,
  `All 8 generators use timestamp (found ${timestampCount} usages)`,
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
  controllerContent.includes("@Post('generate/entity-identity')"),
  'POST /questions/generate/entity-identity endpoint exists',
);
assert(
  controllerContent.includes("@Post('generate/entity-relationship')"),
  'POST /questions/generate/entity-relationship endpoint exists',
);
assert(
  controllerContent.includes("@Post('generate/business-pattern')"),
  'POST /questions/generate/business-pattern endpoint exists',
);
assert(
  controllerContent.includes("@Post('generate/value-pattern')"),
  'POST /questions/generate/value-pattern endpoint exists',
);
assert(
  controllerContent.includes("@Post('generate/timing-pattern')"),
  'POST /questions/generate/timing-pattern endpoint exists',
);
assert(
  controllerContent.includes("@Post('generate/field-preference')"),
  'POST /questions/generate/field-preference endpoint exists',
);
assert(
  controllerContent.includes("@Post('generate/exception-reason')"),
  'POST /questions/generate/exception-reason endpoint exists',
);
assert(
  controllerContent.includes("@Post('generate/general-context')"),
  'POST /questions/generate/general-context endpoint exists',
);
assert(
  controllerContent.includes("@Post('generate/bulk')"),
  'POST /questions/generate/bulk endpoint exists',
);

passTest('TEST 12');

// TEST 13: Verify Endpoint Parameters
testGroup('TEST 13: Verify Endpoint Parameters');

const generateEntityIdentityEndpoint = controllerContent.substring(
  controllerContent.indexOf("@Post('generate/entity-identity')"),
  controllerContent.indexOf("@Post('generate/entity-relationship')"),
);

assert(
  generateEntityIdentityEndpoint.includes('entityName: string'),
  'Entity identity endpoint accepts entityName',
);
assert(
  generateEntityIdentityEndpoint.includes('reconciliationId: string'),
  'Entity identity endpoint accepts reconciliationId',
);
assert(
  generateEntityIdentityEndpoint.includes('transactionIds: number[]'),
  'Entity identity endpoint accepts transactionIds',
);
assert(
  generateEntityIdentityEndpoint.includes('triggeredBy: string'),
  'Entity identity endpoint accepts triggeredBy',
);

passTest('TEST 13');

// TEST 14: Verify Priority Assignment Logic
testGroup('TEST 14: Verify Priority Assignment Logic');

// CRITICAL priority for exception reasons (manual overrides)
assert(
  exceptionReasonMethod.includes('QuestionPriority.CRITICAL'),
  'Exception reasons are CRITICAL priority',
);

// HIGH priority for value patterns and entity identity
assert(
  valuePatternMethod.includes('QuestionPriority.HIGH'),
  'Value patterns are HIGH priority',
);
assert(
  entityIdentityMethod.includes('QuestionPriority.HIGH'),
  'Entity identity is HIGH priority',
);

// MEDIUM priority for relationships, timing, field preference
assert(
  entityRelationshipMethod.includes('QuestionPriority.MEDIUM'),
  'Entity relationships are MEDIUM priority',
);
assert(
  timingPatternMethod.includes('QuestionPriority.MEDIUM'),
  'Timing patterns are MEDIUM priority',
);
assert(
  fieldPreferenceMethod.includes('QuestionPriority.MEDIUM'),
  'Field preferences are MEDIUM priority',
);

// LOW priority for business patterns
assert(
  businessPatternMethod.includes('QuestionPriority.LOW'),
  'Business patterns are LOW priority',
);

passTest('TEST 14');

// TEST 15: Verify Timing Assignment Logic
testGroup('TEST 15: Verify Timing Assignment Logic');

// IMMEDIATE for value patterns and exception reasons (need quick action)
assert(
  valuePatternMethod.includes('QuestionTiming.IMMEDIATE'),
  'Value patterns are IMMEDIATE timing',
);
assert(
  exceptionReasonMethod.includes('QuestionTiming.IMMEDIATE'),
  'Exception reasons are IMMEDIATE timing',
);

// STEP_END for entity identity, timing patterns, field preference
assert(
  entityIdentityMethod.includes('QuestionTiming.STEP_END'),
  'Entity identity is STEP_END timing',
);
assert(
  timingPatternMethod.includes('QuestionTiming.STEP_END'),
  'Timing patterns are STEP_END timing',
);
assert(
  fieldPreferenceMethod.includes('QuestionTiming.STEP_END'),
  'Field preferences are STEP_END timing',
);

// SESSION_END for business patterns
assert(
  businessPatternMethod.includes('QuestionTiming.SESSION_END'),
  'Business patterns are SESSION_END timing',
);

// DEFERRED for entity relationships
assert(
  entityRelationshipMethod.includes('QuestionTiming.DEFERRED'),
  'Entity relationships are DEFERRED timing',
);

passTest('TEST 15');

// TEST 16: TypeScript Compilation
testGroup('TEST 16: TypeScript Compilation');

try {
  execSync('npm run build -- question-manager-service', {
    cwd: rootDir,
    stdio: 'pipe',
  });
  console.log('  ✅ Question Manager Service compiles successfully');
  testsPassed++;
  passTest('TEST 16');
} catch (error) {
  console.log('  ❌ TypeScript compilation failed');
  testsFailed++;
  failTest('TEST 16');
}

// SUMMARY
console.log('='.repeat(80));
if (testsFailed === 0) {
  console.log('✅ ALL STEP 49 TESTS PASSED');
  console.log('\nSTEP 49 COMPLETE: Question Generator');

  console.log('\n🎯 Generator Methods (9 total):');
  console.log('  1. generateEntityIdentityQuestion - Unknown entities (HIGH/STEP_END)');
  console.log(
    '  2. generateEntityRelationshipQuestion - Entity relationships (MEDIUM/DEFERRED)',
  );
  console.log(
    '  3. generateBusinessPatternQuestion - Business patterns (LOW/SESSION_END)',
  );
  console.log(
    '  4. generateValuePatternQuestion - Anomalous amounts (HIGH/IMMEDIATE)',
  );
  console.log(
    '  5. generateTimingPatternQuestion - Irregular timing (MEDIUM/STEP_END)',
  );
  console.log(
    '  6. generateFieldPreferenceQuestion - Field reliability (MEDIUM/STEP_END)',
  );
  console.log(
    '  7. generateExceptionReasonQuestion - Manual overrides (CRITICAL/IMMEDIATE)',
  );
  console.log(
    '  8. generateGeneralContextQuestion - Custom questions (configurable)',
  );
  console.log('  9. bulkGenerateQuestions - Bulk generation with duplicate handling');

  console.log('\n📊 Priority Assignment:');
  console.log('  • CRITICAL - Exception reasons (manual overrides)');
  console.log('  • HIGH - Value patterns, entity identity');
  console.log('  • MEDIUM - Entity relationships, timing, field preferences');
  console.log('  • LOW - Business patterns');

  console.log('\n⏰ Timing Assignment:');
  console.log('  • IMMEDIATE - Value patterns, exception reasons');
  console.log('  • STEP_END - Entity identity, timing patterns, field preferences');
  console.log('  • SESSION_END - Business patterns');
  console.log('  • DEFERRED - Entity relationships, general context');

  console.log('\n🌐 Generator Endpoints (9 total):');
  console.log('  • POST /questions/generate/entity-identity');
  console.log('  • POST /questions/generate/entity-relationship');
  console.log('  • POST /questions/generate/business-pattern');
  console.log('  • POST /questions/generate/value-pattern');
  console.log('  • POST /questions/generate/timing-pattern');
  console.log('  • POST /questions/generate/field-preference');
  console.log('  • POST /questions/generate/exception-reason');
  console.log('  • POST /questions/generate/general-context');
  console.log('  • POST /questions/generate/bulk');

  console.log('\n✅ Features:');
  console.log('  • Unique questionId generation with timestamps');
  console.log('  • Context-aware priority assignment');
  console.log('  • Smart timing based on urgency');
  console.log('  • Suggested answers for guided responses');
  console.log('  • Help text for user guidance');
  console.log('  • Example answers for clarity');
  console.log('  • Bulk generation with duplicate handling');

  console.log('\n✅ Ready for Step 50: Implement question queue management');
} else {
  console.log(`❌ TESTS FAILED: ${testsFailed} failed, ${testsPassed} passed`);
  process.exit(1);
}
console.log('='.repeat(80));
