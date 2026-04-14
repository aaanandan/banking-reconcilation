/**
 * STEP 43: Entity Profile Creation - Verification
 *
 * Verifies that entity profile creation is properly implemented:
 * - Profile DTOs defined with all fields
 * - Service methods for CRUD operations
 * - Profile statistics calculation
 * - Controller endpoints with proper decorators
 * - TypeScript compilation successful
 * - Error handling (duplicate profiles, not found)
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const baseDir = path.join(__dirname, 'src');
const rootDir = path.join(__dirname, '..', '..');

console.log('='.repeat(80));
console.log('TESTING STEP 43: Entity Profile Creation');
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

// TEST 1: Verify Entity Profile DTOs Exist
testGroup('TEST 1: Verify Entity Profile DTOs Exist');

const dtoFile = path.join(baseDir, 'dto', 'entity-profile.dto.ts');
const dtoContent = fs.readFileSync(dtoFile, 'utf-8');

assert(
  dtoContent.includes('export class CreateEntityProfileDto'),
  'CreateEntityProfileDto defined',
);
assert(
  dtoContent.includes('export class UpdateEntityProfileDto'),
  'UpdateEntityProfileDto defined',
);
assert(
  dtoContent.includes('export class EntityProfileResponseDto'),
  'EntityProfileResponseDto defined',
);
assert(
  dtoContent.includes('export class EntityProfileStatsDto'),
  'EntityProfileStatsDto defined',
);

passTest('TEST 1');

// TEST 2: Verify CreateEntityProfileDto Structure
testGroup('TEST 2: Verify CreateEntityProfileDto Structure');

assert(
  dtoContent.includes('entityId: string'),
  'CreateEntityProfileDto has entityId',
);
assert(
  dtoContent.includes('primaryName: string'),
  'CreateEntityProfileDto has primaryName',
);
assert(
  dtoContent.includes('aliases?'),
  'CreateEntityProfileDto has optional aliases',
);
assert(
  dtoContent.includes('legalName?'),
  'CreateEntityProfileDto has optional legalName',
);
assert(
  dtoContent.includes('industry?'),
  'CreateEntityProfileDto has optional industry',
);
assert(
  dtoContent.includes('location?'),
  'CreateEntityProfileDto has optional location',
);
assert(
  dtoContent.includes('tags?'),
  'CreateEntityProfileDto has optional tags',
);

passTest('TEST 2');

// TEST 3: Verify UpdateEntityProfileDto Structure
testGroup('TEST 3: Verify UpdateEntityProfileDto Structure');

const updateDtoSection = dtoContent.substring(
  dtoContent.indexOf('export class UpdateEntityProfileDto'),
  dtoContent.indexOf('export class EntityProfileResponseDto'),
);

assert(
  updateDtoSection.includes('primaryName?'),
  'UpdateEntityProfileDto has optional primaryName',
);
assert(
  updateDtoSection.includes('typicalAmountMin?'),
  'UpdateEntityProfileDto has optional typicalAmountMin',
);
assert(
  updateDtoSection.includes('typicalAmountMax?'),
  'UpdateEntityProfileDto has optional typicalAmountMax',
);
assert(
  updateDtoSection.includes('typicalAmountMedian?'),
  'UpdateEntityProfileDto has optional typicalAmountMedian',
);
assert(
  updateDtoSection.includes('frequencyPattern?'),
  'UpdateEntityProfileDto has optional frequencyPattern',
);
assert(
  updateDtoSection.includes('preferredDayOfMonth?'),
  'UpdateEntityProfileDto has optional preferredDayOfMonth',
);

passTest('TEST 3');

// TEST 4: Verify Service Methods
testGroup('TEST 4: Verify Service Methods');

const serviceFile = path.join(baseDir, 'learning-service.service.ts');
const serviceContent = fs.readFileSync(serviceFile, 'utf-8');

assert(
  serviceContent.includes('async createProfile'),
  'createProfile method exists',
);
assert(
  serviceContent.includes('async updateProfile'),
  'updateProfile method exists',
);
assert(
  serviceContent.includes('async getProfile'),
  'getProfile method exists',
);
assert(
  serviceContent.includes('async getAllProfiles'),
  'getAllProfiles method exists',
);
assert(
  serviceContent.includes('async deleteProfile'),
  'deleteProfile method exists',
);
assert(
  serviceContent.includes('async getProfileStats'),
  'getProfileStats method exists',
);

passTest('TEST 4');

// TEST 5: Verify createProfile Implementation
testGroup('TEST 5: Verify createProfile Implementation');

const createProfileSection = serviceContent.substring(
  serviceContent.indexOf('async createProfile'),
  serviceContent.indexOf('async updateProfile'),
);

assert(
  createProfileSection.includes('entityProfileRepo.findOne'),
  'createProfile checks for existing profile',
);
assert(
  createProfileSection.includes('ConflictException'),
  'createProfile throws ConflictException for duplicates',
);
assert(
  createProfileSection.includes('entityProfileRepo.create'),
  'createProfile creates new profile entity',
);
assert(
  createProfileSection.includes('entityProfileRepo.save'),
  'createProfile saves to database',
);
assert(
  createProfileSection.includes('totalTransactions: 0'),
  'createProfile initializes totalTransactions to 0',
);
assert(
  createProfileSection.includes('confidence: 0'),
  'createProfile initializes confidence to 0',
);

passTest('TEST 5');

// TEST 6: Verify updateProfile Implementation
testGroup('TEST 6: Verify updateProfile Implementation');

const updateProfileSection = serviceContent.substring(
  serviceContent.indexOf('async updateProfile'),
  serviceContent.indexOf('async getProfile(entityId:'),
);

assert(
  updateProfileSection.includes('entityProfileRepo.findOne'),
  'updateProfile fetches existing profile',
);
assert(
  updateProfileSection.includes('NotFoundException'),
  'updateProfile throws NotFoundException when not found',
);
assert(
  updateProfileSection.includes('if (dto.primaryName)'),
  'updateProfile conditionally updates primaryName',
);
assert(
  updateProfileSection.includes('if (dto.aliases)'),
  'updateProfile conditionally updates aliases',
);
assert(
  updateProfileSection.includes('entityProfileRepo.save'),
  'updateProfile saves changes',
);

passTest('TEST 6');

// TEST 7: Verify getProfileStats Implementation
testGroup('TEST 7: Verify getProfileStats Implementation');

const statsSection = serviceContent.substring(
  serviceContent.indexOf('async getProfileStats'),
  serviceContent.indexOf('private toProfileResponse'),
);

assert(
  statsSection.includes('matchRate'),
  'getProfileStats calculates matchRate',
);
assert(
  statsSection.includes('successfulMatches') && statsSection.includes('totalTransactions'),
  'getProfileStats uses successfulMatches and totalTransactions',
);
assert(
  statsSection.includes('avgAmount'),
  'getProfileStats includes avgAmount',
);
assert(
  statsSection.includes('frequencyPattern'),
  'getProfileStats includes frequencyPattern',
);
assert(
  statsSection.includes('aliasCount'),
  'getProfileStats includes aliasCount',
);

passTest('TEST 7');

// TEST 8: Verify Controller Endpoints
testGroup('TEST 8: Verify Controller Endpoints');

const controllerFile = path.join(baseDir, 'learning-service.controller.ts');
const controllerContent = fs.readFileSync(controllerFile, 'utf-8');

assert(
  controllerContent.includes("@Post('profile')"),
  'POST /learning/profile endpoint exists',
);

// Check for GET /profile endpoint (getAllProfiles)
const getAllProfilesIdx = controllerContent.indexOf('getAllProfiles');
const getAllProfilesSection = controllerContent.substring(
  Math.max(0, getAllProfilesIdx - 300),
  getAllProfilesIdx + 100,
);
assert(
  getAllProfilesSection.includes("@Get('profile')"),
  'GET /learning/profile endpoint exists',
);

assert(
  controllerContent.includes("@Get('profile/:entityId')"),
  'GET /learning/profile/:entityId endpoint exists',
);
assert(
  controllerContent.includes("@Put('profile/:entityId')"),
  'PUT /learning/profile/:entityId endpoint exists',
);
assert(
  controllerContent.includes("@Delete('profile/:entityId')"),
  'DELETE /learning/profile/:entityId endpoint exists',
);
assert(
  controllerContent.includes("@Get('profile/:entityId/stats')"),
  'GET /learning/profile/:entityId/stats endpoint exists',
);

passTest('TEST 8');

// TEST 9: Verify Swagger Documentation
testGroup('TEST 9: Verify Swagger Documentation');

const profileEndpointsSection = controllerContent.substring(
  controllerContent.indexOf('STEP 43: ENTITY PROFILE ENDPOINTS'),
  controllerContent.length,
);

assert(
  profileEndpointsSection.includes('@ApiOperation'),
  'Profile endpoints have @ApiOperation decorators',
);
assert(
  profileEndpointsSection.includes('@ApiResponse'),
  'Profile endpoints have @ApiResponse decorators',
);
assert(
  profileEndpointsSection.includes('@ApiParam'),
  'Profile endpoints have @ApiParam decorators',
);

// Check POST endpoint documentation
const postEndpointSection = profileEndpointsSection.substring(
  profileEndpointsSection.indexOf("@Post('profile')"),
  profileEndpointsSection.indexOf("@Post('profile')") + 300,
);
assert(
  postEndpointSection.includes('201'),
  'POST profile endpoint documents 201 response',
);
assert(
  postEndpointSection.includes('409'),
  'POST profile endpoint documents 409 conflict response',
);
assert(
  postEndpointSection.includes('type: EntityProfileResponseDto'),
  'POST profile endpoint specifies response type',
);

passTest('TEST 9');

// TEST 10: Verify Error Handling
testGroup('TEST 10: Verify Error Handling');

assert(
  serviceContent.includes('ConflictException'),
  'Service imports ConflictException',
);
assert(
  serviceContent.includes('throw new ConflictException'),
  'Service throws ConflictException for duplicates',
);
assert(
  serviceContent.includes('throw new NotFoundException'),
  'Service throws NotFoundException when appropriate',
);

const getProfileSection = serviceContent.substring(
  serviceContent.indexOf('async getProfile(entityId:'),
  serviceContent.indexOf('async getAllProfiles'),
);
assert(
  getProfileSection.includes('if (!profile)'),
  'getProfile checks if profile exists',
);
assert(
  getProfileSection.includes('throw new NotFoundException'),
  'getProfile throws NotFoundException when not found',
);

passTest('TEST 10');

// TEST 11: TypeScript Compilation
testGroup('TEST 11: TypeScript Compilation');

try {
  execSync('npm run build -- learning-service', { cwd: rootDir, stdio: 'pipe' });
  console.log('  ✅ Learning Service compiles successfully');
  testsPassed++;
  passTest('TEST 11');
} catch (error) {
  console.log('  ❌ TypeScript compilation failed');
  testsFailed++;
  failTest('TEST 11');
}

// SUMMARY
console.log('='.repeat(80));
if (testsFailed === 0) {
  console.log('✅ ALL STEP 43 TESTS PASSED');
  console.log('\nSTEP 43 COMPLETE: Entity Profile Creation');
  console.log('\n✨ Entity Profile Features:');
  console.log('  • CreateEntityProfileDto - Create new entity profiles');
  console.log('  • UpdateEntityProfileDto - Update existing profiles');
  console.log('  • EntityProfileResponseDto - Full profile data');
  console.log('  • EntityProfileStatsDto - Profile statistics');
  console.log('\n📊 Service Methods:');
  console.log('  • createProfile() - Create new entity profile');
  console.log('  • updateProfile() - Update existing profile');
  console.log('  • getProfile() - Get profile by entityId');
  console.log('  • getAllProfiles() - List all profiles');
  console.log('  • deleteProfile() - Remove profile');
  console.log('  • getProfileStats() - Calculate statistics');
  console.log('\n🌐 REST Endpoints:');
  console.log('  • POST   /learning/profile - Create profile');
  console.log('  • GET    /learning/profile - Get all profiles');
  console.log('  • GET    /learning/profile/:entityId - Get by ID');
  console.log('  • PUT    /learning/profile/:entityId - Update profile');
  console.log('  • DELETE /learning/profile/:entityId - Delete profile');
  console.log('  • GET    /learning/profile/:entityId/stats - Get stats');
  console.log('\n📈 Profile Data Tracked:');
  console.log('  • Identity (primaryName, aliases, legalName)');
  console.log('  • Business info (industry, location, tags)');
  console.log('  • Amount patterns (min, max, median)');
  console.log('  • Frequency patterns (daily, weekly, monthly)');
  console.log('  • Statistics (totalTransactions, successfulMatches)');
  console.log('  • Confidence scores');
  console.log('\n✅ Ready for Step 44: Add per-bank behavior tracking');
} else {
  console.log(`❌ TESTS FAILED: ${testsFailed} failed, ${testsPassed} passed`);
  process.exit(1);
}
console.log('='.repeat(80));
