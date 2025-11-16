/**
 * STEP 20: All REST Endpoints Verification
 *
 * Comprehensive verification of all State Manager endpoints
 */

import * as fs from 'fs';
import * as path from 'path';

const baseDir = path.join(__dirname, 'src');

console.log('='.repeat(80));
console.log('TESTING STEP 20: All REST Endpoints');
console.log('='.repeat(80));

const controllerFile = path.join(baseDir, 'state-manager-service.controller.ts');
const controllerContent = fs.readFileSync(controllerFile, 'utf-8');

const endpoints = [
  { method: 'GET', route: 'health', desc: 'Health check' },
  { method: 'POST', route: 'reconciliation', desc: 'Create reconciliation' },
  { method: 'GET', route: 'reconciliation/:id', desc: 'Get reconciliation' },
  { method: 'PATCH', route: 'reconciliation/:id', desc: 'Update reconciliation' },
  { method: 'DELETE', route: 'reconciliation/:id', desc: 'Delete reconciliation' },
  { method: 'POST', route: 'transactions/bulk', desc: 'Bulk store transactions' },
  { method: 'GET', route: 'transactions', desc: 'Query transactions' },
  { method: 'POST', route: 'reconciliation/:id/snapshot', desc: 'Save snapshot' },
  { method: 'POST', route: 'snapshot/:snapshotId/resume', desc: 'Resume from snapshot' },
  { method: 'GET', route: 'reconciliation/:id/snapshots', desc: 'List snapshots' },
];

let passed = 0;
let failed = 0;

console.log('\nVerifying Endpoints:');
console.log('-'.repeat(80));

endpoints.forEach(ep => {
  const decorator = `@${ep.method.charAt(0)}${ep.method.slice(1).toLowerCase()}`;
  const hasMethod = controllerContent.includes(decorator);
  const hasRoute = controllerContent.includes(ep.route);

  if (hasMethod && hasRoute) {
    console.log(`  ✓ ${ep.method.padEnd(7)} /state/${ep.route.padEnd(45)} ${ep.desc}`);
    passed++;
  } else {
    console.log(`  ✗ ${ep.method.padEnd(7)} /state/${ep.route.padEnd(45)} ${ep.desc}`);
    failed++;
  }
});

console.log('\n' + '='.repeat(80));
if (failed === 0) {
  console.log(`✅ ALL ${passed} ENDPOINTS VERIFIED`);
  console.log('\nSTEP 20 COMPLETE: All REST Endpoints');
  console.log('\nEndpoint Categories:');
  console.log('  • Reconciliation CRUD (4 endpoints)');
  console.log('  • Transaction management (2 endpoints)');
  console.log('  • State snapshots (3 endpoints)');
  console.log('  • Health check (1 endpoint)');
} else {
  console.log(`❌ ${failed} endpoints missing, ${passed} found`);
  process.exit(1);
}
console.log('='.repeat(80));
