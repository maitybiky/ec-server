import { google } from 'googleapis';
import { env } from '../config/env.js';
import { loggerFor } from '../logger/logger.js';

const log = loggerFor('sheets');
const configured = Boolean(
  env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH && env.GOOGLE_SHEET_ID,
);

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

export async function appendOrderToSheet(order, customerEmail) {
  if (!configured) {
    log.info(
      { orderNumber: order.orderNumber },
      'Google Sheets not configured — skipping row append',
    );
    return;
  }

  const sheets = await getSheetsClient();

  // One line per product inside the cell: name, category, qty × unit price = line total.
  const productDetails = order.items
    .map(
      (i) =>
        `${i.name} [${i.categoryName}] — ${i.quantity} × ₹${i.price} = ₹${i.lineTotal}`,
    )
    .join('\n');
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  const row = [
    order.orderNumber,
    new Date(order.createdAt).toISOString(),
    customerEmail,
    productDetails,
    order.discount.subtotal,
    order.discount.appliedRules.map((r) => `${r.name} ${r.percent}%`).join('; '),
    order.discount.appliedPercent,
    order.discount.discountAmount,
    order.discount.payable,
    order.status,
    itemCount,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: env.GOOGLE_SHEET_ID,
    range: 'A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
  log.info({ orderNumber: order.orderNumber }, 'sheet row appended');
}
