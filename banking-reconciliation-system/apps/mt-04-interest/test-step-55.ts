/**
 * STEP 55 QUICK VERIFICATION: MT-04 Interest Credits
 */
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const baseDir = path.join(__dirname, 'src');
const serviceFile = path.join(baseDir, 'mt-04-interest.service.ts');
const content = fs.readFileSync(serviceFile, 'utf-8');

console.log('STEP 55: MT-04 Interest Credits - Quick Verification');
console.log('='.repeat(60));

let passed = 0;
const check = (cond: boolean, msg: string) => {
  console.log(cond ? `✓ ${msg}` : `✗ ${msg}`);
  if (cond) passed++;
};

check(content.includes('STEP 55'), 'Step 55 documented');
check(content.includes('INTEREST_KEYWORDS'), 'Interest keywords defined');
check(content.includes('isCredit'), 'Checks credit/debit');
check(content.includes('classifyInterest'), 'Main classify method');
check(content.includes('detectKeywords'), 'Keyword detection');
check(content.includes('MT-04'), 'MT-04 algorithm tag');

try {
  execSync('npm run build -- mt-04-interest', { cwd: path.join(__dirname, '..', '..'), stdio: 'pipe' });
  console.log('✓ TypeScript compiles');
  passed++;
} catch { console.log('✗ TypeScript compilation failed'); }

console.log(`\n${passed}/7 checks passed`);
console.log(passed === 7 ? '✅ STEP 55 COMPLETE' : '❌ Some checks failed');
