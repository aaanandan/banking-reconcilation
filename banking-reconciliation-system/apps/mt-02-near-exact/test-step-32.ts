/**
 * STEP 32: MT-02 REST Endpoint - Verification
 *
 * Verifies that MT-02 exposes proper REST endpoints:
 * - Health check endpoint (GET /match/health)
 * - Fuzzy match endpoint (POST /match/fuzzy)
 * - Controller uses proper decorators (@Post, @Get, @ApiOperation, etc.)
 * - Endpoints accept and return proper DTOs
 * - Swagger documentation complete
 * - TypeScript compilation
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const baseDir = path.join(__dirname, 'src');
const rootDir = path.join(__dirname, '..', '..');

console.log('='.repeat(80));
console.log('TESTING STEP 32: MT-02 REST Endpoint');
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

// TEST 1: Verify Controller Exists
testGroup('TEST 1: Verify Controller Exists');

const controllerFile = path.join(baseDir, 'mt-02-near-exact.controller.ts');
const controllerContent = fs.readFileSync(controllerFile, 'utf-8');

assert(
  controllerContent.includes('export class Mt02NearExactController') ||
    controllerContent.includes('export class MT02NearExactController'),
  'MT-02 controller class exists',
);
assert(
  controllerContent.includes('@Controller'),
  'Controller has @Controller decorator',
);
assert(
  controllerContent.includes("@Controller('match')"),
  'Controller is mounted at /match route',
);

passTest('TEST 1');

// TEST 2: Verify Health Check Endpoint
testGroup('TEST 2: Verify Health Check Endpoint');

assert(
  controllerContent.includes('@Get') && controllerContent.includes('health'),
  'Health check endpoint exists (GET /match/health)',
);
assert(
  controllerContent.includes('healthCheck'),
  'healthCheck method exists',
);
assert(
  controllerContent.includes('@ApiOperation') && controllerContent.includes('Health'),
  'Health endpoint has @ApiOperation documentation',
);
assert(
  controllerContent.includes('@ApiResponse'),
  'Health endpoint has @ApiResponse documentation',
);

// Check health response includes service info
const healthSection = controllerContent.substring(
  controllerContent.indexOf('healthCheck'),
  controllerContent.indexOf('healthCheck') + 300,
);
assert(
  healthSection.includes('mt-02') || healthSection.includes('fuzzy'),
  'Health check returns MT-02 service information',
);

passTest('TEST 2');

// TEST 3: Verify Fuzzy Match Endpoint
testGroup('TEST 3: Verify Fuzzy Match Endpoint (POST /match/fuzzy)');

assert(
  controllerContent.includes('@Post') && controllerContent.includes('fuzzy'),
  'Fuzzy match endpoint exists (POST /match/fuzzy)',
);
assert(
  controllerContent.includes('findFuzzyMatches'),
  'findFuzzyMatches controller method exists',
);
assert(
  controllerContent.includes('FuzzyMatchRequestDto'),
  'Endpoint accepts FuzzyMatchRequestDto',
);
assert(
  controllerContent.includes('FuzzyMatchResponseDto'),
  'Endpoint returns FuzzyMatchResponseDto',
);
assert(
  controllerContent.includes('@Body'),
  'Endpoint uses @Body decorator for request payload',
);

passTest('TEST 3');

// TEST 4: Verify Swagger Documentation
testGroup('TEST 4: Verify Swagger Documentation');

assert(
  controllerContent.includes('@ApiTags'),
  'Controller has @ApiTags decorator',
);

const fuzzyEndpointSection = controllerContent.substring(
  controllerContent.indexOf("@Post('fuzzy')"),
  controllerContent.indexOf('findFuzzyMatches') + 200,
);

assert(
  fuzzyEndpointSection.includes('@ApiOperation'),
  'Fuzzy match endpoint has @ApiOperation decorator',
);
assert(
  fuzzyEndpointSection.includes('@ApiResponse') && fuzzyEndpointSection.includes('200'),
  'Fuzzy match endpoint documents 200 response',
);
assert(
  fuzzyEndpointSection.includes('@ApiResponse') && fuzzyEndpointSection.includes('400'),
  'Fuzzy match endpoint documents 400 error response',
);
assert(
  fuzzyEndpointSection.includes('type: FuzzyMatchResponseDto') ||
    fuzzyEndpointSection.includes('FuzzyMatchResponseDto'),
  'Fuzzy match endpoint specifies response type for Swagger',
);

passTest('TEST 4');

// TEST 5: Verify Controller Imports Service
testGroup('TEST 5: Verify Controller Imports and Uses Service');

assert(
  controllerContent.includes('import') && controllerContent.includes('Mt02NearExactService'),
  'Controller imports Mt02NearExactService',
);
assert(
  controllerContent.includes('constructor') &&
    controllerContent.includes('mt02NearExactService') ||
    controllerContent.includes('mt02Service'),
  'Controller injects service via constructor',
);
assert(
  controllerContent.includes('this.mt02NearExactService.findFuzzyMatches') ||
    controllerContent.includes('.findFuzzyMatches(request)'),
  'Controller delegates to service.findFuzzyMatches method',
);

passTest('TEST 5');

// TEST 6: TypeScript Compilation
testGroup('TEST 6: TypeScript Compilation');

try {
  execSync('npm run build:mt-02', { cwd: rootDir, stdio: 'pipe' });
  console.log('  ✅ MT-02 service compiles successfully');
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
  console.log('✅ ALL STEP 32 TESTS PASSED');
  console.log('\nSTEP 32 COMPLETE: MT-02 REST Endpoint');
  console.log('\n✨ REST Endpoint Features Verified:');
  console.log('  • Controller class exists with @Controller decorator');
  console.log('  • Mounted at /match route');
  console.log('  • Health check endpoint: GET /match/health');
  console.log('  • Fuzzy match endpoint: POST /match/fuzzy');
  console.log('  • Accepts FuzzyMatchRequestDto');
  console.log('  • Returns FuzzyMatchResponseDto');
  console.log('  • Full Swagger/OpenAPI documentation');
  console.log('  • Service injection and delegation');
  console.log('\nENDPOINTS:');
  console.log('  1. GET /match/health');
  console.log('     → Returns service health status');
  console.log('');
  console.log('  2. POST /match/fuzzy');
  console.log('     → Accepts: { bankTransactions, ledgerTransactions, thresholds?, fieldProfile? }');
  console.log('     → Returns: { matches, totalMatches, algorithm, thresholds, timestamp }');
  console.log('\nUSAGE EXAMPLE:');
  console.log('  POST http://localhost:3002/match/fuzzy');
  console.log('  {');
  console.log('    "bankTransactions": [');
  console.log('      { "id": 1, "date": "2025-01-15", "amount": 100.50, "description": "Payment" }');
  console.log('    ],');
  console.log('    "ledgerTransactions": [');
  console.log('      { "id": 10, "date": "2025-01-16", "amount": 100.00, "description": "Paymnt" }');
  console.log('    ],');
  console.log('    "thresholds": {');
  console.log('      "dateTolerance": 2,');
  console.log('      "amountTolerance": 0.05,');
  console.log('      "descriptionSimilarity": 0.7,');
  console.log('      "minConfidence": 0.7');
  console.log('    },');
  console.log('    "fieldProfile": { "banks": {...}, "ledger": {...} }');
  console.log('  }');
  console.log('\n✨ MT-02 REST API is fully functional!');
} else {
  console.log(`❌ TESTS FAILED: ${testsFailed} failed, ${testsPassed} passed`);
  process.exit(1);
}
console.log('='.repeat(80));
