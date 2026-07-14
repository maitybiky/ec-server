import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { loggerFor } from '../logger/logger.js';

const log = loggerFor('email');
const configured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

// Some hosts (Render included) often time out on port 587 (STARTTLS) while
// 465 (implicit TLS) connects fine. Timeouts are kept short so a bad port
// fails fast and the 465 fallback / fireAndForget retries actually run —
// nodemailer's defaults would hang each attempt for 2 minutes.
function makeTransport(port) {
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

const CONNECTION_ERRORS = new Set([
  'ETIMEDOUT',
  'ESOCKET',
  'ECONNECTION',
  'ECONNREFUSED',
  'ECONNRESET',
  'EDNS',
]);

let transporter = configured
  ? makeTransport(Number(env.SMTP_PORT ?? 587))
  : null;

async function deliver(message) {
  try {
    return await transporter.sendMail(message);
  } catch (err) {
    const isConnIssue =
      CONNECTION_ERRORS.has(err.code) || /timeout/i.test(err.message ?? '');
    if (!isConnIssue || transporter.options.port === 465) throw err;
    log.warn(
      { failedPort: transporter.options.port, err: err.message },
      'SMTP connection failed — falling back to port 465 (implicit TLS)',
    );
    transporter = makeTransport(465); // keep using 465 for future sends
    return transporter.sendMail(message);
  }
}

const money = (n) =>
  `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Modern, email-client-safe template: table layout, inline styles,
 * 600px fluid card, brand header, hero banner, item list with monogram
 * avatars, savings callout, delivery + payment summary, CTA button.
 */
export function orderEmailHtml(order) {
  const D = order.discount;
  const a = order.shippingAddress;
  const p = order.payment;
  const storeUrl = (env.CORS_ORIGIN ?? '').split(',')[0].trim();
  const orderUrl = storeUrl ? `${storeUrl}/orders/${order._id ?? order.id}` : null;
  const firstName = a?.fullName?.split(' ')[0] ?? 'there';
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
  const date = new Date(order.createdAt ?? Date.now()).toLocaleDateString(
    'en-IN',
    { day: 'numeric', month: 'long', year: 'numeric' },
  );
  const paidDate = p?.paidAt
    ? new Date(p.paidAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : date;

  const preheader = `Order ${order.orderNumber} confirmed — ${itemCount} item${
    itemCount !== 1 ? 's' : ''
  }, total ${money(D.payable)}. Thanks for shopping with us!`;

  const itemRows = order.items
    .map(
      (i, idx) => `
      <tr>
        <td width="48" valign="middle" style="padding:14px 0;border-top:${idx === 0 ? 'none' : '1px solid #ececec'};">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td width="40" height="40" align="center" valign="middle"
                style="background-color:#f0f5e4;border-radius:12px;font-size:16px;font-weight:800;color:#3f6212;">
              ${esc(i.name.charAt(0).toUpperCase())}
            </td>
          </tr></table>
        </td>
        <td valign="middle" style="padding:14px 12px;border-top:${idx === 0 ? 'none' : '1px solid #ececec'};">
          <p style="margin:0;font-size:14px;font-weight:600;color:#17171a;line-height:1.4;">${esc(i.name)}</p>
          <p style="margin:3px 0 0;font-size:12px;color:#8a8d93;">${esc(i.categoryName)} &nbsp;·&nbsp; ${i.quantity} × ${money(i.price)}</p>
        </td>
        <td align="right" valign="middle" style="padding:14px 0;border-top:${idx === 0 ? 'none' : '1px solid #ececec'};font-size:14px;font-weight:700;color:#17171a;white-space:nowrap;">
          ${money(i.lineTotal)}
        </td>
      </tr>`,
    )
    .join('');

  const discountRows = D.appliedRules
    .map(
      (r) => `
      <tr>
        <td colspan="2" style="padding:3px 0;font-size:13px;color:#4d7c0f;">${esc(r.name)}</td>
        <td align="right" style="padding:3px 0;font-size:13px;font-weight:600;color:#4d7c0f;white-space:nowrap;">−${r.percent}%</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background-color:#eef0ea;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <!-- Preheader: shows in inbox preview, hidden in the body -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${esc(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef0ea;">
    <tr><td align="center" style="padding:32px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Brand header -->
        <tr><td style="background-color:#17171a;border-radius:20px 20px 0 0;padding:22px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="font-size:19px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">
              <span style="display:inline-block;background-color:#bef264;color:#202e08;border-radius:50%;width:28px;height:28px;text-align:center;line-height:28px;font-size:15px;vertical-align:middle;">e</span>
              <span style="vertical-align:middle;">&nbsp;ecom.</span>
            </td>
            <td align="right" style="font-size:12px;color:#9a9da3;">${date}</td>
          </tr></table>
        </td></tr>

        <!-- Hero -->
        <tr><td style="background-color:#bef264;padding:30px 32px 26px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td width="46" height="46" align="center" valign="middle" style="background-color:#17171a;border-radius:50%;font-size:20px;color:#bef264;font-weight:800;">✓</td>
            <td style="padding-left:14px;">
              <p style="margin:0;font-size:12px;font-weight:700;color:#3f6212;letter-spacing:1px;text-transform:uppercase;">Order confirmed</p>
              <p style="margin:3px 0 0;font-size:23px;font-weight:800;color:#1a2e05;letter-spacing:-0.3px;">Thanks, ${esc(firstName)}!</p>
            </td>
          </tr></table>
          <p style="margin:16px 0 0;font-size:13px;color:#365314;line-height:1.5;">
            Your order is in and being prepared. We'll keep you posted.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:14px;"><tr>
            <td style="background-color:rgba(23,23,26,0.08);border:1px solid rgba(23,23,26,0.18);border-radius:999px;padding:6px 14px;font-size:12px;font-weight:700;color:#1a2e05;">
              ${esc(order.orderNumber)}
            </td>
            <td width="8"></td>
            <td style="background-color:#17171a;border-radius:999px;padding:6px 14px;font-size:12px;font-weight:700;color:#bef264;text-transform:uppercase;letter-spacing:0.5px;">
              ${esc(p?.status === 'paid' ? 'Paid' : order.status)}
            </td>
          </tr></table>
        </td></tr>

        <!-- Items -->
        <tr><td style="background-color:#ffffff;padding:26px 32px 10px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#8a8d93;text-transform:uppercase;letter-spacing:0.8px;">Your items (${itemCount})</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
        </td></tr>

        <!-- Totals -->
        <tr><td style="background-color:#ffffff;padding:8px 32px 26px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #17171a;">
            <tr>
              <td colspan="2" style="padding:14px 0 3px;font-size:13px;color:#8a8d93;">Subtotal</td>
              <td align="right" style="padding:14px 0 3px;font-size:13px;color:#17171a;white-space:nowrap;">${money(D.subtotal)}</td>
            </tr>
            ${discountRows}
          </table>
          ${
            D.discountAmount > 0
              ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
                  <tr><td style="background-color:#f2fbe4;border-radius:12px;padding:10px 14px;font-size:13px;font-weight:700;color:#3f6212;">
                    🎉 You saved ${money(D.discountAmount)}${D.capPercent !== null && D.totalPercent > D.capPercent ? ` (capped at ${D.capPercent}%)` : ` (${D.appliedPercent}% off)`}
                  </td></tr>
                </table>`
              : ''
          }
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
            <tr>
              <td style="font-size:15px;font-weight:800;color:#17171a;">Total paid</td>
              <td align="right" style="font-size:22px;font-weight:800;color:#17171a;white-space:nowrap;letter-spacing:-0.3px;">${money(D.payable)}</td>
            </tr>
          </table>
          ${
            orderUrl
              ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                  <tr><td align="center">
                    <a href="${esc(orderUrl)}" target="_blank"
                       style="display:inline-block;background-color:#17171a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 36px;border-radius:999px;">
                      View my order&nbsp;&nbsp;→
                    </a>
                  </td></tr>
                </table>`
              : ''
          }
        </td></tr>

        <!-- Delivery + payment -->
        <tr><td style="background-color:#fafbf8;border-top:1px solid #ececec;padding:22px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td width="55%" valign="top" style="padding-right:12px;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#8a8d93;text-transform:uppercase;letter-spacing:0.8px;">Delivering to</p>
              <p style="margin:0;font-size:14px;font-weight:600;color:#17171a;">${esc(a?.fullName ?? '')}</p>
              <p style="margin:4px 0 0;font-size:13px;color:#6e7076;line-height:1.5;">
                ${esc(a?.line1 ?? '')},<br/>${esc(a?.city ?? '')}, ${esc(a?.state ?? '')} ${esc(a?.postalCode ?? '')}<br/>${esc(a?.phone ?? '')}
              </p>
            </td>
            <td width="45%" valign="top" style="padding-left:12px;border-left:1px solid #ececec;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#8a8d93;text-transform:uppercase;letter-spacing:0.8px;">Payment</p>
              <p style="margin:0;font-size:14px;font-weight:600;color:#17171a;">${esc(p?.provider ?? '—')}</p>
              <p style="margin:4px 0 0;font-size:13px;color:#6e7076;line-height:1.5;">
                ${p?.status === 'paid' ? `Paid on ${paidDate}` : esc(p?.status ?? '')}${p?.transactionId ? `<br/>Txn ${esc(p.transactionId)}` : ''}
              </p>
            </td>
          </tr></table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background-color:#ffffff;border-radius:0 0 20px 20px;border-top:1px solid #ececec;padding:20px 32px;">
          <p style="margin:0;font-size:12px;color:#8a8d93;line-height:1.7;">
            You're receiving this because you placed an order at <strong style="color:#17171a;">ecom.</strong><br/>
            Questions? Just reply to this email — we're happy to help.
          </p>
        </td></tr>

      </table>

      <p style="margin:16px 0 0;font-size:11px;color:#a4a7ad;">© ${new Date().getFullYear()} ecom store</p>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendOrderConfirmationEmail(order, customerEmail) {
  if (!configured) {
    log.info(
      { orderNumber: order.orderNumber },
      'SMTP not configured — skipping confirmation email',
    );
    return;
  }

  await deliver({
    from: env.SMTP_FROM ?? env.SMTP_USER,
    to: customerEmail,
    subject: `Order confirmed — ${order.orderNumber}`,
    html: orderEmailHtml(order),
  });
  log.info({ orderNumber: order.orderNumber }, 'confirmation email sent');
}
