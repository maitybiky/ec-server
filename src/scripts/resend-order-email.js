/**
 * Manually (re)send the confirmation email for an existing order.
 *
 * Usage:
 *   node src/scripts/resend-order-email.js <orderNumber> [--store-url=https://shop.example.com] [--dry-run]
 *
 * The email goes to the order's user. --store-url overrides the base used for
 * the "View my order" link (defaults to CORS_ORIGIN, which is localhost in
 * local .env — pass the live frontend URL when resending for live orders).
 */
const args = process.argv.slice(2);
const orderNumber = args.find((a) => !a.startsWith('--'));
const storeUrl = args.find((a) => a.startsWith('--store-url='))?.split('=')[1];
const dryRun = args.includes('--dry-run');

if (!orderNumber) {
  console.error('Usage: node src/scripts/resend-order-email.js <orderNumber> [--store-url=...] [--dry-run]');
  process.exit(1);
}
if (storeUrl) process.env.CORS_ORIGIN = storeUrl; // read by the email template

const { connectDB, disconnectDB } = await import('../shared/config/db.js');
const { Order } = await import('../models/order.model.js');
await import('../models/user.model.js'); // registers the User model for populate()
const { sendOrderConfirmationEmail } = await import('../shared/notifications/email.js');

await connectDB();
try {
  const order = await Order.findOne({ orderNumber }).populate('user', 'email name');
  if (!order) {
    console.error(`Order ${orderNumber} not found.`);
    process.exit(1);
  }

  const to = order.user?.email;
  if (!to) {
    console.error(`Order ${orderNumber} has no associated user email.`);
    process.exit(1);
  }

  console.log(`Order:  ${order.orderNumber} (${order.status})`);
  console.log(`To:     ${to}`);
  console.log(`Items:  ${order.items.map((i) => `${i.name} x${i.quantity}`).join('; ')}`);
  console.log(`Total:  ${order.discount.payable}`);

  if (dryRun) {
    console.log('Dry run — no email sent.');
  } else {
    await sendOrderConfirmationEmail(order, to);
    console.log('✓ Confirmation email sent.');
  }
} finally {
  await disconnectDB();
}
