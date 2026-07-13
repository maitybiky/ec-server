/**
 * Abstract payment provider — swap in Razorpay/Stripe later without
 * changing the order flow.
 */
export class PaymentProvider {
  /**
   * Charge for an order.
   * @param {{ amount: number, currency: string, reference: string }} params
   * @returns {Promise<{ status: 'paid'|'failed', transactionId: string, paidAt: Date }>}
   */
  // eslint-disable-next-line no-unused-vars
  async charge(params) {
    throw new Error('PaymentProvider.charge not implemented');
  }

  get name() {
    throw new Error('PaymentProvider.name not implemented');
  }
}
