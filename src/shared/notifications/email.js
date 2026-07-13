import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { loggerFor } from '../logger/logger.js';

const log = loggerFor('email');
const configured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

const transporter = configured
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: (env.SMTP_PORT ?? 587) === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    })
  : null;

const money = (n) =>
  `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Modern, email-client-safe template: table layout, inline styles,
 * 600px card, brand header, clean rows, discount breakdown, address.
 */
function orderEmailHtml(order) {
  const D = order.discount;
  const a = order.shippingAddress;
  const date = new Date(order.createdAt ?? Date.now()).toLocaleDateString(
    'en-IN',
    { day: 'numeric', month: 'long', year: 'numeric' },
  );

  const itemRows = order.items
    .map(
      (i, idx) => `
      <tr>
        <td style="padding:14px 0;border-top:${idx === 0 ? 'none' : '1px solid #ececec'};">
          <p style="margin:0;font-size:14px;font-weight:600;color:#17171a;">${i.name}</p>
          <p style="margin:2px 0 0;font-size:12px;color:#8a8d93;">${i.categoryName} · Qty ${i.quantity} × ${money(i.price)}</p>
        </td>
        <td align="right" style="padding:14px 0;border-top:${idx === 0 ? 'none' : '1px solid #ececec'};font-size:14px;font-weight:600;color:#17171a;white-space:nowrap;">
          ${money(i.lineTotal)}
        </td>
      </tr>`,
    )
    .join('');

  const discountRows = D.appliedRules
    .map(
      (r) => `
      <tr>
        <td style="padding:4px 0;font-size:13px;color:#4d7c0f;">↓ ${r.name}</td>
        <td align="right" style="padding:4px 0;font-size:13px;color:#4d7c0f;white-space:nowrap;">−${r.percent}%</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#f0f2ee;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2ee;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background-color:#17171a;border-radius:20px 20px 0 0;padding:28px 32px;">
          <table role="presentation" width="100%"><tr>
            <td style="font-size:20px;font-weight:800;color:#ffffff;">
              <span style="display:inline-block;background-color:#bef264;color:#202e08;border-radius:50%;width:28px;height:28px;text-align:center;line-height:28px;font-size:15px;">e</span>
              &nbsp;ecom.
            </td>
            <td align="right" style="font-size:12px;color:#9a9da3;">${date}</td>
          </tr></table>
        </td></tr>

        <!-- Confirmation banner -->
        <tr><td style="background-color:#bef264;padding:24px 32px;">
          <p style="margin:0;font-size:13px;font-weight:600;color:#3f6212;letter-spacing:0.4px;text-transform:uppercase;">Order confirmed ✓</p>
          <p style="margin:6px 0 0;font-size:24px;font-weight:800;color:#1a2e05;">Thanks, ${a?.fullName?.split(' ')[0] ?? 'there'}! Your order is in.</p>
          <p style="margin:6px 0 0;font-size:13px;color:#3f6212;">Order <strong>${order.orderNumber}</strong></p>
        </td></tr>

        <!-- Items -->
        <tr><td style="background-color:#ffffff;padding:24px 32px 8px;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#8a8d93;text-transform:uppercase;letter-spacing:0.4px;">Your items</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
        </td></tr>

        <!-- Totals -->
        <tr><td style="background-color:#ffffff;padding:8px 32px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #17171a;padding-top:8px;">
            <tr>
              <td style="padding:12px 0 4px;font-size:13px;color:#8a8d93;">Subtotal</td>
              <td align="right" style="padding:12px 0 4px;font-size:13px;color:#17171a;">${money(D.subtotal)}</td>
            </tr>
            ${discountRows}
            ${
              D.discountAmount > 0
                ? `<tr>
                    <td style="padding:4px 0;font-size:13px;font-weight:600;color:#4d7c0f;">You saved (${D.appliedPercent}% off)</td>
                    <td align="right" style="padding:4px 0;font-size:13px;font-weight:600;color:#4d7c0f;white-space:nowrap;">−${money(D.discountAmount)}</td>
                  </tr>`
                : ''
            }
            <tr>
              <td style="padding:12px 0 0;font-size:16px;font-weight:800;color:#17171a;">Total paid</td>
              <td align="right" style="padding:12px 0 0;font-size:20px;font-weight:800;color:#17171a;white-space:nowrap;">${money(D.payable)}</td>
            </tr>
          </table>
        </td></tr>

        <!-- Address -->
        ${
          a
            ? `<tr><td style="background-color:#fafbf8;border-top:1px solid #ececec;padding:20px 32px;">
                <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#8a8d93;text-transform:uppercase;letter-spacing:0.4px;">Delivering to</p>
                <p style="margin:0;font-size:14px;font-weight:600;color:#17171a;">${a.fullName} · ${a.phone}</p>
                <p style="margin:4px 0 0;font-size:13px;color:#6e7076;line-height:1.5;">${a.line1}, ${a.city}, ${a.state} ${a.postalCode}</p>
              </td></tr>`
            : ''
        }

        <!-- Footer -->
        <tr><td style="background-color:#ffffff;border-radius:0 0 20px 20px;border-top:1px solid #ececec;padding:20px 32px;">
          <p style="margin:0;font-size:12px;color:#8a8d93;line-height:1.6;">
            You're receiving this because you placed an order at ecom.<br/>
            Questions? Just reply to this email — we're happy to help.
          </p>
        </td></tr>

      </table>
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

  await transporter.sendMail({
    from: env.SMTP_FROM ?? env.SMTP_USER,
    to: customerEmail,
    subject: `Order confirmed — ${order.orderNumber}`,
    html: orderEmailHtml(order),
  });
  log.info({ orderNumber: order.orderNumber }, 'confirmation email sent');
}
