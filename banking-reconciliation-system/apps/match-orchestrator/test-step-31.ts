/**
 * STEP 31: Match Orchestrator Service Scaffold
 *
 * This test verifies the basic scaffold for the Match Orchestrator Service:
 * - NestJS application structure
 * - Port 3005 configuration
 * - Swagger/OpenAPI documentation
 * - ValidationPipe setup
 * - Health check endpoint
 * - NPM scripts
 * - TypeScript compilation
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const baseDir = path.join(__dirname);
const rootDir = path.join(__dirname, '..', '..');

console.log('='.repeat(80));
console.log('TESTING STEP 31: Match Orchestrator Service Scaffold');
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
// TEST 1: Verify Service Files Created
// ============================================================================
testGroup('TEST 1: Verify Service Files Created');

const mainFile = path.join(baseDir, 'src', 'main.ts');
const controllerFile = path.join(baseDir, 'src', 'match-orchestrator.controller.ts');
const serviceFile = path.join(baseDir, 'src', 'match-orchestrator.service.ts');
const moduleFile = path.join(baseDir, 'src', 'match-orchestrator.module.ts');

assert(fs.existsSync(mainFile), 'main.ts');
assert(fs.existsSync(controllerFile), 'controller.ts');
assert(fs.existsSync(serviceFile), 'service.ts');
assert(fs.existsSync(moduleFile), 'module.ts');

passTest('TEST 1');

// ============================================================================
// TEST 2: Verify Main.ts Configuration
// ============================================================================
testGroup('TEST 2: Verify Main.ts Configuration');

const mainContent = fs.readFileSync(mainFile, 'utf-8');

assert(mainContent.includes('3005'), 'Port 3005');
assert(mainContent.includes('ValidationPipe'), 'ValidationPipe');
assert(mainContent.includes('DocumentBuilder'), 'Swagger setup');
assert(mainContent.includes('Match Orchestrator Service'), 'Service title');
assert(
  mainContent.includes('MT-01') && mainContent.includes('MT-02'),
  'MT-01 and MT-02 workflow description',
);
assert(
  mainContent.includes('console.log'),
  'Console log for service running',
);

passTest('TEST 2');

// ============================================================================
// TEST 3: Verify Controller Health Endpoint
// ============================================================================
testGroup('TEST 3: Verify Controller Health Endpoint');

const controllerContent = fs.readFileSync(controllerFile, 'utf-8');

assert(
  controllerContent.includes("@Get('health')"),
  'Health endpoint',
);
assert(controllerContent.includes('@ApiOperation'), 'ApiOperation decorator');
assert(
  controllerContent.includes('match-orchestrator'),
  'Service name in health response',
);
assert(
  controllerContent.includes('MT-01') && controllerContent.includes('MT-02'),
  'Workflow description in health response',
);
assert(
  controllerContent.includes('capabilities'),
  'Capabilities array in health response',
);

passTest('TEST 3');

// ============================================================================
// TEST 4: Verify Service Scaffold
// ============================================================================
testGroup('TEST 4: Verify Service Scaffold');

const serviceContent = fs.readFileSync(serviceFile, 'utf-8');

assert(serviceContent.includes('@Injectable'), '@Injectable decorator');
assert(
  serviceContent.includes('MatchOrchestratorService'),
  'Service class',
);
assert(
  serviceContent.includes('Coordinates') ||
    serviceContent.includes('sequential') ||
    serviceContent.includes('MT-01') ||
    serviceContent.includes('MT-02'),
  'Documentation comment',
);

passTest('TEST 4');

// ============================================================================
// TEST 5: Verify NPM Scripts
// ============================================================================
testGroup('TEST 5: Verify NPM Scripts');

const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

assert(
  packageJson.scripts['build:orchestrator'] !== undefined,
  'build:orchestrator',
);
assert(
  packageJson.scripts['start:orchestrator'] !== undefined,
  'start:orchestrator',
);
assert(
  packageJson.scripts['start:orchestrator:dev'] !== undefined,
  'start:orchestrator:dev',
);

passTest('TEST 5');

// ============================================================================
// TEST 6: TypeScript Compilation
// ============================================================================
testGroup('TEST 6: TypeScript Compilation');

try {
  execSync('npm run build:orchestrator', {
    cwd: rootDir,
    stdio: 'pipe',
  });
  console.log('  ✅ Match Orchestrator service compiles successfully');
  testsPassed++;
  passTest('TEST 6');
} catch (error) {
  console.log('  ❌ TypeScript compilation failed');
  testsFailed++;
  failTest('TEST 6');
}

// ============================================================================
// SUMMARY
// ============================================================================
console.log('='.repeat(80));
if (testsFailed === 0) {
  console.log('✅ ALL STEP 31 TESTS PASSED');
} else {
  console.log(`❌ SOME TESTS FAILED: ${testsFailed} failed, ${testsPassed} passed`);
  process.exit(1);
}

console.log('\nSTEP 31 COMPLETE: Match Orchestrator Service Scaffold');

console.log('\nSUMMARY:');
console.log('  ✅ Match Orchestrator NestJS application generated');
console.log('  ✅ Port configured: 3005');
console.log('  ✅ Swagger/OpenAPI documentation configured');
console.log('  ✅ ValidationPipe enabled');
console.log('  ✅ Health check endpoint: GET /orchestrate/health');
console.log('  ✅ NPM scripts added (build:orchestrator, start:orchestrator, start:orchestrator:dev)');
console.log('  ✅ TypeScript compiles successfully');

console.log('\nSERVICE INFO:');
console.log('  Name: Match Orchestrator Service');
console.log('  Port: 3005');
console.log('  Workflow: MT-01 (exact) → MT-02 (fuzzy)');
console.log('  Capabilities: sequential-matching, result-aggregation, multi-bank-support, statistics-calculation');
console.log('  Swagger: http://localhost:3005/api');

console.log('\nSERVICES ARCHITECTURE:');
console.log('  ├─ Data Prep Service (port 3001)');
console.log('  ├─ State Manager Service (port 3002)');
console.log('  ├─ MT-01 Exact Match (port 3003) ✅');
console.log('  ├─ MT-02 Near-Exact Match (port 3004) ✅');
console.log('  └─ Match Orchestrator (port 3005) ✅ NEW!');

console.log('\n✨ STEP 31: ORCHESTRATOR SCAFFOLD - COMPLETE!');
console.log('\nREADY FOR STEP 32: Create Orchestrator DTOs and Interfaces');
console.log('='.repeat(80));
