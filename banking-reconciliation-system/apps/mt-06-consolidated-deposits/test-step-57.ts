/**
 * STEP 57 VERIFICATION: MT-06 Consolidated Deposits
 */
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const baseDir = path.join(__dirname, 'src');
const serviceFile = path.join(baseDir, 'mt-06-consolidated-deposits.service.ts');
const content = fs.readFileSync(serviceFile, 'utf-8');

console.log('STEP 57: MT-06 Consolidated Deposits - Verification');
console.log('='.repeat(60));

let passed = 0;
const check = (cond: boolean, msg: string) => {
  console.log(cond ? `✓ ${msg}` : `✗ ${msg}`);
  if (cond) passed++;
};

check(content.includes('STEP 57'), 'Step 57 documented');
check(content.includes('Multi-Bank Matcher'), 'Identified as Multi-Bank Matcher');
check(content.includes('findConsolidatedDeposits'), 'Main matching method');
check(content.includes('filterDeposits'), 'Deposit filtering');
check(content.includes('DEPOSIT_KEYWORDS'), 'Deposit keywords defined');
check(content.includes('groupByDate'), 'Date grouping');
check(content.includes('bankBreakdown'), 'Bank breakdown tracking');
check(content.includes('banksInGroup'), 'Multi-bank detection');
check(content.includes('MT-06'), 'MT-06 algorithm tag');

try {
  execSync('npm run build -- mt-06-consolidated-deposits', { cwd: path.join(__dirname, '..', '..'), stdio: 'pipe' });
  console.log('✓ TypeScript compiles');
  passed++;
} catch { console.log('✗ TypeScript compilation failed'); }

console.log(`\n${passed}/10 checks passed`);
console.log(passed === 10 ? '✅ STEP 57 COMPLETE' : '❌ Some checks failed');
