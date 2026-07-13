import { randomUUID } from 'node:crypto';
import { PaymentProvider } from './PaymentProvider.js';

/** v1 placeholder — always succeeds immediately. */
export class MockPaymentProvider extends PaymentProvider {
  async charge() {
    return {
      status: 'paid',
      transactionId: `mock_${randomUUID()}`,
      paidAt: new Date(),
    };
  }

  get name() {
    return 'mock';
  }
}
