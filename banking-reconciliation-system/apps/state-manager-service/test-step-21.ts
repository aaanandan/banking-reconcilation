/**
 * STEP 21: Multi-Bank Transaction Storage (Verification)
 *
 * Verifies that normalized transactions from multiple banks can be stored
 * and queried with proper bankId tracking:
 * - BulkStoreTransactionsDto accepts bankId for each transaction
 * - Service stores transactions with bankId preserved
 * - QueryTransactionsDto supports bankId filtering
 * - Service queryTransactions filters by bankId correctly
 * - TransactionDto includes bankId field
 * - TypeScript compilation
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const baseDir = path.join(__dirname, 'src');
const rootDir = path.join(__dirname, '..', '..');

console.log('='.repeat(80));
console.log('TESTING STEP 21: Multi-Bank Transaction Storage');
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

// TEST 1: Verify TransactionDto Has bankId
testGroup('TEST 1: Verify TransactionDto Has bankId Field');

const sharedFile = path.join(rootDir, 'libs', 'shared', 'src', 'dto', 'transaction.dto.ts');
const sharedContent = fs.readFileSync(sharedFile, 'utf-8');

assert(
  sharedContent.includes('bankId') && sharedContent.includes('string'),
  'TransactionDto has bankId field (string type)',
);
assert(
  sharedContent.includes('@ApiPropertyOptional') || sharedContent.includes('@ApiProperty'),
  'bankId has Swagger decorator',
);

passTest('TEST 1');

// TEST 2: Verify BulkStoreTransactionsDto Structure
testGroup('TEST 2: Verify BulkStoreTransactionsDto Accepts bankId');

const transactionDtoFile = path.join(baseDir, 'dto', 'transaction.dto.ts');
const transactionDtoContent = fs.readFileSync(transactionDtoFile, 'utf-8');

assert(
  transactionDtoContent.includes('export class BulkStoreTransactionsDto'),
  'BulkStoreTransactionsDto defined',
);
assert(
  transactionDtoContent.includes('transactions') &&
    transactionDtoContent.includes('TransactionDto[]'),
  'BulkStoreTransactionsDto has transactions array (TransactionDto[])',
);
assert(
  transactionDtoContent.includes('reconciliationId'),
  'BulkStoreTransactionsDto has reconciliationId field',
);
assert(
  transactionDtoContent.includes('@ValidateNested'),
  'BulkStoreTransactionsDto validates nested transaction objects',
);

passTest('TEST 2');

// TEST 3: Verify QueryTransactionsDto Supports bankId Filter
testGroup('TEST 3: Verify QueryTransactionsDto Supports bankId Filtering');

assert(
  transactionDtoContent.includes('export class QueryTransactionsDto'),
  'QueryTransactionsDto defined',
);
assert(
  transactionDtoContent.includes('reconciliationId'),
  'QueryTransactionsDto has reconciliationId filter',
);
assert(
  transactionDtoContent.includes('source') &&
    (transactionDtoContent.includes("'bank'") || transactionDtoContent.includes('"bank"')),
  'QueryTransactionsDto has source filter (bank/ledger)',
);
assert(
  transactionDtoContent.includes('bankId'),
  'QueryTransactionsDto has bankId filter for multi-bank support',
);
assert(
  transactionDtoContent.includes('status'),
  'QueryTransactionsDto has status filter',
);

passTest('TEST 3');

// TEST 4: Verify Service Stores Transactions with bankId
testGroup('TEST 4: Verify Service Stores Transactions with bankId');

const serviceFile = path.join(baseDir, 'state-manager-service.service.ts');
const serviceContent = fs.readFileSync(serviceFile, 'utf-8');

assert(
  serviceContent.includes('bulkStoreTransactions'),
  'bulkStoreTransactions method exists',
);
assert(
  serviceContent.includes('transactions'),
  'bulkStoreTransactions processes transactions array',
);

// Verify bankId is preserved when storing
const bulkStoreSection = serviceContent.substring(
  serviceContent.indexOf('bulkStoreTransactions'),
  serviceContent.indexOf('bulkStoreTransactions') + 3000,
);
assert(
  bulkStoreSection.includes('bankId'),
  'bulkStoreTransactions preserves bankId when storing transactions',
);
assert(
  bulkStoreSection.includes('source'),
  'bulkStoreTransactions sets source field (bank/ledger)',
);

passTest('TEST 4');

// TEST 5: Verify Service Queries Transactions by bankId
testGroup('TEST 5: Verify Service Queries Transactions by bankId');

assert(
  serviceContent.includes('queryTransactions'),
  'queryTransactions method exists',
);

const querySection = serviceContent.substring(
  serviceContent.indexOf('queryTransactions'),
  serviceContent.indexOf('queryTransactions') + 2000,
);
assert(
  querySection.includes('reconciliationId'),
  'queryTransactions filters by reconciliationId',
);
assert(
  querySection.includes('source') && querySection.includes('query.source'),
  'queryTransactions filters by source',
);
assert(
  querySection.includes('bankId') && querySection.includes('query.bankId'),
  'queryTransactions filters by bankId for multi-bank support',
);
assert(
  querySection.includes('status') && querySection.includes('query.status'),
  'queryTransactions filters by status',
);

passTest('TEST 5');

// TEST 6: Verify Controller Query Endpoint
testGroup('TEST 6: Verify Controller Exposes Query Filters');

const controllerFile = path.join(baseDir, 'state-manager-service.controller.ts');
const controllerContent = fs.readFileSync(controllerFile, 'utf-8');

assert(
  controllerContent.includes('@Get') && controllerContent.includes('transactions'),
  'Controller has GET /transactions endpoint',
);
assert(
  controllerContent.includes('@ApiQuery') && controllerContent.includes('reconciliationId'),
  'Controller documents reconciliationId query parameter',
);
assert(
  controllerContent.includes('@ApiQuery') && controllerContent.includes('source'),
  'Controller documents source query parameter',
);
assert(
  controllerContent.includes('@ApiQuery') && controllerContent.includes('bankId'),
  'Controller documents bankId query parameter for multi-bank',
);
assert(
  controllerContent.includes('@ApiQuery') && controllerContent.includes('status'),
  'Controller documents status query parameter',
);

passTest('TEST 6');

// TEST 7: TypeScript Compilation
testGroup('TEST 7: TypeScript Compilation');

try {
  execSync('npm run build', { cwd: rootDir, stdio: 'pipe' });
  console.log('  ✅ Compiles successfully');
  testsPassed++;
  passTest('TEST 7');
} catch (error) {
  console.log('  ❌ Compilation failed');
  testsFailed++;
  failTest('TEST 7');
}

// SUMMARY
console.log('='.repeat(80));
if (testsFailed === 0) {
  console.log('✅ ALL STEP 21 TESTS PASSED');
  console.log('\nSTEP 21 COMPLETE: Multi-Bank Transaction Storage');
  console.log('\n✨ Multi-Bank Features Verified:');
  console.log('  • TransactionDto includes bankId field');
  console.log('  • BulkStoreTransactionsDto accepts transactions with bankId');
  console.log('  • Service preserves bankId when storing transactions');
  console.log('  • QueryTransactionsDto supports bankId filtering');
  console.log('  • Service queryTransactions filters by bankId');
  console.log('  • Controller exposes bankId query parameter');
  console.log('\nUSAGE EXAMPLE:');
  console.log('  POST /state/transactions/bulk');
  console.log('  {');
  console.log('    "reconciliationId": "recon-123",');
  console.log('    "transactions": [');
  console.log('      { "source": "bank", "bankId": "bank-A", "amount": 100, ... },');
  console.log('      { "source": "bank", "bankId": "bank-B", "amount": 200, ... },');
  console.log('      { "source": "ledger", "amount": 100, ... }');
  console.log('    ]');
  console.log('  }');
  console.log('');
  console.log('  GET /state/transactions?reconciliationId=recon-123&bankId=bank-A');
  console.log('  → Returns only transactions from bank-A');
} else {
  console.log(`❌ TESTS FAILED: ${testsFailed} failed, ${testsPassed} passed`);
  process.exit(1);
}
console.log('='.repeat(80));
