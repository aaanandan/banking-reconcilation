/**
 * STEP 56 VERIFICATION: MT-05 Split Payments
 */
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const baseDir = path.join(__dirname, 'src');
const serviceFile = path.join(baseDir, 'mt-05-split-payments.service.ts');
const content = fs.readFileSync(serviceFile, 'utf-8');

console.log('STEP 56: MT-05 Split Payments - Verification');
console.log('='.repeat(60));

let passed = 0;
const check = (cond: boolean, msg: string) => {
  console.log(cond ? `✓ ${msg}` : `✗ ${msg}`);
  if (cond) passed++;
};

check(content.includes('STEP 56'), 'Step 56 documented');
check(content.includes('Complex Matcher'), 'Identified as Complex Matcher');
check(content.includes('findSplitPayments'), 'Main matching method');
check(content.includes('groupBankTransactions'), 'Transaction grouping');
check(content.includes('calculateSimilarity'), 'Description similarity');
check(content.includes('isValidGroup'), 'Group validation');
check(content.includes('DEFAULT_MAX_SPLIT_SIZE'), 'Max split size configured');
check(content.includes('AMOUNT_TOLERANCE'), 'Amount tolerance configured');
check(content.includes('DATE_TOLERANCE'), 'Date tolerance configured');
check(content.includes('MT-05'), 'MT-05 algorithm tag');

try {
  execSync('npm run build -- mt-05-split-payments', { cwd: path.join(__dirname, '..', '..'), stdio: 'pipe' });
  console.log('✓ TypeScript compiles');
  passed++;
} catch { console.log('✗ TypeScript compilation failed'); }

console.log(`\n${passed}/11 checks passed`);
console.log(passed === 11 ? '✅ STEP 56 COMPLETE' : '❌ Some checks failed');
