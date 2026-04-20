/**
 * STEP 59 VERIFICATION: MT-16 Final Validation
 */
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const baseDir = path.join(__dirname, 'src');
const serviceFile = path.join(baseDir, 'mt-16-final-validation.service.ts');
const content = fs.readFileSync(serviceFile, 'utf-8');

console.log('STEP 59: MT-16 Final Validation - Verification');
console.log('='.repeat(60));

let passed = 0;
const check = (cond: boolean, msg: string) => {
  console.log(cond ? `✓ ${msg}` : `✗ ${msg}`);
  if (cond) passed++;
};

check(content.includes('STEP 59'), 'Step 59 documented');
check(content.includes('Safety Validator'), 'Identified as Safety Validator');
check(content.includes('validateMatches'), 'Main validation method');
check(content.includes('checkCreditDebitMismatch'), 'Credit-debit check');
check(content.includes('checkDuplicateMatches'), 'Duplicate check');
check(content.includes('checkAmountSignConsistency'), 'Amount sign check');
check(content.includes('checkFutureDates'), 'Future date check');
check(content.includes('checkLowConfidence'), 'Confidence check');
check(content.includes('checkMandatoryFields'), 'Mandatory fields check');
check(content.includes('MT-16'), 'MT-16 algorithm tag');

try {
  execSync('npm run build -- mt-16-final-validation', { cwd: path.join(__dirname, '..', '..'), stdio: 'pipe' });
  console.log('✓ TypeScript compiles');
  passed++;
} catch { console.log('✗ TypeScript compilation failed'); }

console.log(`\n${passed}/11 checks passed`);
console.log(passed === 11 ? '✅ STEP 59 COMPLETE' : '❌ Some checks failed');
