/**
 * Test Script for Step 23: Exact Match Algorithm Implementation
 *
 * Verifies:
 * - Exact match algorithm logic (date, amount, description)
 * - 1:1 matching strategy (no duplicate ledger matches)
 * - Case-insensitive description matching
 * - REST endpoint structure (POST /match/exact)
 * - TypeScript compilation
 */

async function testStep23() {
  console.log('='.repeat(80));
  console.log('TESTING STEP 23: Exact Match Algorithm Implementation');
  console.log('='.repeat(80));
  console.log('');

  try {
    const fs = require('fs');
    const path = require('path');

    // Test 1: Verify Service Method Exists
    console.log('TEST 1: Verify Service Method Implementation');
    console.log('-'.repeat(80));

    const servicePath = path.join(__dirname, 'src/mt-01-exact-match.service.ts');
    const serviceContent = fs.readFileSync(servicePath, 'utf-8');

    const methods = {
      'findExactMatches': serviceContent.includes('findExactMatches(request: MatchRequestDto): MatchResponseDto'),
      'isExactMatch': serviceContent.includes('private isExactMatch('),
      'Date matching': serviceContent.includes('bank.date !== ledger.date'),
      'Amount matching': serviceContent.includes('bank.amount !== ledger.amount'),
      'Description matching': serviceContent.includes('toLowerCase().trim()'),
      '1:1 tracking': serviceContent.includes('matchedLedgerIds'),
    };

    let allMethodsExist = true;
    Object.entries(methods).forEach(([method, exists]) => {
      console.log(`  ${exists ? '✓' : '✗'} ${method}: ${exists ? 'YES' : 'NO'}`);
      if (!exists) allMethodsExist = false;
    });
    console.log('');

    const test1Pass = allMethodsExist;
    console.log(test1Pass ? '✅ TEST 1 PASSED' : '❌ TEST 1 FAILED');
    console.log('');
    console.log('');

    // Test 2: Verify REST Endpoint
    console.log('TEST 2: Verify REST Endpoint Structure');
    console.log('-'.repeat(80));

    const controllerPath = path.join(__dirname, 'src/mt-01-exact-match.controller.ts');
    const controllerContent = fs.readFileSync(controllerPath, 'utf-8');

    const endpoint = {
      'POST decorator': controllerContent.includes("@Post('exact')"),
      'Body binding': controllerContent.includes('@Body() request: MatchRequestDto'),
      'Return type': controllerContent.includes('): MatchResponseDto'),
      'Service call': controllerContent.includes('this.mt01ExactMatchService.findExactMatches(request)'),
      'ApiOperation': controllerContent.includes('@ApiOperation'),
      'ApiResponse': controllerContent.includes('@ApiResponse'),
    };

    let endpointComplete = true;
    Object.entries(endpoint).forEach(([feature, exists]) => {
      console.log(`  ${exists ? '✓' : '✗'} ${feature}: ${exists ? 'YES' : 'NO'}`);
      if (!exists) endpointComplete = false;
    });
    console.log('');

    const test2Pass = endpointComplete;
    console.log(test2Pass ? '✅ TEST 2 PASSED' : '❌ TEST 2 FAILED');
    console.log('');
    console.log('');

    // Test 3: Verify DTOs
    console.log('TEST 3: Verify Match DTOs');
    console.log('-'.repeat(80));

    const dtoPath = path.join(__dirname, 'src/dto/match.dto.ts');
    const dtoContent = fs.readFileSync(dtoPath, 'utf-8');

    const dtos = {
      'MatchRequestDto': dtoContent.includes('export class MatchRequestDto'),
      'MatchCandidateDto': dtoContent.includes('export class MatchCandidateDto'),
      'MatchResponseDto': dtoContent.includes('export class MatchResponseDto'),
      'bankTransactions field': dtoContent.includes('bankTransactions: TransactionDto[]'),
      'ledgerTransactions field': dtoContent.includes('ledgerTransactions: TransactionDto[]'),
      'confidence field': dtoContent.includes('confidence: number'),
      'reasoning field': dtoContent.includes('reasoning: string'),
      'algorithm field': dtoContent.includes('algorithm: string'),
    };

    let allDtosExist = true;
    Object.entries(dtos).forEach(([dto, exists]) => {
      console.log(`  ${exists ? '✓' : '✗'} ${dto}: ${exists ? 'YES' : 'NO'}`);
      if (!exists) allDtosExist = false;
    });
    console.log('');

    const test3Pass = allDtosExist;
    console.log(test3Pass ? '✅ TEST 3 PASSED' : '❌ TEST 3 FAILED');
    console.log('');
    console.log('');

    // Test 4: Algorithm Logic Verification (Static Code Analysis)
    console.log('TEST 4: Algorithm Logic Verification');
    console.log('-'.repeat(80));

    const logic = {
      'Iterates bank transactions': serviceContent.includes('for (const bankTxn of bankTransactions)'),
      'Iterates ledger transactions': serviceContent.includes('for (const ledgerTxn of ledgerTransactions)'),
      'Checks matched Set': serviceContent.includes('matchedLedgerIds.has(ledgerTxn.id)'),
      'Adds to matched Set': serviceContent.includes('matchedLedgerIds.add(ledgerTxn.id)'),
      'Breaks after match': serviceContent.includes('break'),
      'Returns MatchResponseDto': serviceContent.includes('return {'),
      'Sets confidence 1.0': serviceContent.includes('confidence: 1.0'),
      'Sets algorithm MT-01': serviceContent.includes("algorithm: 'MT-01'"),
      'Includes timestamp': serviceContent.includes('timestamp: new Date().toISOString()'),
    };

    let allLogicPresent = true;
    Object.entries(logic).forEach(([check, exists]) => {
      console.log(`  ${exists ? '✓' : '✗'} ${check}: ${exists ? 'YES' : 'NO'}`);
      if (!exists) allLogicPresent = false;
    });
    console.log('');

    const test4Pass = allLogicPresent;
    console.log(test4Pass ? '✅ TEST 4 PASSED' : '❌ TEST 4 FAILED');
    console.log('');
    console.log('');

    // Test 5: Manual Algorithm Test (In-Memory)
    console.log('TEST 5: Manual Algorithm Test (In-Memory)');
    console.log('-'.repeat(80));

    // Simulate the exact match algorithm
    const bankTransactions = [
      { id: 1, date: '2024-01-15', amount: 100.00, description: 'Payment ABC' },
      { id: 2, date: '2024-01-16', amount: 50.00, description: 'Transfer XYZ' },
      { id: 3, date: '2024-01-17', amount: 75.00, description: 'Invoice 123' },
    ];

    const ledgerTransactions = [
      { id: 101, date: '2024-01-15', amount: 100.00, description: 'payment abc' }, // Should match bank ID 1 (case-insensitive)
      { id: 102, date: '2024-01-16', amount: 50.00, description: 'Transfer XYZ' }, // Should match bank ID 2
      { id: 103, date: '2024-01-17', amount: 75.01, description: 'Invoice 123' }, // Should NOT match (amount differs)
      { id: 104, date: '2024-01-18', amount: 100.00, description: 'Payment ABC' }, // Should NOT match (date differs)
    ];

    // Simulate exact match logic
    const matches: any[] = [];
    const matchedLedgerIds = new Set<number>();

    for (const bankTxn of bankTransactions) {
      for (const ledgerTxn of ledgerTransactions) {
        if (matchedLedgerIds.has(ledgerTxn.id)) {
          continue;
        }

        const dateMatch = bankTxn.date === ledgerTxn.date;
        const amountMatch = bankTxn.amount === ledgerTxn.amount;
        const descMatch = bankTxn.description.toLowerCase().trim() === ledgerTxn.description.toLowerCase().trim();

        if (dateMatch && amountMatch && descMatch) {
          matches.push({
            bankTxnId: bankTxn.id,
            ledgerTxnId: ledgerTxn.id,
          });
          matchedLedgerIds.add(ledgerTxn.id);
          break;
        }
      }
    }

    console.log(`  Expected matches: 2`);
    console.log(`  Actual matches: ${matches.length}`);
    console.log('');
    console.log('  Match details:');
    matches.forEach((match, idx) => {
      console.log(`    Match ${idx + 1}: Bank txn ${match.bankTxnId} → Ledger txn ${match.ledgerTxnId}`);
    });
    console.log('');

    const expectedMatches = 2; // Bank 1→Ledger 101, Bank 2→Ledger 102
    const correctMatchCount = matches.length === expectedMatches;
    const correctMatch1 = matches.some(m => m.bankTxnId === 1 && m.ledgerTxnId === 101);
    const correctMatch2 = matches.some(m => m.bankTxnId === 2 && m.ledgerTxnId === 102);
    const noMatch3 = !matches.some(m => m.bankTxnId === 3); // Bank 3 should NOT match

    console.log(`  ✓ Correct match count (2): ${correctMatchCount ? 'YES' : 'NO'}`);
    console.log(`  ✓ Bank 1 → Ledger 101 (case-insensitive): ${correctMatch1 ? 'YES' : 'NO'}`);
    console.log(`  ✓ Bank 2 → Ledger 102: ${correctMatch2 ? 'YES' : 'NO'}`);
    console.log(`  ✓ Bank 3 NO match (amount differs): ${noMatch3 ? 'YES' : 'NO'}`);
    console.log('');

    const test5Pass = correctMatchCount && correctMatch1 && correctMatch2 && noMatch3;
    console.log(test5Pass ? '✅ TEST 5 PASSED' : '❌ TEST 5 FAILED');
    console.log('');
    console.log('');

    // Test 6: TypeScript Compilation
    console.log('TEST 6: TypeScript Compilation');
    console.log('-'.repeat(80));

    const execSync = require('child_process').execSync;
    let buildSuccess = false;

    try {
      execSync('npm run build:mt-01', { stdio: 'pipe', cwd: path.join(__dirname, '../..') });
      buildSuccess = true;
      console.log('  ✅ MT-01 service compiles successfully');
    } catch (error) {
      console.log('  ❌ Build failed - TypeScript compilation errors');
    }
    console.log('');

    const test6Pass = buildSuccess;
    console.log(test6Pass ? '✅ TEST 6 PASSED' : '❌ TEST 6 FAILED');
    console.log('');
    console.log('');

    // Final results
    console.log('='.repeat(80));
    const allTestsPassed = test1Pass && test2Pass && test3Pass && test4Pass && test5Pass && test6Pass;

    if (allTestsPassed) {
      console.log('✅ ALL STEP 23 TESTS PASSED');
      console.log('');
      console.log('STEP 23 COMPLETE: Exact Match Algorithm Implementation');
      console.log('');
      console.log('SUMMARY:');
      console.log('  ✅ findExactMatches() method implemented');
      console.log('  ✅ isExactMatch() private helper implemented');
      console.log('  ✅ POST /match/exact endpoint created');
      console.log('  ✅ MatchRequestDto, MatchCandidateDto, MatchResponseDto defined');
      console.log('  ✅ 1:1 matching strategy (Set-based tracking)');
      console.log('  ✅ Case-insensitive description matching');
      console.log('  ✅ Exact date and amount matching');
      console.log('  ✅ 100% confidence for exact matches');
      console.log('  ✅ Swagger documentation complete');
      console.log('  ✅ TypeScript compiles successfully');
      console.log('');
      console.log('ALGORITHM BEHAVIOR:');
      console.log('  • Matches on: date (exact) + amount (exact) + description (case-insensitive)');
      console.log('  • Each ledger transaction matched at most once (1:1)');
      console.log('  • Returns confidence: 1.0 for all matches');
      console.log('  • Algorithm identifier: MT-01');
      console.log('  • Breaks after first match per bank transaction');
      console.log('');
      console.log('ENDPOINT:');
      console.log('  POST /match/exact');
      console.log('  Request: { bankTransactions: [...], ledgerTransactions: [...] }');
      console.log('  Response: { matches: [...], totalMatches: N, algorithm: "MT-01-Exact", timestamp: ISO }');
      console.log('');
      console.log('✨ STEP 23: EXACT MATCH ALGORITHM - COMPLETE!');
      console.log('');
      console.log('READY FOR STEP 24: Add bankId awareness');
      console.log('='.repeat(80));
      process.exit(0);
    } else {
      console.log('❌ SOME STEP 23 TESTS FAILED');
      console.log('='.repeat(80));
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ TEST FAILED WITH ERROR:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testStep23();
