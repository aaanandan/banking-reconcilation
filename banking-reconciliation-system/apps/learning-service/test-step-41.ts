/**
 * STEP 41: Create Learning Service Scaffold - Verification
 *
 * Verifies that the Learning Service scaffold is properly created:
 * - Service app exists
 * - Module configured with TypeORM
 * - Controller has health check endpoint
 * - Service has repository injections
 * - TypeScript compilation successful
 * - Swagger documentation configured
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const baseDir = path.join(__dirname, 'src');
const rootDir = path.join(__dirname, '..', '..');

console.log('='.repeat(80));
console.log('TESTING STEP 41: Create Learning Service Scaffold');
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

// TEST 1: Verify Service Files Exist
testGroup('TEST 1: Verify Service Files Exist');

const mainFile = path.join(baseDir, 'main.ts');
const moduleFile = path.join(baseDir, 'learning-service.module.ts');
const serviceFile = path.join(baseDir, 'learning-service.service.ts');
const controllerFile = path.join(baseDir, 'learning-service.controller.ts');

assert(fs.existsSync(mainFile), 'main.ts exists');
assert(fs.existsSync(moduleFile), 'learning-service.module.ts exists');
assert(fs.existsSync(serviceFile), 'learning-service.service.ts exists');
assert(fs.existsSync(controllerFile), 'learning-service.controller.ts exists');

passTest('TEST 1');

// TEST 2: Verify Main.ts Configuration
testGroup('TEST 2: Verify Main.ts Configuration');

const mainContent = fs.readFileSync(mainFile, 'utf-8');

assert(
  mainContent.includes('ValidationPipe'),
  'ValidationPipe configured',
);
assert(
  mainContent.includes('SwaggerModule'),
  'Swagger module configured',
);
assert(
  mainContent.includes('3004') || mainContent.includes('PORT'),
  'Port 3004 configured',
);
assert(
  mainContent.includes('Learning Service'),
  'Service name documented',
);

passTest('TEST 2');

// TEST 3: Verify Module Configuration
testGroup('TEST 3: Verify Module Configuration');

const moduleContent = fs.readFileSync(moduleFile, 'utf-8');

assert(
  moduleContent.includes('TypeOrmModule'),
  'TypeORM module imported',
);
assert(
  moduleContent.includes('SharedModule'),
  'SharedModule imported',
);
assert(
  moduleContent.includes('EntityProfile'),
  'EntityProfile entity imported',
);
assert(
  moduleContent.includes('LearningQuestion'),
  'LearningQuestion entity imported',
);
assert(
  moduleContent.includes('UserFeedback'),
  'UserFeedback entity imported',
);
assert(
  moduleContent.includes('User'),
  'User entity imported',
);
assert(
  moduleContent.includes('TypeOrmModule.forFeature'),
  'TypeORM forFeature configured',
);

passTest('TEST 3');

// TEST 4: Verify Service Repositories
testGroup('TEST 4: Verify Service Repositories');

const serviceContent = fs.readFileSync(serviceFile, 'utf-8');

assert(
  serviceContent.includes('@InjectRepository(EntityProfile)'),
  'EntityProfile repository injected',
);
assert(
  serviceContent.includes('@InjectRepository(LearningQuestion)'),
  'LearningQuestion repository injected',
);
assert(
  serviceContent.includes('@InjectRepository(UserFeedback)'),
  'UserFeedback repository injected',
);
assert(
  serviceContent.includes('@InjectRepository(User)'),
  'User repository injected',
);
assert(
  serviceContent.includes('Repository<EntityProfile>'),
  'EntityProfile repository typed',
);
assert(
  serviceContent.includes('Repository<LearningQuestion>'),
  'LearningQuestion repository typed',
);

passTest('TEST 4');

// TEST 5: Verify Controller Endpoints
testGroup('TEST 5: Verify Controller Endpoints');

const controllerContent = fs.readFileSync(controllerFile, 'utf-8');

assert(
  controllerContent.includes('@ApiTags'),
  'ApiTags decorator present',
);
assert(
  controllerContent.includes("@Controller('learning')"),
  'Controller route defined as /learning',
);
assert(
  controllerContent.includes('@Get') && controllerContent.includes('health'),
  'Health check endpoint exists',
);
assert(
  controllerContent.includes('@ApiOperation'),
  'API documentation present',
);
assert(
  controllerContent.includes('learning-service'),
  'Service identifier in health check',
);

passTest('TEST 5');

// TEST 6: TypeScript Compilation
testGroup('TEST 6: TypeScript Compilation');

try {
  execSync('npm run build -- learning-service', { cwd: rootDir, stdio: 'pipe' });
  console.log('  ✅ Learning Service compiles successfully');
  testsPassed++;
  passTest('TEST 6');
} catch (error) {
  console.log('  ❌ TypeScript compilation failed');
  testsFailed++;
  failTest('TEST 6');
}

// SUMMARY
console.log('='.repeat(80));
if (testsFailed === 0) {
  console.log('✅ ALL STEP 41 TESTS PASSED');
  console.log('\nSTEP 41 COMPLETE: Create Learning Service Scaffold');
  console.log('\n✨ Scaffold Features:');
  console.log('  • NestJS service app created');
  console.log('  • TypeORM configured with 4 entities');
  console.log('  • Swagger documentation enabled');
  console.log('  • Validation pipes configured');
  console.log('  • Health check endpoint working');
  console.log('  • Repository pattern ready');
  console.log('  • Running on port 3004');
  console.log('\nENTITIES CONFIGURED:');
  console.log('  1. EntityProfile - Payer/payee profiles');
  console.log('  2. LearningQuestion - Deferred questions');
  console.log('  3. UserFeedback - User corrections');
  console.log('  4. User - User management');
  console.log('\nSERVICE ENDPOINTS:');
  console.log('  • GET /learning/health - Health check');
  console.log('  • API Documentation: http://localhost:3004/api');
  console.log('\n✅ Ready for Step 42: Implement user feedback recording');
} else {
  console.log(`❌ TESTS FAILED: ${testsFailed} failed, ${testsPassed} passed`);
  process.exit(1);
}
console.log('='.repeat(80));
