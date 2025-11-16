/**
 * STEP 19: State Snapshot (Save/Resume) - Verification
 * 
 * Verifies that reconciliation state can be saved and resumed:
 * - Snapshot DTOs defined
 * - Service has saveSnapshot, resumeFromSnapshot, listSnapshots methods
 * - Controller has snapshot endpoints
 * - Snapshots stored in metadata
 * - TypeScript compilation
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const baseDir = path.join(__dirname, 'src');
const rootDir = path.join(__dirname, '..', '..');

console.log('='.repeat(80));
console.log('TESTING STEP 19: State Snapshot (Save/Resume)');
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

// TEST 1: Snapshot DTOs
testGroup('TEST 1: Verify Snapshot DTOs');

const dtoFile = path.join(baseDir, 'dto', 'reconciliation.dto.ts');
const dtoContent = fs.readFileSync(dtoFile, 'utf-8');

assert(dtoContent.includes('SaveSnapshotDto'), 'SaveSnapshotDto exists');
assert(dtoContent.includes('SaveSnapshotResponseDto'), 'SaveSnapshotResponseDto exists');
assert(dtoContent.includes('ResumeSnapshotResponseDto'), 'ResumeSnapshotResponseDto exists');

passTest('TEST 1');

// TEST 2: Service Methods
testGroup('TEST 2: Verify Service Snapshot Methods');

const serviceFile = path.join(baseDir, 'state-manager-service.service.ts');
const serviceContent = fs.readFileSync(serviceFile, 'utf-8');

assert(serviceContent.includes('saveSnapshot'), 'saveSnapshot method exists');
assert(serviceContent.includes('resumeFromSnapshot'), 'resumeFromSnapshot method exists');
assert(serviceContent.includes('listSnapshots'), 'listSnapshots method exists');
assert(serviceContent.includes('metadata.snapshots'), 'Stores snapshots in metadata');

passTest('TEST 2');

// TEST 3: Controller Endpoints
testGroup('TEST 3: Verify Snapshot Controller Endpoints');

const controllerFile = path.join(baseDir, 'state-manager-service.controller.ts');
const controllerContent = fs.readFileSync(controllerFile, 'utf-8');

assert(controllerContent.includes('@Post') && controllerContent.includes('/snapshot'), 'POST snapshot endpoint');
assert(controllerContent.includes('/resume'), 'POST resume endpoint');
assert(controllerContent.includes('@Get') && controllerContent.includes('/snapshots'), 'GET list snapshots endpoint');

passTest('TEST 3');

// TEST 4: TypeScript Compilation
testGroup('TEST 4: TypeScript Compilation');

try {
  execSync('npm run build', { cwd: rootDir, stdio: 'pipe' });
  console.log('  ✅ Compiles successfully');
  testsPassed++;
  passTest('TEST 4');
} catch (error) {
  console.log('  ❌ Compilation failed');
  testsFailed++;
  failTest('TEST 4');
}

// SUMMARY
console.log('='.repeat(80));
if (testsFailed === 0) {
  console.log('✅ ALL STEP 19 TESTS PASSED');
  console.log('\nSTEP 19 COMPLETE: State Snapshot (Save/Resume)');
  console.log('\n✨ Enables pause/resume of long-running reconciliations');
} else {
  console.log(`❌ TESTS FAILED: ${testsFailed} failed, ${testsPassed} passed`);
  process.exit(1);
}
console.log('='.repeat(80));
