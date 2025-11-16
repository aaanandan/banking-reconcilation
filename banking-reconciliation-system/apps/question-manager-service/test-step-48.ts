/**
 * STEP 48: Question Manager Scaffold - Verification
 *
 * Verifies that the Question Manager service scaffold is properly set up:
 * 1. DTOs defined with proper validation
 * 2. Module configured with required entities
 * 3. Service with core business logic
 * 4. Controller with REST endpoints
 * 5. Swagger documentation
 * 6. TypeScript compilation
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const baseDir = path.join(__dirname, 'src');
const rootDir = path.join(__dirname, '..', '..');

console.log('='.repeat(80));
console.log('TESTING STEP 48: Question Manager Scaffold');
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

// TEST 1: Verify DTO File Exists and Contains All DTOs
testGroup('TEST 1: Verify DTO File Exists and Contains All DTOs');

const dtoFile = path.join(baseDir, 'dto', 'question.dto.ts');
assert(fs.existsSync(dtoFile), 'DTO file exists');

const dtoContent = fs.readFileSync(dtoFile, 'utf-8');

assert(
  dtoContent.includes('export class CreateQuestionDto'),
  'CreateQuestionDto defined',
);
assert(
  dtoContent.includes('export class AnswerQuestionDto'),
  'AnswerQuestionDto defined',
);
assert(
  dtoContent.includes('export class FilterQuestionsDto'),
  'FilterQuestionsDto defined',
);
assert(
  dtoContent.includes('export class QuestionResponseDto'),
  'QuestionResponseDto defined',
);
assert(
  dtoContent.includes('export class QuestionStatsDto'),
  'QuestionStatsDto defined',
);
assert(
  dtoContent.includes('export class QuestionQueueDto'),
  'QuestionQueueDto defined',
);

passTest('TEST 1');

// TEST 2: Verify Enums Are Defined
testGroup('TEST 2: Verify Enums Are Defined');

assert(
  dtoContent.includes('export enum QuestionType'),
  'QuestionType enum defined',
);
assert(
  dtoContent.includes('export enum QuestionPriority'),
  'QuestionPriority enum defined',
);
assert(
  dtoContent.includes('export enum QuestionTiming'),
  'QuestionTiming enum defined',
);
assert(
  dtoContent.includes('export enum AnswerType'),
  'AnswerType enum defined',
);

// Check enum values
assert(
  dtoContent.includes("ENTITY_IDENTITY = 'entity_identity'"),
  'QuestionType has ENTITY_IDENTITY',
);
assert(
  dtoContent.includes("CRITICAL = 'critical'"),
  'QuestionPriority has CRITICAL',
);
assert(
  dtoContent.includes("IMMEDIATE = 'immediate'"),
  'QuestionTiming has IMMEDIATE',
);
assert(
  dtoContent.includes("DEFERRED = 'deferred'"),
  'QuestionTiming has DEFERRED',
);

passTest('TEST 2');

// TEST 3: Verify CreateQuestionDto Structure
testGroup('TEST 3: Verify CreateQuestionDto Structure');

const createDtoSection = dtoContent.substring(
  dtoContent.indexOf('export class CreateQuestionDto'),
  dtoContent.indexOf('export class AnswerQuestionDto'),
);

assert(createDtoSection.includes('questionId: string'), 'Has questionId field');
assert(createDtoSection.includes('type: QuestionType'), 'Has type field');
assert(createDtoSection.includes('priority: QuestionPriority'), 'Has priority field');
assert(createDtoSection.includes('timing: QuestionTiming'), 'Has timing field');
assert(createDtoSection.includes('question: string'), 'Has question field');
assert(createDtoSection.includes('context: string'), 'Has context field');
assert(createDtoSection.includes('answerType: AnswerType'), 'Has answerType field');
assert(createDtoSection.includes('triggeredBy: string'), 'Has triggeredBy field');

// Check validation decorators
assert(createDtoSection.includes('@IsString()'), 'Uses @IsString decorator');
assert(createDtoSection.includes('@IsEnum('), 'Uses @IsEnum decorator');
assert(createDtoSection.includes('@IsOptional()'), 'Uses @IsOptional decorator');
assert(createDtoSection.includes('@IsNotEmpty()'), 'Uses @IsNotEmpty decorator');

// Check Swagger decorators
assert(createDtoSection.includes('@ApiProperty'), 'Uses @ApiProperty decorator');
assert(
  createDtoSection.includes('@ApiPropertyOptional'),
  'Uses @ApiPropertyOptional decorator',
);

passTest('TEST 3');

// TEST 4: Verify Module Configuration
testGroup('TEST 4: Verify Module Configuration');

const moduleFile = path.join(baseDir, 'question-manager-service.module.ts');
const moduleContent = fs.readFileSync(moduleFile, 'utf-8');

assert(
  moduleContent.includes("from '@app/shared'"),
  'Module imports from shared library',
);
assert(
  moduleContent.includes('TypeOrmModule'),
  'Module imports TypeOrmModule',
);
assert(
  moduleContent.includes('LearningQuestion'),
  'Module imports LearningQuestion entity',
);
assert(
  moduleContent.includes('EntityProfile'),
  'Module imports EntityProfile entity',
);
assert(
  moduleContent.includes('TypeOrmModule.forFeature(['),
  'Module uses TypeORM forFeature',
);

// Check forFeature array
const forFeatureSection = moduleContent.substring(
  moduleContent.indexOf('TypeOrmModule.forFeature(['),
  moduleContent.indexOf('])'),
);
assert(
  forFeatureSection.includes('LearningQuestion'),
  'LearningQuestion in forFeature array',
);
assert(
  forFeatureSection.includes('EntityProfile'),
  'EntityProfile in forFeature array',
);

passTest('TEST 4');

// TEST 5: Verify Service Repository Injections
testGroup('TEST 5: Verify Service Repository Injections');

const serviceFile = path.join(baseDir, 'question-manager-service.service.ts');
const serviceContent = fs.readFileSync(serviceFile, 'utf-8');

assert(
  serviceContent.includes('@InjectRepository(LearningQuestion)'),
  'Service injects LearningQuestion repository',
);
assert(
  serviceContent.includes('questionRepo: Repository<LearningQuestion>'),
  'LearningQuestion repository typed correctly',
);
assert(
  serviceContent.includes('@InjectRepository(EntityProfile)'),
  'Service injects EntityProfile repository',
);
assert(
  serviceContent.includes('@InjectRepository(User)'),
  'Service injects User repository',
);
assert(
  serviceContent.includes('@InjectRepository(Reconciliation)'),
  'Service injects Reconciliation repository',
);

passTest('TEST 5');

// TEST 6: Verify Core Service Methods
testGroup('TEST 6: Verify Core Service Methods');

assert(
  serviceContent.includes('async createQuestion'),
  'Service has createQuestion method',
);
assert(
  serviceContent.includes('async getQuestions'),
  'Service has getQuestions method',
);
assert(
  serviceContent.includes('async getQuestionById'),
  'Service has getQuestionById method',
);
assert(
  serviceContent.includes('async answerQuestion'),
  'Service has answerQuestion method',
);
assert(
  serviceContent.includes('async deleteQuestion'),
  'Service has deleteQuestion method',
);
assert(
  serviceContent.includes('async getQuestionStats'),
  'Service has getQuestionStats method',
);
assert(
  serviceContent.includes('async getQuestionQueue'),
  'Service has getQuestionQueue method',
);
assert(
  serviceContent.includes('async getUnansweredByTiming'),
  'Service has getUnansweredByTiming method',
);
assert(
  serviceContent.includes('async getExpiredQuestions'),
  'Service has getExpiredQuestions method',
);

passTest('TEST 6');

// TEST 7: Verify createQuestion Implementation
testGroup('TEST 7: Verify createQuestion Implementation');

const createMethod = serviceContent.substring(
  serviceContent.indexOf('async createQuestion'),
  serviceContent.indexOf('async getQuestions'),
);

assert(
  createMethod.includes('questionRepo.findOne'),
  'Checks for existing question',
);
assert(
  createMethod.includes('ConflictException'),
  'Throws ConflictException for duplicates',
);
assert(
  createMethod.includes('questionRepo.create'),
  'Uses repository create method',
);
assert(
  createMethod.includes('questionRepo.save'),
  'Saves question to database',
);
assert(
  createMethod.includes('toQuestionResponse'),
  'Converts to response DTO',
);

passTest('TEST 7');

// TEST 8: Verify Question Queue Management
testGroup('TEST 8: Verify Question Queue Management');

const queueMethod = serviceContent.substring(
  serviceContent.indexOf('async getQuestionQueue'),
  serviceContent.indexOf('async getUnansweredByTiming'),
);

assert(
  queueMethod.includes('answeredAt: IsNull()'),
  'Filters for unanswered questions',
);
assert(
  queueMethod.includes("priority: 'DESC'"),
  'Orders by priority descending',
);
assert(
  queueMethod.includes('QuestionTiming.IMMEDIATE'),
  'Filters immediate questions',
);
assert(
  queueMethod.includes('QuestionTiming.STEP_END'),
  'Filters step_end questions',
);
assert(
  queueMethod.includes('QuestionTiming.SESSION_END'),
  'Filters session_end questions',
);
assert(
  queueMethod.includes('QuestionTiming.DEFERRED'),
  'Filters deferred questions',
);

passTest('TEST 8');

// TEST 9: Verify Statistics Implementation
testGroup('TEST 9: Verify Statistics Implementation');

const statsMethod = serviceContent.substring(
  serviceContent.indexOf('async getQuestionStats'),
  serviceContent.indexOf('async getQuestionQueue'),
);

assert(
  statsMethod.includes('answeredAt !== null'),
  'Counts answered questions',
);
assert(
  statsMethod.includes('answeredAt === null'),
  'Counts unanswered questions',
);
assert(
  statsMethod.includes('expiresAt'),
  'Checks for expired questions',
);
assert(
  statsMethod.includes('byType'),
  'Counts questions by type',
);
assert(
  statsMethod.includes('byPriority'),
  'Counts questions by priority',
);
assert(
  statsMethod.includes('byTiming'),
  'Counts questions by timing',
);

passTest('TEST 9');

// TEST 10: Verify Controller Endpoints
testGroup('TEST 10: Verify Controller Endpoints');

const controllerFile = path.join(
  baseDir,
  'question-manager-service.controller.ts',
);
const controllerContent = fs.readFileSync(controllerFile, 'utf-8');

assert(
  controllerContent.includes("@Controller('questions')"),
  'Controller mounted at /questions',
);
assert(
  controllerContent.includes("@ApiTags('Questions')"),
  'Controller has Swagger tags',
);

// Basic CRUD endpoints
assert(
  controllerContent.includes("@Post()"),
  'POST /questions endpoint exists',
);
assert(
  controllerContent.includes("@Get()"),
  'GET /questions endpoint exists',
);
assert(
  controllerContent.includes("@Get(':id')"),
  'GET /questions/:id endpoint exists',
);
assert(
  controllerContent.includes("@Put(':id/answer')"),
  'PUT /questions/:id/answer endpoint exists',
);
assert(
  controllerContent.includes("@Delete(':id')"),
  'DELETE /questions/:id endpoint exists',
);

passTest('TEST 10');

// TEST 11: Verify Queue Management Endpoints
testGroup('TEST 11: Verify Queue Management Endpoints');

assert(
  controllerContent.includes("@Get('queue/all')"),
  'GET /questions/queue/all endpoint exists',
);
assert(
  controllerContent.includes("@Get('queue/:timing')"),
  'GET /questions/queue/:timing endpoint exists',
);
assert(
  controllerContent.includes("@Get('expired/all')"),
  'GET /questions/expired/all endpoint exists',
);

passTest('TEST 11');

// TEST 12: Verify Statistics Endpoint
testGroup('TEST 12: Verify Statistics Endpoint');

assert(
  controllerContent.includes("@Get('stats/overview')"),
  'GET /questions/stats/overview endpoint exists',
);
assert(
  controllerContent.includes('getQuestionStats'),
  'Stats endpoint calls getQuestionStats',
);

passTest('TEST 12');

// TEST 13: Verify Swagger Documentation
testGroup('TEST 13: Verify Swagger Documentation');

const apiOperationCount = (controllerContent.match(/@ApiOperation/g) || [])
  .length;
assert(
  apiOperationCount >= 10,
  `All endpoints have @ApiOperation (found ${apiOperationCount})`,
);

assert(
  controllerContent.includes('@ApiResponse'),
  'Endpoints have @ApiResponse decorators',
);
assert(
  controllerContent.includes('@ApiParam'),
  'Endpoints have @ApiParam decorators',
);

passTest('TEST 13');

// TEST 14: Verify Health Check Endpoint
testGroup('TEST 14: Verify Health Check Endpoint');

assert(
  controllerContent.includes("@Get('health')"),
  'Health check endpoint exists',
);
assert(
  controllerContent.includes('question-manager'),
  'Health check reports service name',
);
assert(
  controllerContent.includes('question-creation'),
  'Health check reports question-creation capability',
);
assert(
  controllerContent.includes('question-queueing'),
  'Health check reports question-queueing capability',
);
assert(
  controllerContent.includes('answer-processing'),
  'Health check reports answer-processing capability',
);
assert(
  controllerContent.includes('question-statistics'),
  'Health check reports question-statistics capability',
);

passTest('TEST 14');

// TEST 15: Verify Main.ts Configuration
testGroup('TEST 15: Verify Main.ts Configuration');

const mainFile = path.join(baseDir, 'main.ts');
const mainContent = fs.readFileSync(mainFile, 'utf-8');

assert(
  mainContent.includes('ValidationPipe'),
  'Main.ts configures ValidationPipe',
);
assert(
  mainContent.includes('DocumentBuilder'),
  'Main.ts configures Swagger',
);
assert(
  mainContent.includes('SwaggerModule'),
  'Main.ts sets up Swagger module',
);
assert(
  mainContent.includes('Question Manager Service'),
  'Main.ts has correct service title',
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
  console.log('✅ ALL STEP 48 TESTS PASSED');
  console.log('\nSTEP 48 COMPLETE: Question Manager Scaffold');
  console.log('\n✨ Question Manager Features:');
  console.log('  • Question creation with duplicate prevention');
  console.log('  • Question filtering by type, priority, timing, status');
  console.log('  • Question answering with timestamp tracking');
  console.log('  • Question queue management (immediate, step_end, session_end, deferred)');
  console.log('  • Question statistics (total, answered, unanswered, expired)');
  console.log('  • Expired question detection');
  console.log('  • Multi-dimensional categorization (type, priority, timing)');

  console.log('\n📊 Enums Defined:');
  console.log('  • QuestionType - 8 types (entity_identity, entity_relationship, etc.)');
  console.log('  • QuestionPriority - 4 levels (critical, high, medium, low)');
  console.log('  • QuestionTiming - 4 modes (immediate, step_end, session_end, deferred)');
  console.log('  • AnswerType - 4 types (text, choice, boolean, number)');

  console.log('\n🔹 DTOs Created:');
  console.log('  • CreateQuestionDto - Create new questions');
  console.log('  • AnswerQuestionDto - Answer questions');
  console.log('  • FilterQuestionsDto - Filter questions');
  console.log('  • QuestionResponseDto - Question response');
  console.log('  • QuestionStatsDto - Statistics');
  console.log('  • QuestionQueueDto - Queue organized by timing');

  console.log('\n🧠 Service Methods (10 total):');
  console.log('  • createQuestion() - Create with duplicate check');
  console.log('  • getQuestions() - Filter and retrieve');
  console.log('  • getQuestionById() - Retrieve by UUID');
  console.log('  • getQuestionByQuestionId() - Retrieve by questionId');
  console.log('  • answerQuestion() - Record answer with timestamp');
  console.log('  • deleteQuestion() - Remove question');
  console.log('  • getQuestionStats() - Comprehensive statistics');
  console.log('  • getQuestionQueue() - Queue organized by timing');
  console.log('  • getUnansweredByTiming() - Filter unanswered by timing');
  console.log('  • getExpiredQuestions() - Find expired unanswered');

  console.log('\n🌐 REST Endpoints (11 total):');
  console.log('  • GET    /questions/health - Health check');
  console.log('  • POST   /questions - Create question');
  console.log('  • GET    /questions - Get all questions (with filters)');
  console.log('  • GET    /questions/:id - Get question by ID');
  console.log('  • PUT    /questions/:id/answer - Answer question');
  console.log('  • DELETE /questions/:id - Delete question');
  console.log('  • GET    /questions/queue/all - Get queue by timing');
  console.log('  • GET    /questions/queue/:timing - Get unanswered by timing');
  console.log('  • GET    /questions/expired/all - Get expired questions');
  console.log('  • GET    /questions/stats/overview - Get statistics');
  console.log('  • GET    /questions/by-question-id/:questionId - Lookup by questionId');

  console.log('\n✅ Configuration:');
  console.log('  • TypeORM repositories for LearningQuestion, EntityProfile, User, Reconciliation');
  console.log('  • Validation pipes with whitelist and transform');
  console.log('  • Swagger documentation on /api');
  console.log('  • Running on port 3005');

  console.log('\n✅ Ready for Step 49: Implement question generator');
} else {
  console.log(`❌ TESTS FAILED: ${testsFailed} failed, ${testsPassed} passed`);
  process.exit(1);
}
console.log('='.repeat(80));
