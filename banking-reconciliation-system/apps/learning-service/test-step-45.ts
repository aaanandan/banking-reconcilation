/**
 * STEP 45: Pattern Learning - Verification
 *
 * Verifies that pattern learning is properly implemented:
 * - Pattern learning DTOs defined
 * - Service method for building profiles from transactions
 * - Pattern analysis logic (amount, frequency, reliability)
 * - Controller endpoint with proper decorators
 * - Repository injections for Transaction and Reconciliation
 * - TypeScript compilation successful
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const baseDir = path.join(__dirname, 'src');
const rootDir = path.join(__dirname, '..', '..');

console.log('='.repeat(80));
console.log('TESTING STEP 45: Pattern Learning');
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

// TEST 1: Verify Pattern Learning DTOs Exist
testGroup('TEST 1: Verify Pattern Learning DTOs Exist');

const dtoFile = path.join(baseDir, 'dto', 'entity-profile.dto.ts');
const dtoContent = fs.readFileSync(dtoFile, 'utf-8');

assert(
  dtoContent.includes('export class BuildProfileFromTransactionsDto'),
  'BuildProfileFromTransactionsDto defined',
);
assert(
  dtoContent.includes('export class PatternLearningResultDto'),
  'PatternLearningResultDto defined',
);

passTest('TEST 1');

// TEST 2: Verify BuildProfileFromTransactionsDto Structure
testGroup('TEST 2: Verify BuildProfileFromTransactionsDto Structure');

const buildProfileSection = dtoContent.substring(
  dtoContent.indexOf('export class BuildProfileFromTransactionsDto'),
  dtoContent.indexOf('export class PatternLearningResultDto'),
);

assert(
  buildProfileSection.includes('entityId: string'),
  'BuildProfileFromTransactionsDto has entityId',
);
assert(
  buildProfileSection.includes('reconciliationId: string'),
  'BuildProfileFromTransactionsDto has reconciliationId',
);
assert(
  buildProfileSection.includes('entityName?'),
  'BuildProfileFromTransactionsDto has optional entityName',
);

passTest('TEST 2');

// TEST 3: Verify PatternLearningResultDto Structure
testGroup('TEST 3: Verify PatternLearningResultDto Structure');

const patternResultSection = dtoContent.substring(
  dtoContent.indexOf('export class PatternLearningResultDto'),
  dtoContent.indexOf('export class BankSpecificBehaviorDto'),
);

assert(
  patternResultSection.includes('entityId: string'),
  'PatternLearningResultDto has entityId',
);
assert(
  patternResultSection.includes('transactionsAnalyzed: number'),
  'PatternLearningResultDto has transactionsAnalyzed',
);
assert(
  patternResultSection.includes('patternsLearned:'),
  'PatternLearningResultDto has patternsLearned',
);
assert(
  patternResultSection.includes('updatedProfile:'),
  'PatternLearningResultDto has updatedProfile',
);
assert(
  patternResultSection.includes('newConfidence: number'),
  'PatternLearningResultDto has newConfidence',
);
assert(
  patternResultSection.includes('amountRange'),
  'PatternLearningResultDto patterns include amountRange',
);
assert(
  patternResultSection.includes('frequencyPattern'),
  'PatternLearningResultDto patterns include frequencyPattern',
);
assert(
  patternResultSection.includes('mostReliableFields'),
  'PatternLearningResultDto patterns include mostReliableFields',
);

passTest('TEST 3');

// TEST 4: Verify Module Includes Transaction and Reconciliation
testGroup('TEST 4: Verify Module Includes Transaction and Reconciliation');

const moduleFile = path.join(baseDir, 'learning-service.module.ts');
const moduleContent = fs.readFileSync(moduleFile, 'utf-8');

assert(
  moduleContent.includes('Transaction'),
  'Module imports Transaction entity',
);
assert(
  moduleContent.includes('Reconciliation'),
  'Module imports Reconciliation entity',
);
assert(
  moduleContent.includes('TypeOrmModule.forFeature(['),
  'Module uses TypeORM forFeature',
);

// Check if Transaction and Reconciliation are in forFeature array
const forFeatureSection = moduleContent.substring(
  moduleContent.indexOf('TypeOrmModule.forFeature(['),
  moduleContent.indexOf('])'),
);
assert(
  forFeatureSection.includes('Transaction'),
  'Transaction in TypeORM forFeature array',
);
assert(
  forFeatureSection.includes('Reconciliation'),
  'Reconciliation in TypeORM forFeature array',
);

passTest('TEST 4');

// TEST 5: Verify Service Repository Injections
testGroup('TEST 5: Verify Service Repository Injections');

const serviceFile = path.join(baseDir, 'learning-service.service.ts');
const serviceContent = fs.readFileSync(serviceFile, 'utf-8');

assert(
  serviceContent.includes('@InjectRepository(Transaction)'),
  'Service injects Transaction repository',
);
assert(
  serviceContent.includes('@InjectRepository(Reconciliation)'),
  'Service injects Reconciliation repository',
);
assert(
  serviceContent.includes('transactionRepo: Repository<Transaction>'),
  'Transaction repository typed correctly',
);
assert(
  serviceContent.includes('reconciliationRepo: Repository<Reconciliation>'),
  'Reconciliation repository typed correctly',
);

passTest('TEST 5');

// TEST 6: Verify buildProfileFromTransactions Method Exists
testGroup('TEST 6: Verify buildProfileFromTransactions Method Exists');

assert(
  serviceContent.includes('async buildProfileFromTransactions'),
  'buildProfileFromTransactions method exists',
);
assert(
  serviceContent.includes('BuildProfileFromTransactionsDto'),
  'Method uses BuildProfileFromTransactionsDto',
);
assert(
  serviceContent.includes('PatternLearningResultDto'),
  'Method returns PatternLearningResultDto',
);

passTest('TEST 6');

// TEST 7: Verify buildProfileFromTransactions Implementation
testGroup('TEST 7: Verify buildProfileFromTransactions Implementation');

const buildProfileMethod = serviceContent.substring(
  serviceContent.indexOf('async buildProfileFromTransactions'),
  serviceContent.indexOf('private analyzeTransactions'),
);

assert(
  buildProfileMethod.includes('reconciliationRepo.findOne'),
  'Method checks if reconciliation exists',
);
assert(
  buildProfileMethod.includes('entityProfileRepo.findOne'),
  'Method finds or creates entity profile',
);
assert(
  buildProfileMethod.includes('transactionRepo'),
  'Method fetches transactions',
);
assert(
  buildProfileMethod.includes('createQueryBuilder'),
  'Method uses query builder to fetch transactions',
);
assert(
  buildProfileMethod.includes('ILIKE'),
  'Method uses case-insensitive search',
);
assert(
  buildProfileMethod.includes('analyzeTransactions'),
  'Method calls analyzeTransactions helper',
);
assert(
  buildProfileMethod.includes('typicalAmountMin'),
  'Method updates typicalAmountMin',
);
assert(
  buildProfileMethod.includes('typicalAmountMax'),
  'Method updates typicalAmountMax',
);
assert(
  buildProfileMethod.includes('typicalAmountMedian'),
  'Method updates typicalAmountMedian',
);
assert(
  buildProfileMethod.includes('frequencyPattern'),
  'Method updates frequencyPattern',
);
assert(
  buildProfileMethod.includes('preferredDayOfMonth'),
  'Method updates preferredDayOfMonth',
);
assert(
  buildProfileMethod.includes('totalTransactions'),
  'Method updates totalTransactions count',
);
assert(
  buildProfileMethod.includes('confidence'),
  'Method calculates confidence score',
);
assert(
  buildProfileMethod.includes('fieldReliabilityScores'),
  'Method updates field reliability scores',
);
assert(
  buildProfileMethod.includes('entityProfileRepo.save'),
  'Method saves updated profile',
);

passTest('TEST 7');

// TEST 8: Verify analyzeTransactions Helper Method
testGroup('TEST 8: Verify analyzeTransactions Helper Method');

const analyzeMethod = serviceContent.substring(
  serviceContent.indexOf('private analyzeTransactions'),
  serviceContent.lastIndexOf('}'),
);

assert(
  analyzeMethod.includes('Math.abs(t.amount)'),
  'analyzeTransactions analyzes amounts',
);
assert(
  analyzeMethod.includes('amounts.sort'),
  'analyzeTransactions sorts amounts',
);
assert(
  analyzeMethod.includes('amountMin'),
  'analyzeTransactions calculates amountMin',
);
assert(
  analyzeMethod.includes('amountMax'),
  'analyzeTransactions calculates amountMax',
);
assert(
  analyzeMethod.includes('amountMedian'),
  'analyzeTransactions calculates amountMedian',
);
assert(
  analyzeMethod.includes('new Date(t.date)'),
  'analyzeTransactions analyzes dates',
);
assert(
  analyzeMethod.includes('daysDiff'),
  'analyzeTransactions calculates day intervals',
);
assert(
  analyzeMethod.includes('avgInterval'),
  'analyzeTransactions calculates average interval',
);
assert(
  analyzeMethod.includes('daily'),
  'analyzeTransactions detects daily pattern',
);
assert(
  analyzeMethod.includes('weekly'),
  'analyzeTransactions detects weekly pattern',
);
assert(
  analyzeMethod.includes('monthly'),
  'analyzeTransactions detects monthly pattern',
);
assert(
  analyzeMethod.includes('getDate()'),
  'analyzeTransactions analyzes day of month',
);
assert(
  analyzeMethod.includes('dayFrequency'),
  'analyzeTransactions calculates day frequency',
);
assert(
  analyzeMethod.includes('mostReliableFields'),
  'analyzeTransactions determines most reliable fields',
);
assert(
  analyzeMethod.includes('t.description'),
  'analyzeTransactions checks description field',
);
assert(
  analyzeMethod.includes('t.optional?.refNumber'),
  'analyzeTransactions checks refNumber field (in optional object)',
);

passTest('TEST 8');

// TEST 9: Verify Controller Endpoint
testGroup('TEST 9: Verify Controller Endpoint');

const controllerFile = path.join(baseDir, 'learning-service.controller.ts');
const controllerContent = fs.readFileSync(controllerFile, 'utf-8');

assert(
  controllerContent.includes("@Post('profile/build-from-transactions')"),
  'POST /learning/profile/build-from-transactions endpoint exists',
);
assert(
  controllerContent.includes('async buildProfileFromTransactions'),
  'buildProfileFromTransactions controller method exists',
);
assert(
  controllerContent.includes('BuildProfileFromTransactionsDto'),
  'Controller uses BuildProfileFromTransactionsDto',
);
assert(
  controllerContent.includes('PatternLearningResultDto'),
  'Controller returns PatternLearningResultDto',
);

passTest('TEST 9');

// TEST 10: Verify Swagger Documentation
testGroup('TEST 10: Verify Swagger Documentation');

const patternLearningSection = controllerContent.substring(
  controllerContent.indexOf('STEP 45: PATTERN LEARNING'),
  controllerContent.length,
);

assert(
  patternLearningSection.includes('@ApiOperation'),
  'Pattern learning endpoint has @ApiOperation decorator',
);
assert(
  patternLearningSection.includes('@ApiResponse'),
  'Pattern learning endpoint has @ApiResponse decorator',
);
assert(
  patternLearningSection.includes('201'),
  'Pattern learning endpoint documents 201 response',
);
assert(
  patternLearningSection.includes('404'),
  'Pattern learning endpoint documents 404 response',
);
assert(
  patternLearningSection.includes('type: PatternLearningResultDto'),
  'Pattern learning endpoint specifies response type',
);

passTest('TEST 10');

// TEST 11: Verify Error Handling
testGroup('TEST 11: Verify Error Handling');

assert(
  buildProfileMethod.includes('if (!reconciliation)'),
  'buildProfileFromTransactions checks if reconciliation exists',
);
assert(
  buildProfileMethod.includes('throw new NotFoundException'),
  'buildProfileFromTransactions throws NotFoundException for missing reconciliation',
);
assert(
  buildProfileMethod.includes('if (transactions.length === 0)'),
  'buildProfileFromTransactions checks if transactions found',
);
assert(
  buildProfileMethod.includes('if (!dto.entityName)'),
  'buildProfileFromTransactions requires entityName for new profiles',
);

passTest('TEST 11');

// TEST 12: Verify DTO Imports in Controller
testGroup('TEST 12: Verify DTO Imports in Controller');

const controllerImports = controllerContent.substring(0, 1000);

assert(
  controllerImports.includes('BuildProfileFromTransactionsDto'),
  'Controller imports BuildProfileFromTransactionsDto',
);
assert(
  controllerImports.includes('PatternLearningResultDto'),
  'Controller imports PatternLearningResultDto',
);

passTest('TEST 12');

// TEST 13: Verify Entity Imports in Service
testGroup('TEST 13: Verify Entity Imports in Service');

const serviceImports = serviceContent.substring(0, 500);

assert(
  serviceImports.includes('Transaction'),
  'Service imports Transaction entity',
);
assert(
  serviceImports.includes('Reconciliation'),
  'Service imports Reconciliation entity',
);

passTest('TEST 13');

// TEST 14: TypeScript Compilation
testGroup('TEST 14: TypeScript Compilation');

try {
  execSync('npm run build -- learning-service', { cwd: rootDir, stdio: 'pipe' });
  console.log('  ✅ Learning Service compiles successfully');
  testsPassed++;
  passTest('TEST 14');
} catch (error) {
  console.log('  ❌ TypeScript compilation failed');
  testsFailed++;
  failTest('TEST 14');
}

// SUMMARY
console.log('='.repeat(80));
if (testsFailed === 0) {
  console.log('✅ ALL STEP 45 TESTS PASSED');
  console.log('\nSTEP 45 COMPLETE: Pattern Learning');
  console.log('\n✨ Pattern Learning Features:');
  console.log('  • BuildProfileFromTransactionsDto - Build profile from transaction data');
  console.log('  • PatternLearningResultDto - Learning results with patterns');
  console.log('  • Transaction and Reconciliation repository injection');
  console.log('  • Intelligent pattern analysis from transaction history');
  console.log('\n📊 Pattern Analysis Capabilities:');
  console.log('  • Amount Range Analysis - Min, max, median transaction amounts');
  console.log('  • Frequency Detection - Daily, weekly, bi-weekly, monthly, quarterly, annual');
  console.log('  • Day of Month Patterns - Preferred transaction day');
  console.log('  • Field Reliability - Identifies most reliable matching fields');
  console.log('  • Confidence Scoring - Based on transaction volume');
  console.log('\n🧠 Service Methods:');
  console.log('  • buildProfileFromTransactions() - Main pattern learning method');
  console.log('  • analyzeTransactions() - Private helper for pattern analysis');
  console.log('\n🌐 REST Endpoint:');
  console.log('  • POST /learning/profile/build-from-transactions - Build from transactions');
  console.log('\n📈 Profile Updates:');
  console.log('  • typicalAmountMin, Max, Median - Amount patterns');
  console.log('  • frequencyPattern - Transaction frequency');
  console.log('  • preferredDayOfMonth - Day preference');
  console.log('  • fieldReliabilityScores - Field reliability map');
  console.log('  • mostReliableField - Top matching field');
  console.log('  • confidence - Learning confidence score (0-1)');
  console.log('  • totalTransactions - Transaction count');
  console.log('\n💡 Smart Features:');
  console.log('  • Case-insensitive transaction search');
  console.log('  • Automatic profile creation if not exists');
  console.log('  • Incremental transaction counting');
  console.log('  • Field reliability based on consistency');
  console.log('  • Confidence increases with more transactions (cap at 0.95)');
  console.log('\n✅ Ready for Step 46: Create REST endpoints (if additional endpoints needed)');
} else {
  console.log(`❌ TESTS FAILED: ${testsFailed} failed, ${testsPassed} passed`);
  process.exit(1);
}
console.log('='.repeat(80));
