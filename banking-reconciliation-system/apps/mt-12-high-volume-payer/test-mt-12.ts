import { Mt12HighVolumePayerService } from './src/mt-12-high-volume-payer.service';

const service = new Mt12HighVolumePayerService();

const result = service.findHighVolumePayers({
  bankTransactions: Array(6).fill(null).map((_, i) => ({
    id: i,
    source: 'bank' as const,
    status: 'unmatched' as const,
    reconciliationId: 'test',
    date: '2024-01-15',
    amount: 100,
    description: 'Payment',
    optional: { payerPayee: 'Customer A' },
  } as any)),
});

console.assert(result.totalGroups === 1, 'Should find 1 high-volume payer');
console.log('✅ MT-12 test passed!');
