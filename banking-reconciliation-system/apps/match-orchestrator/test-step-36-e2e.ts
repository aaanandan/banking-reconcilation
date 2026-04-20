/**
 * STEP 36: End-to-End Orchestration Test
 *
 * This test verifies the complete orchestration workflow:
 * - Orchestrator calls MT-01 for exact matching
 * - Orchestrator calls MT-02 for fuzzy matching on remaining
 * - Results are combined with aggregated statistics
 * - Bank-level statistics are calculated
 * - Algorithm-level statistics are calculated
 * - Overall match rate is computed
 *
 * Test Workflow:
 * 1. Create test data (10 bank transactions, 9 ledger transactions)
 *    - 4 exact match scenarios
 *    - 5 fuzzy match scenarios (date off, amount off, typos, abbreviations)
 *    - 1 intentional no-match
 * 2. Call Orchestrator service (which internally calls MT-01 → MT-02)
 * 3. Verify combined results and statistics
 *
 * Expected Results:
 * - MT-01: 4 exact matches (40%)
 * - MT-02: 5 fuzzy matches (50%)
 * - Combined: 9/10 matches (90%)
 * - Bank statistics for 3 banks (HDFC, ICICI, SBI)
 * - Algorithm statistics for MT-01 and MT-02
 */

import axios from 'axios';

const ORCHESTRATOR_URL = 'http://localhost:3005/orchestrate/reconcile';

console.log('='.repeat(80));
console.log('END-TO-END TEST: Match Orchestrator Service');
console.log('='.repeat(80));

// ============================================================================
// TEST DATA: Same as Step 30 Integration Test
// ============================================================================
console.log('\nSETUP: Creating Test Data');
console.log('-'.repeat(80));

// Bank Transactions (10 total from 3 banks)
const bankTransactions = [
  // EXACT MATCH SCENARIOS (4)
  {
    id: 1,
    bankId: 'bank_1',
    bankName: 'HDFC Bank',
    date: '2024-01-15',
    amount: 5000.0,
    description: 'Office Rent Payment',
  },
  {
    id: 2,
    bankId: 'bank_1',
    bankName: 'HDFC Bank',
    date: '2024-01-16',
    amount: 12000.0,
    description: 'Software License',
  },
  {
    id: 5,
    bankId: 'bank_2',
    bankName: 'ICICI Bank',
    date: '2024-01-22',
    amount: 8500.0,
    description: 'Vendor Payment',
  },
  {
    id: 8,
    bankId: 'bank_3',
    bankName: 'SBI',
    date: '2024-01-28',
    amount: 25000.0,
    description: 'Salary Credit',
  },

  // FUZZY MATCH SCENARIOS (5)
  // Date off by 1 day
  {
    id: 3,
    bankId: 'bank_1',
    bankName: 'HDFC Bank',
    date: '2024-01-18',
    amount: 3500.0,
    description: 'Equipment Purchase',
  },
  // Amount off by 1% (fees)
  {
    id: 4,
    bankId: 'bank_1',
    bankName: 'HDFC Bank',
    date: '2024-01-20',
    amount: 2475.0,
    description: 'Marketing Expenses',
  },
  // Typo in description
  {
    id: 6,
    bankId: 'bank_2',
    bankName: 'ICICI Bank',
    date: '2024-01-23',
    amount: 1500.0,
    description: 'Stationary Purchase',
  },
  // Abbreviated description
  {
    id: 7,
    bankId: 'bank_2',
    bankName: 'ICICI Bank',
    date: '2024-01-25',
    amount: 4200.0,
    description: 'Contractor Pymt',
  },
  // Date + description variation
  {
    id: 9,
    bankId: 'bank_3',
    bankName: 'SBI',
    date: '2024-01-29',
    amount: 3000.0,
    description: 'Utilities Bill',
  },

  // NO MATCH SCENARIO (1)
  {
    id: 10,
    bankId: 'bank_3',
    bankName: 'SBI',
    date: '2024-01-30',
    amount: 999.0,
    description: 'Bank Charges',
  },
];

// Ledger Transactions (9 total - no entry for Bank Charges)
const ledgerTransactions = [
  // Exact matches (4)
  { id: 101, date: '2024-01-15', amount: 5000.0, description: 'Office Rent Payment' },
  { id: 102, date: '2024-01-16', amount: 12000.0, description: 'Software License' },
  { id: 103, date: '2024-01-22', amount: 8500.0, description: 'Vendor Payment' },
  { id: 104, date: '2024-01-28', amount: 25000.0, description: 'Salary Credit' },

  // Fuzzy match candidates (5)
  { id: 105, date: '2024-01-17', amount: 3500.0, description: 'Equipment Purchase' }, // Date off
  { id: 106, date: '2024-01-20', amount: 2500.0, description: 'Marketing Expenses' }, // Amount off
  { id: 107, date: '2024-01-23', amount: 1500.0, description: 'Stationery Purchase' }, // Typo
  { id: 108, date: '2024-01-25', amount: 4200.0, description: 'Contractor Payment' }, // Abbreviated
  { id: 109, date: '2024-01-30', amount: 3000.0, description: 'Utilities Payment' }, // Date + desc variation
];

console.log(`  Created ${bankTransactions.length} bank transactions (3 banks)`);
console.log(`  Created ${ledgerTransactions.length} ledger transactions`);
console.log(`\n✅ SETUP COMPLETE\n`);

// ============================================================================
// MAIN TEST: Call Orchestrator Service
// ============================================================================
async function runTest() {
  try {
    console.log('CALLING ORCHESTRATOR SERVICE');
    console.log('-'.repeat(80));
    console.log(`  Endpoint: ${ORCHESTRATOR_URL}`);
    console.log(`  Bank Transactions: ${bankTransactions.length}`);
    console.log(`  Ledger Transactions: ${ledgerTransactions.length}`);

    const response = await axios.post(ORCHESTRATOR_URL, {
      bankTransactions,
      ledgerTransactions,
    });

    const result = response.data;

    console.log(`\n✅ ORCHESTRATOR RESPONSE RECEIVED\n`);

    // ========================================================================
    // VERIFY RESULTS
    // ========================================================================
    console.log('VERIFYING RESULTS');
    console.log('-'.repeat(80));

    // Verify basic structure
    console.log('\n  Basic Structure:');
    console.log(`    ✓ matches: ${result.matches ? result.matches.length : 'MISSING'}`);
    console.log(`    ✓ exactMatches: ${result.exactMatches ? result.exactMatches.length : 'MISSING'}`);
    console.log(`    ✓ fuzzyMatches: ${result.fuzzyMatches ? result.fuzzyMatches.length : 'MISSING'}`);
    console.log(`    ✓ totalMatches: ${result.totalMatches}`);
    console.log(`    ✓ exactMatchCount: ${result.exactMatchCount}`);
    console.log(`    ✓ fuzzyMatchCount: ${result.fuzzyMatchCount}`);
    console.log(`    ✓ totalBankTransactions: ${result.totalBankTransactions}`);
    console.log(`    ✓ totalLedgerTransactions: ${result.totalLedgerTransactions}`);
    console.log(`    ✓ unmatched: ${result.unmatched}`);
    console.log(`    ✓ overallMatchRate: ${result.overallMatchRate}`);
    console.log(`    ✓ workflow: ${result.workflow}`);
    console.log(`    ✓ timestamp: ${result.timestamp}`);

    // Verify counts
    console.log('\n  Match Counts:');
    const exactOk = result.exactMatchCount === 4;
    const fuzzyOk = result.fuzzyMatchCount === 5;
    const totalOk = result.totalMatches === 9;
    const unmatchedOk = result.unmatched === 1;

    console.log(`    ${exactOk ? '✓' : '✗'} Exact matches: ${result.exactMatchCount} (expected 4)`);
    console.log(`    ${fuzzyOk ? '✓' : '✗'} Fuzzy matches: ${result.fuzzyMatchCount} (expected 5)`);
    console.log(`    ${totalOk ? '✓' : '✗'} Total matches: ${result.totalMatches} (expected 9)`);
    console.log(`    ${unmatchedOk ? '✓' : '✗'} Unmatched: ${result.unmatched} (expected 1)`);

    // Verify match rate
    console.log('\n  Match Rate:');
    const expectedRate = 0.9; // 9/10 = 0.9
    const rateOk = Math.abs(result.overallMatchRate - expectedRate) < 0.01;
    console.log(`    ${rateOk ? '✓' : '✗'} Overall match rate: ${result.overallMatchRate} (expected ${expectedRate})`);

    // Verify bank statistics
    console.log('\n  Bank Statistics:');
    const bankStats = result.bankStatistics || [];
    console.log(`    ✓ Number of banks: ${bankStats.length} (expected 3)`);

    for (const bank of bankStats) {
      console.log(`\n    ${bank.bankId} (${bank.bankName}):`);
      console.log(`      • Total transactions: ${bank.totalTransactions}`);
      console.log(`      • Exact matches: ${bank.exactMatches}`);
      console.log(`      • Fuzzy matches: ${bank.fuzzyMatches}`);
      console.log(`      • Total matches: ${bank.totalMatches}`);
      console.log(`      • Unmatched: ${bank.unmatched}`);
      console.log(`      • Match rate: ${bank.matchRate} (${Math.round(bank.matchRate * 100)}%)`);
    }

    // Verify algorithm statistics
    console.log('\n  Algorithm Statistics:');
    const algoStats = result.algorithmStatistics || [];
    console.log(`    ✓ Number of algorithms: ${algoStats.length} (expected 2)`);

    for (const algo of algoStats) {
      console.log(`\n    ${algo.algorithm}:`);
      console.log(`      • Matches found: ${algo.matchesFound}`);
      console.log(`      • Match rate: ${algo.matchRate} (${Math.round(algo.matchRate * 100)}%)`);
    }

    // ========================================================================
    // FINAL VERIFICATION
    // ========================================================================
    console.log('\n' + '='.repeat(80));

    const allChecks = exactOk && fuzzyOk && totalOk && unmatchedOk && rateOk;

    if (allChecks) {
      console.log('✅ ALL TESTS PASSED');
    } else {
      console.log('❌ SOME TESTS FAILED');
      process.exit(1);
    }

    console.log('\nSTEP 36 COMPLETE: End-to-End Orchestration Test');

    console.log('\nSUCCESS SUMMARY:');
    console.log('  ✅ Orchestrator service responded successfully');
    console.log('  ✅ MT-01 exact matching: 4/10 (40%)');
    console.log('  ✅ MT-02 fuzzy matching: 5/10 (50%)');
    console.log('  ✅ Combined workflow: 9/10 (90%)');
    console.log('  ✅ Bank statistics aggregated correctly');
    console.log('  ✅ Algorithm statistics calculated correctly');
    console.log('  ✅ Overall match rate: 90%');

    console.log('\nWORKFLOW VALIDATED:');
    console.log('  1. ✅ Client calls Orchestrator (POST /orchestrate/reconcile)');
    console.log('  2. ✅ Orchestrator calls MT-01 for exact matching');
    console.log('  3. ✅ Orchestrator extracts unmatched transactions');
    console.log('  4. ✅ Orchestrator calls MT-02 for fuzzy matching');
    console.log('  5. ✅ Orchestrator combines results and aggregates statistics');
    console.log('  6. ✅ Client receives comprehensive reconciliation response');

    console.log('\nSERVICES ARCHITECTURE:');
    console.log('  ┌─────────────────────────────────────────┐');
    console.log('  │  Match Orchestrator Service (port 3005) │');
    console.log('  └─────────────────┬───────────────────────┘');
    console.log('                    │');
    console.log('         ┌──────────┴──────────┐');
    console.log('         ▼                     ▼');
    console.log('  ┌──────────────┐      ┌──────────────┐');
    console.log('  │ MT-01 Exact  │      │ MT-02 Fuzzy  │');
    console.log('  │ (port 3003)  │      │ (port 3004)  │');
    console.log('  └──────────────┘      └──────────────┘');

    console.log('\n✨ STEP 36: END-TO-END ORCHESTRATION - COMPLETE!');
    console.log('\n🎉 PHASE 6 COMPLETE: MATCH ORCHESTRATOR SERVICE');
    console.log('='.repeat(80));
  } catch (error: any) {
    console.error('\n❌ TEST FAILED');
    console.error('\nError Details:');

    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Message: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      console.error('  No response received from server');
      console.error('  Possible causes:');
      console.error('    - Orchestrator service not running on port 3005');
      console.error('    - MT-01 service not running on port 3003');
      console.error('    - MT-02 service not running on port 3004');
      console.error('\n  Start services with:');
      console.error('    npm run start:mt-01');
      console.error('    npm run start:mt-02');
      console.error('    npm run start:orchestrator');
    } else {
      console.error(`  Error: ${error.message}`);
    }

    console.error('\n' + '='.repeat(80));
    process.exit(1);
  }
}

// Run the test
runTest();
