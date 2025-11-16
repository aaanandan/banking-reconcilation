/**
 * STEP 44: Per-Bank Behavior Tracking - Verification
 *
 * Verifies that per-bank behavior tracking is properly implemented:
 * - Bank behavior DTOs defined
 * - Service methods for per-bank CRUD operations
 * - Controller endpoints with proper decorators
 * - TypeScript compilation successful
 * - Error handling (not found scenarios)
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const baseDir = path.join(__dirname, 'src');
const rootDir = path.join(__dirname, '..', '..');

console.log('='.repeat(80));
console.log('TESTING STEP 44: Per-Bank Behavior Tracking');
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

// TEST 1: Verify Bank Behavior DTOs Exist
testGroup('TEST 1: Verify Bank Behavior DTOs Exist');

const dtoFile = path.join(baseDir, 'dto', 'entity-profile.dto.ts');
const dtoContent = fs.readFileSync(dtoFile, 'utf-8');

assert(
  dtoContent.includes('export class BankSpecificBehaviorDto'),
  'BankSpecificBehaviorDto defined',
);
assert(
  dtoContent.includes('export class UpdateBankBehaviorDto'),
  'UpdateBankBehaviorDto defined',
);
assert(
  dtoContent.includes('export class BankBehaviorResponseDto'),
  'BankBehaviorResponseDto defined',
);
assert(
  dtoContent.includes('export class AllBanksBehaviorResponseDto'),
  'AllBanksBehaviorResponseDto defined',
);

passTest('TEST 1');

// TEST 2: Verify BankSpecificBehaviorDto Structure
testGroup('TEST 2: Verify BankSpecificBehaviorDto Structure');

const bankBehaviorSection = dtoContent.substring(
  dtoContent.indexOf('export class BankSpecificBehaviorDto'),
  dtoContent.indexOf('export class UpdateBankBehaviorDto'),
);

assert(
  bankBehaviorSection.includes('dateOffset: number'),
  'BankSpecificBehaviorDto has dateOffset',
);
assert(
  bankBehaviorSection.includes('mostReliableField: string'),
  'BankSpecificBehaviorDto has mostReliableField',
);
assert(
  bankBehaviorSection.includes('refNumberFormat?'),
  'BankSpecificBehaviorDto has optional refNumberFormat',
);

passTest('TEST 2');

// TEST 3: Verify UpdateBankBehaviorDto Structure
testGroup('TEST 3: Verify UpdateBankBehaviorDto Structure');

const updateBankBehaviorSection = dtoContent.substring(
  dtoContent.indexOf('export class UpdateBankBehaviorDto'),
  dtoContent.indexOf('export class BankBehaviorResponseDto'),
);

assert(
  updateBankBehaviorSection.includes('bankId: string'),
  'UpdateBankBehaviorDto has bankId',
);
assert(
  updateBankBehaviorSection.includes('behavior:'),
  'UpdateBankBehaviorDto has behavior field',
);
assert(
  updateBankBehaviorSection.includes('BankSpecificBehaviorDto'),
  'UpdateBankBehaviorDto references BankSpecificBehaviorDto',
);

passTest('TEST 3');

// TEST 4: Verify Service Methods Exist
testGroup('TEST 4: Verify Service Methods Exist');

const serviceFile = path.join(baseDir, 'learning-service.service.ts');
const serviceContent = fs.readFileSync(serviceFile, 'utf-8');

assert(
  serviceContent.includes('async updateBankBehavior'),
  'updateBankBehavior method exists',
);
assert(
  serviceContent.includes('async getBankBehavior'),
  'getBankBehavior method exists',
);
assert(
  serviceContent.includes('async getAllBankBehaviors'),
  'getAllBankBehaviors method exists',
);
assert(
  serviceContent.includes('async deleteBankBehavior'),
  'deleteBankBehavior method exists',
);

passTest('TEST 4');

// TEST 5: Verify updateBankBehavior Implementation
testGroup('TEST 5: Verify updateBankBehavior Implementation');

const updateBankBehaviorMethod = serviceContent.substring(
  serviceContent.indexOf('async updateBankBehavior'),
  serviceContent.indexOf('async getBankBehavior'),
);

assert(
  updateBankBehaviorMethod.includes('entityProfileRepo.findOne'),
  'updateBankBehavior fetches entity profile',
);
assert(
  updateBankBehaviorMethod.includes('NotFoundException'),
  'updateBankBehavior throws NotFoundException when profile not found',
);
assert(
  updateBankBehaviorMethod.includes('if (!profile.bankSpecificBehavior)'),
  'updateBankBehavior initializes bankSpecificBehavior if null',
);
assert(
  updateBankBehaviorMethod.includes('profile.bankSpecificBehavior[dto.bankId]'),
  'updateBankBehavior updates bank-specific behavior by bankId',
);
assert(
  updateBankBehaviorMethod.includes('entityProfileRepo.save'),
  'updateBankBehavior saves changes',
);

passTest('TEST 5');

// TEST 6: Verify getBankBehavior Implementation
testGroup('TEST 6: Verify getBankBehavior Implementation');

const getBankBehaviorMethod = serviceContent.substring(
  serviceContent.indexOf('async getBankBehavior('),
  serviceContent.indexOf('async getAllBankBehaviors'),
);

assert(
  getBankBehaviorMethod.includes('entityProfileRepo.findOne'),
  'getBankBehavior fetches entity profile',
);
assert(
  getBankBehaviorMethod.includes('if (!profile.bankSpecificBehavior || !profile.bankSpecificBehavior[bankId])'),
  'getBankBehavior checks if bank behavior exists',
);
assert(
  getBankBehaviorMethod.includes('throw new NotFoundException'),
  'getBankBehavior throws NotFoundException when not found',
);

passTest('TEST 6');

// TEST 7: Verify getAllBankBehaviors Implementation
testGroup('TEST 7: Verify getAllBankBehaviors Implementation');

const getAllBankBehaviorsMethod = serviceContent.substring(
  serviceContent.indexOf('async getAllBankBehaviors'),
  serviceContent.indexOf('async deleteBankBehavior'),
);

assert(
  getAllBankBehaviorsMethod.includes('bankSpecificBehavior = profile.bankSpecificBehavior || {}'),
  'getAllBankBehaviors handles null bankSpecificBehavior',
);
assert(
  getAllBankBehaviorsMethod.includes('Object.keys(bankSpecificBehavior).length'),
  'getAllBankBehaviors counts number of banks',
);
assert(
  getAllBankBehaviorsMethod.includes('banksCount'),
  'getAllBankBehaviors includes banksCount',
);

passTest('TEST 7');

// TEST 8: Verify deleteBankBehavior Implementation
testGroup('TEST 8: Verify deleteBankBehavior Implementation');

const deleteBankBehaviorMethod = serviceContent.substring(
  serviceContent.indexOf('async deleteBankBehavior'),
  serviceContent.length - 100,
);

assert(
  deleteBankBehaviorMethod.includes('delete profile.bankSpecificBehavior[bankId]'),
  'deleteBankBehavior removes bank-specific behavior',
);
assert(
  deleteBankBehaviorMethod.includes('entityProfileRepo.save'),
  'deleteBankBehavior saves changes',
);
assert(
  deleteBankBehaviorMethod.includes('return { success: true }'),
  'deleteBankBehavior returns success',
);

passTest('TEST 8');

// TEST 9: Verify Controller Endpoints
testGroup('TEST 9: Verify Controller Endpoints');

const controllerFile = path.join(baseDir, 'learning-service.controller.ts');
const controllerContent = fs.readFileSync(controllerFile, 'utf-8');

assert(
  controllerContent.includes("@Put('profile/:entityId/bank-behavior')"),
  'PUT /learning/profile/:entityId/bank-behavior endpoint exists',
);
assert(
  controllerContent.includes("@Get('profile/:entityId/bank-behavior/:bankId')"),
  'GET /learning/profile/:entityId/bank-behavior/:bankId endpoint exists',
);
assert(
  controllerContent.includes("@Get('profile/:entityId/bank-behavior')"),
  'GET /learning/profile/:entityId/bank-behavior endpoint exists',
);
assert(
  controllerContent.includes("@Delete('profile/:entityId/bank-behavior/:bankId')"),
  'DELETE /learning/profile/:entityId/bank-behavior/:bankId endpoint exists',
);

passTest('TEST 9');

// TEST 10: Verify Swagger Documentation
testGroup('TEST 10: Verify Swagger Documentation');

const bankBehaviorEndpointsSection = controllerContent.substring(
  controllerContent.indexOf('STEP 44: PER-BANK BEHAVIOR TRACKING'),
  controllerContent.length,
);

assert(
  bankBehaviorEndpointsSection.includes('@ApiOperation'),
  'Bank behavior endpoints have @ApiOperation decorators',
);
assert(
  bankBehaviorEndpointsSection.includes('@ApiParam'),
  'Bank behavior endpoints have @ApiParam decorators',
);
assert(
  bankBehaviorEndpointsSection.includes('@ApiResponse'),
  'Bank behavior endpoints have @ApiResponse decorators',
);

// Check PUT endpoint documentation
const putEndpointSection = bankBehaviorEndpointsSection.substring(
  bankBehaviorEndpointsSection.indexOf("@Put('profile/:entityId/bank-behavior')"),
  bankBehaviorEndpointsSection.indexOf("@Put('profile/:entityId/bank-behavior')") + 400,
);
assert(
  putEndpointSection.includes('BankBehaviorResponseDto'),
  'PUT bank behavior endpoint specifies response type',
);
assert(
  putEndpointSection.includes('404'),
  'PUT bank behavior endpoint documents 404 response',
);

passTest('TEST 10');

// TEST 11: Verify DTO Imports in Controller
testGroup('TEST 11: Verify DTO Imports in Controller');

const controllerImports = controllerContent.substring(0, 800);

assert(
  controllerImports.includes('UpdateBankBehaviorDto'),
  'Controller imports UpdateBankBehaviorDto',
);
assert(
  controllerImports.includes('BankBehaviorResponseDto'),
  'Controller imports BankBehaviorResponseDto',
);
assert(
  controllerImports.includes('AllBanksBehaviorResponseDto'),
  'Controller imports AllBanksBehaviorResponseDto',
);

passTest('TEST 11');

// TEST 12: Verify DTO Imports in Service
testGroup('TEST 12: Verify DTO Imports in Service');

const serviceImports = serviceContent.substring(0, 800);

assert(
  serviceImports.includes('BankSpecificBehaviorDto'),
  'Service imports BankSpecificBehaviorDto',
);
assert(
  serviceImports.includes('UpdateBankBehaviorDto'),
  'Service imports UpdateBankBehaviorDto',
);
assert(
  serviceImports.includes('BankBehaviorResponseDto'),
  'Service imports BankBehaviorResponseDto',
);
assert(
  serviceImports.includes('AllBanksBehaviorResponseDto'),
  'Service imports AllBanksBehaviorResponseDto',
);

passTest('TEST 12');

// TEST 13: TypeScript Compilation
testGroup('TEST 13: TypeScript Compilation');

try {
  execSync('npm run build -- learning-service', { cwd: rootDir, stdio: 'pipe' });
  console.log('  ✅ Learning Service compiles successfully');
  testsPassed++;
  passTest('TEST 13');
} catch (error) {
  console.log('  ❌ TypeScript compilation failed');
  testsFailed++;
  failTest('TEST 13');
}

// SUMMARY
console.log('='.repeat(80));
if (testsFailed === 0) {
  console.log('✅ ALL STEP 44 TESTS PASSED');
  console.log('\nSTEP 44 COMPLETE: Per-Bank Behavior Tracking');
  console.log('\n✨ Per-Bank Behavior Features:');
  console.log('  • BankSpecificBehaviorDto - Bank-specific behavior data');
  console.log('  • UpdateBankBehaviorDto - Update bank behavior');
  console.log('  • BankBehaviorResponseDto - Single bank behavior response');
  console.log('  • AllBanksBehaviorResponseDto - All banks behavior response');
  console.log('\n📊 Service Methods:');
  console.log('  • updateBankBehavior() - Update/add bank behavior');
  console.log('  • getBankBehavior() - Get behavior for specific bank');
  console.log('  • getAllBankBehaviors() - Get all bank behaviors');
  console.log('  • deleteBankBehavior() - Remove bank behavior');
  console.log('\n🌐 REST Endpoints:');
  console.log('  • PUT    /learning/profile/:entityId/bank-behavior - Update bank behavior');
  console.log('  • GET    /learning/profile/:entityId/bank-behavior/:bankId - Get bank behavior');
  console.log('  • GET    /learning/profile/:entityId/bank-behavior - Get all bank behaviors');
  console.log('  • DELETE /learning/profile/:entityId/bank-behavior/:bankId - Delete bank behavior');
  console.log('\n📈 Bank Behavior Data Tracked:');
  console.log('  • dateOffset - Date offset in days for this bank');
  console.log('  • mostReliableField - Most reliable field for matching at this bank');
  console.log('  • refNumberFormat - Reference number format pattern (optional)');
  console.log('\n💡 Multi-Bank Support:');
  console.log('  • Track different behaviors per bank for same entity');
  console.log('  • Useful for entities that appear differently across banks');
  console.log('  • Stored in JSONB bankSpecificBehavior field');
  console.log('\n✅ Ready for Step 45: Implement pattern learning');
} else {
  console.log(`❌ TESTS FAILED: ${testsFailed} failed, ${testsPassed} passed`);
  process.exit(1);
}
console.log('='.repeat(80));
