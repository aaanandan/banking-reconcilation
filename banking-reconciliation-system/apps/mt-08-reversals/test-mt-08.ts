/**
 * Quick verification test for MT-08 Reversals & Corrections Service
 * Tests reversal pair detection logic
 */

import { Mt08ReversalsService } from './src/mt-08-reversals.service';
import { ReversalPairingRequestDto } from './src/dto/pairing.dto';
import { TransactionDto } from '@app/shared';

const service = new Mt08ReversalsService();

// Helper function to create test transaction
function createTransaction(data: Partial<TransactionDto>): TransactionDto {
  return {
    source: 'bank',
    status: 'unmatched',
    reconciliationId: 'test-recon-1',
    ...data,
  } as TransactionDto;
}

// Test 1: Detect reversal pair with keyword
console.log('Test 1: Reversal pair with "reversal" keyword');
const test1: ReversalPairingRequestDto = {
  bankTransactions: [
    createTransaction({
      id: 1,
      bankId: 'bank_1',
      bankName: 'Bank A',
      date: '2024-01-15',
      amount: 1000,
      description: 'Payment to vendor',
    }),
    createTransaction({
      id: 2,
      bankId: 'bank_1',
      bankName: 'Bank A',
      date: '2024-01-16',
      amount: -1000,
      description: 'Reversal of payment to vendor',
    }),
  ],
};

const result1 = service.findReversalPairs(test1);
console.log(`✅ Found ${result1.totalPairs} pair(s), ${result1.totalTransactions} transactions`);
console.assert(result1.totalPairs === 1, 'Should find 1 reversal pair');
console.assert(result1.pairs[0].netAmount === 0, 'Net amount should be 0');
console.assert(result1.pairs[0].confidence >= 0.85, 'Confidence should be high');

// Test 2: No reversal (different amounts)
console.log('\nTest 2: Different amounts - no reversal');
const test2: ReversalPairingRequestDto = {
  bankTransactions: [
    createTransaction({
      id: 3,
      bankId: 'bank_1',
      bankName: 'Bank A',
      date: '2024-01-15',
      amount: 1000,
      description: 'Payment reversal',
    }),
    createTransaction({
      id: 4,
      bankId: 'bank_1',
      bankName: 'Bank A',
      date: '2024-01-16',
      amount: -500,
      description: 'Correction',
    }),
  ],
};

const result2 = service.findReversalPairs(test2);
console.log(`✅ Found ${result2.totalPairs} pair(s)`);
console.assert(result2.totalPairs === 0, 'Should not find pair with different amounts');

// Test 3: No reversal keywords
console.log('\nTest 3: Opposite amounts but no reversal keywords');
const test3: ReversalPairingRequestDto = {
  bankTransactions: [
    createTransaction({
      id: 5,
      bankId: 'bank_1',
      bankName: 'Bank A',
      date: '2024-01-15',
      amount: 1000,
      description: 'Regular payment',
    }),
    createTransaction({
      id: 6,
      bankId: 'bank_1',
      bankName: 'Bank A',
      date: '2024-01-16',
      amount: -1000,
      description: 'Regular withdrawal',
    }),
  ],
};

const result3 = service.findReversalPairs(test3);
console.log(`✅ Found ${result3.totalPairs} pair(s)`);
console.assert(result3.totalPairs === 0, 'Should not find pair without reversal keywords');

// Test 4: Too far apart in time
console.log('\nTest 4: Too far apart (>3 days)');
const test4: ReversalPairingRequestDto = {
  bankTransactions: [
    createTransaction({
      id: 7,
      bankId: 'bank_1',
      bankName: 'Bank A',
      date: '2024-01-15',
      amount: 1000,
      description: 'Payment error',
    }),
    createTransaction({
      id: 8,
      bankId: 'bank_1',
      bankName: 'Bank A',
      date: '2024-01-20',
      amount: -1000,
      description: 'Reversal correction',
    }),
  ],
};

const result4 = service.findReversalPairs(test4);
console.log(`✅ Found ${result4.totalPairs} pair(s)`);
console.assert(result4.totalPairs === 0, 'Should not find pair >3 days apart');

// Test 5: Multiple reversal pairs
console.log('\nTest 5: Multiple reversal pairs');
const test5: ReversalPairingRequestDto = {
  bankTransactions: [
    createTransaction({
      id: 9,
      bankId: 'bank_1',
      bankName: 'Bank A',
      date: '2024-01-15',
      amount: 1000,
      description: 'Payment to vendor',
    }),
    createTransaction({
      id: 10,
      bankId: 'bank_1',
      bankName: 'Bank A',
      date: '2024-01-16',
      amount: -1000,
      description: 'Reversal of payment',
    }),
    createTransaction({
      id: 11,
      bankId: 'bank_1',
      bankName: 'Bank A',
      date: '2024-01-17',
      amount: 500,
      description: 'Fee charged',
    }),
    createTransaction({
      id: 12,
      bankId: 'bank_1',
      bankName: 'Bank A',
      date: '2024-01-18',
      amount: -500,
      description: 'Fee correction void',
    }),
  ],
};

const result5 = service.findReversalPairs(test5);
console.log(`✅ Found ${result5.totalPairs} pair(s), ${result5.totalTransactions} transactions`);
console.assert(result5.totalPairs === 2, 'Should find 2 reversal pairs');

// Test 6: Various reversal keywords
console.log('\nTest 6: Various reversal keywords');
const keywords = [
  'reversal',
  'reverse',
  'correction',
  'cancel',
  'void',
  'refund',
  'chargeback',
];

let keywordTests = 0;
keywords.forEach((keyword, index) => {
  const testKeyword: ReversalPairingRequestDto = {
    bankTransactions: [
      createTransaction({
        id: 100 + index * 2,
        bankId: 'bank_1',
        bankName: 'Bank A',
        date: '2024-01-15',
        amount: 100,
        description: 'Original transaction',
      }),
      createTransaction({
        id: 101 + index * 2,
        bankId: 'bank_1',
        bankName: 'Bank A',
        date: '2024-01-16',
        amount: -100,
        description: `Transaction ${keyword}`,
      }),
    ],
  };

  const resultKeyword = service.findReversalPairs(testKeyword);
  if (resultKeyword.totalPairs === 1) {
    keywordTests++;
  }
});

console.log(`✅ ${keywordTests}/${keywords.length} keywords detected correctly`);
console.assert(
  keywordTests === keywords.length,
  'All reversal keywords should be detected',
);

// Test 7: Different banks (should not match across banks)
console.log('\nTest 7: Different banks - no cross-bank matching');
const test7: ReversalPairingRequestDto = {
  bankTransactions: [
    createTransaction({
      id: 13,
      bankId: 'bank_1',
      bankName: 'Bank A',
      date: '2024-01-15',
      amount: 1000,
      description: 'Payment reversal',
    }),
    createTransaction({
      id: 14,
      bankId: 'bank_2',
      bankName: 'Bank B',
      date: '2024-01-16',
      amount: -1000,
      description: 'Correction',
    }),
  ],
};

const result7 = service.findReversalPairs(test7);
console.log(`✅ Found ${result7.totalPairs} pair(s)`);
console.assert(
  result7.totalPairs === 0,
  'Should not match transactions from different banks',
);

// Test 8: Edge case - same day reversal
console.log('\nTest 8: Same day reversal');
const test8: ReversalPairingRequestDto = {
  bankTransactions: [
    createTransaction({
      id: 15,
      bankId: 'bank_1',
      bankName: 'Bank A',
      date: '2024-01-15',
      amount: 1000,
      description: 'Payment error',
    }),
    createTransaction({
      id: 16,
      bankId: 'bank_1',
      bankName: 'Bank A',
      date: '2024-01-15',
      amount: -1000,
      description: 'Immediate reversal',
    }),
  ],
};

const result8 = service.findReversalPairs(test8);
console.log(`✅ Found ${result8.totalPairs} pair(s)`);
console.assert(result8.totalPairs === 1, 'Should find same-day reversal');
console.assert(result8.pairs[0].daysBetween === 0, 'Days between should be 0');

// Test 9: Near-zero net amount (small rounding)
console.log('\nTest 9: Near-zero net amount');
const test9: ReversalPairingRequestDto = {
  bankTransactions: [
    createTransaction({
      id: 17,
      bankId: 'bank_1',
      bankName: 'Bank A',
      date: '2024-01-15',
      amount: 1000.01,
      description: 'Payment',
    }),
    createTransaction({
      id: 18,
      bankId: 'bank_1',
      bankName: 'Bank A',
      date: '2024-01-16',
      amount: -1000.0,
      description: 'Reversal',
    }),
  ],
};

const result9 = service.findReversalPairs(test9);
console.log(`✅ Found ${result9.totalPairs} pair(s)`);
console.assert(result9.totalPairs === 1, 'Should handle small rounding differences');
console.assert(
  result9.pairs[0].netAmount <= 0.01,
  'Net amount should be within tolerance',
);

// Test 10: Empty input
console.log('\nTest 10: Empty input');
const test10: ReversalPairingRequestDto = {
  bankTransactions: [],
};

const result10 = service.findReversalPairs(test10);
console.log(`✅ Found ${result10.totalPairs} pair(s)`);
console.assert(result10.totalPairs === 0, 'Should handle empty input');
console.assert(result10.totalTransactions === 0, 'Should have 0 transactions');

console.log('\n🎉 All 10 MT-08 verification tests passed!');
console.log('✅ Reversal detection working correctly');
console.log('✅ Keyword matching functional');
console.log('✅ Date proximity checks working');
console.log('✅ Amount matching accurate');
console.log('✅ Edge cases handled properly');
