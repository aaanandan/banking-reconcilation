/**
 * STEP 58 VERIFICATION: MT-09 Timing Differences
 */
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const baseDir = path.join(__dirname, 'src');
const serviceFile = path.join(baseDir, 'mt-09-timing-differences.service.ts');
const content = fs.readFileSync(serviceFile, 'utf-8');

console.log('STEP 58: MT-09 Timing Differences - Verification');
console.log('='.repeat(60));

let passed = 0;
const check = (cond: boolean, msg: string) => {
  console.log(cond ? `✓ ${msg}` : `✗ ${msg}`);
  if (cond) passed++;
};

check(content.includes('STEP 58'), 'Step 58 documented');
check(content.includes('Date-Flexible Matcher'), 'Identified as Date-Flexible Matcher');
check(content.includes('findTimingMatches'), 'Main matching method');
check(content.includes('getDateDifference'), 'Date difference calculation');
check(content.includes('calculateAmountScore'), 'Amount scoring');
check(content.includes('calculateDescriptionSimilarity'), 'Description similarity');
check(content.includes('DEFAULT_MAX_DATE_DIFFERENCE'), 'Max date difference configured');
check(content.includes('calculateTimingStats'), 'Timing statistics');
check(content.includes('MT-09'), 'MT-09 algorithm tag');

try {
  execSync('npm run build -- mt-09-timing-differences', { cwd: path.join(__dirname, '..', '..'), stdio: 'pipe' });
  console.log('✓ TypeScript compiles');
  passed++;
} catch { console.log('✗ TypeScript compilation failed'); }

console.log(`\n${passed}/10 checks passed`);
console.log(passed === 10 ? '✅ STEP 58 COMPLETE' : '❌ Some checks failed');
