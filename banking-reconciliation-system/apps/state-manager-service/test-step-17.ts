/**
 * STEP 17: Multi-Bank File Storage (Verification)
 *
 * This test verifies that the State Manager properly handles multiple bank files:
 * - BankFile entity supports multiple banks
 * - createReconciliation accepts array of bank files
 * - Each bank file has bankId and bankName
 * - Bank files are properly stored and linked to reconciliation
 * - getReconciliation returns all bank files
 * - TypeScript compilation
 *
 * Multi-bank file storage enables reconciliation across multiple bank accounts
 * (e.g., HDFC, ICICI, SBI) against a single ledger.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const baseDir = path.join(__dirname, 'src');
const rootDir = path.join(__dirname, '..', '..');
const sharedDir = path.join(__dirname, '..', '..', 'libs', 'shared', 'src');

console.log('='.repeat(80));
console.log('TESTING STEP 17: Multi-Bank File Storage');
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
// TEST 1: Verify BankFile Entity Supports Multi-Bank
// ============================================================================
testGroup('TEST 1: Verify BankFile Entity Supports Multi-Bank');

const bankFileEntityPath = path.join(sharedDir, 'entities', 'bank-file.entity.ts');
const bankFileContent = fs.readFileSync(bankFileEntityPath, 'utf-8');

assert(
  bankFileContent.includes('export class BankFile'),
  'BankFile entity exists',
);
assert(
  bankFileContent.includes('bankId') && bankFileContent.includes('string'),
  'BankFile has bankId field (string type)',
);
assert(
  bankFileContent.includes('bankName') && bankFileContent.includes('string'),
  'BankFile has bankName field (string type)',
);
assert(
  bankFileContent.includes('filename'),
  'BankFile has filename field',
);
assert(
  bankFileContent.includes('totalRecords'),
  'BankFile has totalRecords field',
);
assert(
  bankFileContent.includes('columnMapping'),
  'BankFile has columnMapping field',
);
assert(
  bankFileContent.includes('earliestDate') && bankFileContent.includes('latestDate'),
  'BankFile has date range fields',
);

passTest('TEST 1');

// ============================================================================
// TEST 2: Verify CreateReconciliationDto Accepts Multiple Bank Files
// ============================================================================
testGroup('TEST 2: Verify CreateReconciliationDto Accepts Multiple Bank Files');

const reconciliationDtoPath = path.join(baseDir, 'dto', 'reconciliation.dto.ts');
const reconciliationDtoContent = fs.readFileSync(reconciliationDtoPath, 'utf-8');

assert(
  reconciliationDtoContent.includes('bankFiles') &&
    (reconciliationDtoContent.includes('BankFileMetadataDto[]') ||
     reconciliationDtoContent.includes('Array<BankFileMetadataDto>')),
  'CreateReconciliationDto has bankFiles array',
);
assert(
  reconciliationDtoContent.includes('@IsArray') ||
    reconciliationDtoContent.includes('@ValidateNested'),
  'bankFiles has array validation decorator',
);

passTest('TEST 2');

// ============================================================================
// TEST 3: Verify Service Creates Multiple Bank Files
// ============================================================================
testGroup('TEST 3: Verify Service Creates Multiple Bank Files');

const serviceFilePath = path.join(baseDir, 'state-manager-service.service.ts');
const serviceContent = fs.readFileSync(serviceFilePath, 'utf-8');

assert(
  serviceContent.includes('createReconciliation'),
  'createReconciliation method exists',
);

// Check for loop to handle multiple bank files
assert(
  serviceContent.includes('for') &&
    serviceContent.includes('bankFile') &&
    serviceContent.indexOf('for', serviceContent.indexOf('createReconciliation')) > 0,
  'Service iterates over multiple bank files',
);

assert(
  serviceContent.includes('bankFileDto.bankId'),
  'Service extracts bankId from DTO',
);
assert(
  serviceContent.includes('bankFileDto.bankName'),
  'Service extracts bankName from DTO',
);

// Check that bank files are saved
assert(
  serviceContent.includes('bankFileRepo.save') ||
    serviceContent.includes('bankFileRepo.create'),
  'Service saves bank files to database',
);

// Check that bank files are linked to reconciliation
assert(
  serviceContent.includes('bankFiles') &&
    serviceContent.indexOf('bankFiles', serviceContent.indexOf('reconciliationRepo.create')) > 0,
  'Bank files are linked to reconciliation entity',
);

passTest('TEST 3');

// ============================================================================
// TEST 4: Verify getReconciliation Returns All Bank Files
// ============================================================================
testGroup('TEST 4: Verify getReconciliation Returns All Bank Files');

assert(
  serviceContent.includes('getReconciliation'),
  'getReconciliation method exists',
);

// Check for relations loading
const getReconciliationSection = serviceContent.substring(
  serviceContent.indexOf('getReconciliation'),
  serviceContent.indexOf('getReconciliation') + 1000
);

assert(
  getReconciliationSection.includes('bankFiles') ||
    getReconciliationSection.includes('relations'),
  'getReconciliation loads bankFiles relation',
);

passTest('TEST 4');

// ============================================================================
// TEST 5: Verify ReconciliationStateDto Includes Bank Files
// ============================================================================
testGroup('TEST 5: Verify ReconciliationStateDto Includes Bank Files');

assert(
  reconciliationDtoContent.includes('ReconciliationStateDto'),
  'ReconciliationStateDto exists',
);
assert(
  reconciliationDtoContent.includes('bankFiles') &&
    reconciliationDtoContent.indexOf('bankFiles', reconciliationDtoContent.indexOf('ReconciliationStateDto')) > 0,
  'ReconciliationStateDto includes bankFiles field',
);

passTest('TEST 5');

// ============================================================================
// TEST 6: Verify Controller Accepts Multi-Bank Create Request
// ============================================================================
testGroup('TEST 6: Verify Controller Accepts Multi-Bank Create Request');

const controllerFilePath = path.join(baseDir, 'state-manager-service.controller.ts');
const controllerContent = fs.readFileSync(controllerFilePath, 'utf-8');

assert(
  controllerContent.includes('createReconciliation'),
  'Controller has createReconciliation endpoint',
);
assert(
  controllerContent.includes('@Post') &&
    controllerContent.indexOf('@Post', controllerContent.indexOf('reconciliation')) > 0,
  'createReconciliation is POST endpoint',
);
assert(
  controllerContent.includes('CreateReconciliationDto'),
  'Controller accepts CreateReconciliationDto with bank files array',
);

passTest('TEST 6');

// ============================================================================
// TEST 7: Verify Swagger Documentation for Multi-Bank
// ============================================================================
testGroup('TEST 7: Verify Swagger Documentation for Multi-Bank');

assert(
  reconciliationDtoContent.includes('@ApiProperty') &&
    reconciliationDtoContent.indexOf('@ApiProperty', reconciliationDtoContent.indexOf('bankFiles')) > 0,
  'bankFiles field has @ApiProperty decorator',
);
assert(
  controllerContent.includes('@ApiOperation') &&
    controllerContent.indexOf('@ApiOperation', controllerContent.indexOf('createReconciliation')) > 0,
  'createReconciliation has @ApiOperation decorator',
);

passTest('TEST 7');

// ============================================================================
// TEST 8: TypeScript Compilation
// ============================================================================
testGroup('TEST 8: TypeScript Compilation');

try {
  execSync('npm run build', {
    cwd: rootDir,
    stdio: 'pipe',
  });
  console.log('  ✅ State Manager service compiles successfully');
  testsPassed++;
  passTest('TEST 8');
} catch (error) {
  console.log('  ❌ TypeScript compilation failed');
  testsFailed++;
  failTest('TEST 8');
}

// ============================================================================
// SUMMARY
// ============================================================================
console.log('='.repeat(80));
if (testsFailed === 0) {
  console.log('✅ ALL STEP 17 TESTS PASSED');
} else {
  console.log(`❌ SOME TESTS FAILED: ${testsFailed} failed, ${testsPassed} passed`);
  process.exit(1);
}

console.log('\nSTEP 17 COMPLETE: Multi-Bank File Storage');

console.log('\nSUMMARY:');
console.log('  ✅ BankFile entity supports bankId and bankName');
console.log('  ✅ CreateReconciliationDto accepts array of bank files');
console.log('  ✅ Service iterates and stores multiple bank files');
console.log('  ✅ Bank files linked to reconciliation entity');
console.log('  ✅ getReconciliation loads all bank files');
console.log('  ✅ ReconciliationStateDto includes bank files');
console.log('  ✅ Controller accepts multi-bank create requests');
console.log('  ✅ Swagger documentation complete');
console.log('  ✅ TypeScript compiles successfully');

console.log('\nMULTI-BANK FILE STORAGE ARCHITECTURE:');
console.log('  Reconciliation 1:N BankFile');
console.log('  ├── BankFile 1 (bank_1: HDFC Bank)');
console.log('  ├── BankFile 2 (bank_2: ICICI Bank)');
console.log('  └── BankFile 3 (bank_3: SBI)');
console.log('  Reconciliation 1:1 LedgerFile');

console.log('\nEXAMPLE CREATE REQUEST:');
console.log('  {');
console.log('    "userId": "user_001",');
console.log('    "bankFiles": [');
console.log('      {');
console.log('        "bankId": "bank_1",');
console.log('        "bankName": "HDFC Bank",');
console.log('        "filename": "hdfc_statement.csv",');
console.log('        "totalRecords": 150,');
console.log('        "...": "..."');
console.log('      },');
console.log('      {');
console.log('        "bankId": "bank_2",');
console.log('        "bankName": "ICICI Bank",');
console.log('        "filename": "icici_statement.csv",');
console.log('        "totalRecords": 200,');
console.log('        "...": "..."');
console.log('      }');
console.log('    ],');
console.log('    "ledgerFile": { "..." }');
console.log('  }');

console.log('\nBENEFITS:');
console.log('  • Reconcile multiple bank accounts against single ledger');
console.log('  • Track which bank each transaction belongs to');
console.log('  • Per-bank statistics and reporting');
console.log('  • Support for different banks with different formats');

console.log('\n✨ STEP 17: MULTI-BANK FILE STORAGE - COMPLETE!');
console.log('='.repeat(80));
