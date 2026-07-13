import { MockPaymentProvider } from './MockPaymentProvider.js';

// Single place that decides the active payment provider.
// To go live: implement RazorpayProvider/StripeProvider, change this line.
export const paymentProvider = new MockPaymentProvider();

export { PaymentProvider } from './PaymentProvider.js';
