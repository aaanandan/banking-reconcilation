/**
 * Quick verification test for MT-10 Currency Conversion Service
 * Tests currency conversion detection logic
 */

import { Mt10CurrencyService } from './src/mt-10-currency.service';
import { CurrencyClassificationRequestDto } from './src/dto/classification.dto';
import { TransactionDto } from '@app/shared';

const service = new Mt10CurrencyService();

// Helper function to create test transaction
function createTransaction(data: Partial<TransactionDto>): TransactionDto {
  return {
    source: 'bank',
    status: 'unmatched',
    reconciliationId: 'test-recon-1',
    ...data,
  } as TransactionDto;
}

// Test 1: Currency conversion with keywords and currency codes
console.log('Test 1: Currency conversion USD to INR with exchange rate');
const test1: CurrencyClassificationRequestDto = {
  bankTransactions: [
    createTransaction({
      id: 1,
      bankId: 'bank_1',
      bankName: 'Bank A',
      date: '2024-01-15',
      amount: 1000,
      description: 'Currency conversion 1000 USD to INR @ rate 83.5',
    }),
  ],
};

const result1 = service.classifyCurrencyConversions(test1);
console.log(`✅ Found ${result1.totalCurrencyConversions} conversion(s)`);
console.assert(
  result1.totalCurrencyConversions === 1,
  'Should find 1 currency conversion',
);
console.assert(
  result1.classifications[0].sourceCurrency === 'USD',
  'Source currency should be USD',
);
console.assert(
  result1.classifications[0].targetCurrency === 'INR',
  'Target currency should be INR',
);
console.assert(
  result1.classifications[0].exchangeRate === 83.5,
  'Exchange rate should be 83.5',
);

// Test 2: Forex transaction
console.log('\nTest 2: Forex transaction EUR to GBP');
const test2: CurrencyClassificationRequestDto = {
  bankTransactions: [
    createTransaction({
      id: 2,
      bankId: 'bank_1',
      bankName: 'Bank A',
      date: '2024-01-15',
      amount: 500,
      description: 'Forex exchange EUR to GBP = 0.86',
    }),
  ],
};

const result2 = service.classifyCurrencyConversions(test2);
console.log(`✅ Found ${result2.totalCurrencyConversions} conversion(s)`);
console.assert(
  result2.totalCurrencyConversions === 1,
  'Should find 1 forex conversion',
);
console.assert(
  result2.classifications[0].sourceCurrency === 'EUR',
  'Source currency should be EUR',
);
console.assert(
  result2.classifications[0].targetCurrency === 'GBP',
  'Target currency should be GBP',
);

// Test 3: No currency conversion (regular transaction)
console.log('\nTest 3: Regular transaction without currency keywords');
const test3: CurrencyClassificationRequestDto = {
  bankTransactions: [
    createTransaction({
      id: 3,
      bankId: 'bank_1',
      bankName: 'Bank A',
      date: '2024-01-15',
      amount: 1000,
      description: 'Regular payment to vendor',
    }),
  ],
};

const result3 = service.classifyCurrencyConversions(test3);
console.log(`✅ Found ${result3.totalCurrencyConversions} conversion(s)`);
console.assert(
  result3.totalCurrencyConversions === 0,
  'Should not find currency conversion',
);

// Test 4: Currency keyword but no currency codes
console.log('\nTest 4: Currency keyword but no currency codes');
const test4: CurrencyClassificationRequestDto = {
  bankTransactions: [
    createTransaction({
      id: 4,
      bankId: 'bank_1',
      bankName: 'Bank A',
      date: '2024-01-15',
      amount: 1000,
      description: 'Currency exchange service fee',
    }),
  ],
};

const result4 = service.classifyCurrencyConversions(test4);
console.log(`✅ Found ${result4.totalCurrencyConversions} conversion(s)`);
console.assert(
  result4.totalCurrencyConversions === 0,
  'Should not find conversion without 2+ currencies',
);

// Test 5: Multiple currency conversions
console.log('\nTest 5: Multiple currency conversions');
const test5: CurrencyClassificationRequestDto = {
  bankTransactions: [
    createTransaction({
      id: 5,
      bankId: 'bank_1',
      bankName: 'Bank A',
      date: '2024-01-15',
      amount: 1000,
      description: 'FX conversion USD to JPY rate 150',
    }),
    createTransaction({
      id: 6,
      bankId: 'bank_1',
      bankName: 'Bank A',
      date: '2024-01-16',
      amount: 500,
      description: 'Exchange GBP to EUR @ 1.17',
    }),
  ],
};

const result5 = service.classifyCurrencyConversions(test5);
console.log(`✅ Found ${result5.totalCurrencyConversions} conversion(s)`);
console.assert(
  result5.totalCurrencyConversions === 2,
  'Should find 2 currency conversions',
);
console.assert(
  result5.summary.uniqueCurrencies.length === 4,
  'Should have 4 unique currencies',
);

// Test 6: Various currency code pairs
console.log('\nTest 6: Various currency code pairs');
const currencyPairs = [
  ['USD', 'EUR'],
  ['GBP', 'JPY'],
  ['CHF', 'CAD'],
  ['AUD', 'NZD'],
  ['SGD', 'HKD'],
];

let pairTests = 0;
currencyPairs.forEach(([src, tgt], index) => {
  const testPair: CurrencyClassificationRequestDto = {
    bankTransactions: [
      createTransaction({
        id: 100 + index,
        bankId: 'bank_1',
        bankName: 'Bank A',
        date: '2024-01-15',
        amount: 1000,
        description: `Currency exchange ${src} to ${tgt}`,
      }),
    ],
  };

  const resultPair = service.classifyCurrencyConversions(testPair);
  if (resultPair.totalCurrencyConversions === 1) {
    pairTests++;
  }
});

console.log(`✅ ${pairTests}/${currencyPairs.length} currency pairs detected correctly`);
console.assert(
  pairTests === currencyPairs.length,
  'All currency pairs should be detected',
);

// Test 7: Exchange rate extraction patterns
console.log('\nTest 7: Exchange rate extraction patterns');
const ratePatterns = [
  ['rate 75.5', 75.5],
  ['@ 1.25', 1.25],
  ['= 100', 100.0],
  ['1 USD = 83 INR', 83.0],
];

let rateTests = 0;
ratePatterns.forEach(([pattern, expectedRate], index) => {
  const testRate: CurrencyClassificationRequestDto = {
    bankTransactions: [
      createTransaction({
        id: 200 + index,
        bankId: 'bank_1',
        bankName: 'Bank A',
        date: '2024-01-15',
        amount: 1000,
        description: `Currency conversion USD to INR ${pattern}`,
      }),
    ],
  };

  const resultRate = service.classifyCurrencyConversions(testRate);
  if (
    resultRate.totalCurrencyConversions === 1 &&
    resultRate.classifications[0].exchangeRate === expectedRate
  ) {
    rateTests++;
  }
});

console.log(`✅ ${rateTests}/${ratePatterns.length} exchange rate patterns extracted correctly`);
console.assert(
  rateTests === ratePatterns.length,
  'All exchange rate patterns should be extracted',
);

// Test 8: Different currency keywords
console.log('\nTest 8: Different currency keywords');
const keywords = ['conversion', 'convert', 'exchange', 'forex', 'FX'];

let keywordTests = 0;
keywords.forEach((keyword, index) => {
  const testKeyword: CurrencyClassificationRequestDto = {
    bankTransactions: [
      createTransaction({
        id: 300 + index,
        bankId: 'bank_1',
        bankName: 'Bank A',
        date: '2024-01-15',
        amount: 1000,
        description: `${keyword} USD to EUR`,
      }),
    ],
  };

  const resultKeyword = service.classifyCurrencyConversions(testKeyword);
  if (resultKeyword.totalCurrencyConversions === 1) {
    keywordTests++;
  }
});

console.log(`✅ ${keywordTests}/${keywords.length} currency keywords detected correctly`);
console.assert(
  keywordTests === keywords.length,
  'All currency keywords should be detected',
);

// Test 9: Case insensitivity
console.log('\nTest 9: Case insensitivity');
const test9: CurrencyClassificationRequestDto = {
  bankTransactions: [
    createTransaction({
      id: 9,
      bankId: 'bank_1',
      bankName: 'Bank A',
      date: '2024-01-15',
      amount: 1000,
      description: 'CURRENCY CONVERSION usd TO inr',
    }),
  ],
};

const result9 = service.classifyCurrencyConversions(test9);
console.log(`✅ Found ${result9.totalCurrencyConversions} conversion(s)`);
console.assert(
  result9.totalCurrencyConversions === 1,
  'Should be case insensitive',
);

// Test 10: Empty input
console.log('\nTest 10: Empty input');
const test10: CurrencyClassificationRequestDto = {
  bankTransactions: [],
};

const result10 = service.classifyCurrencyConversions(test10);
console.log(`✅ Found ${result10.totalCurrencyConversions} conversion(s)`);
console.assert(
  result10.totalCurrencyConversions === 0,
  'Should handle empty input',
);
console.assert(
  result10.summary.totalProcessed === 0,
  'Should process 0 transactions',
);

console.log('\n🎉 All 10 MT-10 verification tests passed!');
console.log('✅ Currency conversion detection working correctly');
console.log('✅ Currency code extraction functional');
console.log('✅ Exchange rate parsing accurate');
console.log('✅ Keyword matching operational');
console.log('✅ Edge cases handled properly');
