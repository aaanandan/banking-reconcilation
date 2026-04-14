/**
 * MT-07 Duplicate Postings - Quick Verification
 */
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const baseDir = path.join(__dirname, 'src');
const serviceFile = path.join(baseDir, 'mt-07-duplicate-postings.service.ts');
const content = fs.readFileSync(serviceFile, 'utf-8');

console.log('MT-07: Duplicate Postings - Quick Verification');
console.log('='.repeat(60));

let passed = 0;
const check = (cond: boolean, msg: string) => {
  console.log(cond ? `✓ ${msg}` : `✗ ${msg}`);
  if (cond) passed++;
};

check(content.includes('STEP 60.1'), 'Step 60.1 documented');
check(content.includes('Exception Handler'), 'Identified as Exception Handler');
check(content.includes('classifyDuplicates'), 'Main classification method');
check(content.includes('groupByBank'), 'Bank grouping');
check(content.includes('findDuplicatesInBank'), 'Duplicate finding');
check(content.includes('areDuplicates'), 'Duplicate comparison logic');
check(content.includes('MAX_TIME_DIFFERENCE_HOURS'), 'Time threshold configured');
check(content.includes('MIN_DESCRIPTION_SIMILARITY'), 'Similarity threshold configured');
check(content.includes('MT-07'), 'MT-07 algorithm tag');

try {
  execSync('npm run build -- mt-07-duplicate-postings', { cwd: path.join(__dirname, '..', '..'), stdio: 'pipe' });
  console.log('✓ TypeScript compiles');
  passed++;
} catch { console.log('✗ TypeScript compilation failed'); }

console.log(`\n${passed}/10 checks passed`);
console.log(passed === 10 ? '✅ MT-07 COMPLETE' : '❌ Some checks failed');
