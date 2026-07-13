import crypto from 'node:crypto';
import { orderRepository } from './order.repository.js';
import { cartRepository } from '../cart/cart.repository.js';
import { addressRepository } from '../address/address.repository.js';
import { discountService } from '../discount/discount.service.js';
import { ApiError } from '../../shared/utils/ApiError.js';
import { paymentProvider } from '../../shared/payments/index.js';
import { sendOrderConfirmationEmail } from '../../shared/notifications/email.js';
import { appendOrderToSheet } from '../../shared/notifications/sheets.js';
import { fireAndForget } from '../../shared/notifications/withRetry.js';
import { loggerFor } from '../../shared/logger/logger.js';

const log = loggerFor('order');
const round2 = (n) => Math.round(n * 100) / 100;

const newOrderNumber = () =>
  `ORD-${Date.now().toString(36).toUpperCase()}-${crypto
    .randomBytes(3)
    .toString('hex')
    .toUpperCase()}`;

export const orderService = {
  /**
   * Place an order from the user's server-side cart.
   * Stock is decremented atomically inside a transaction; the discount
   * breakdown is snapshotted onto the order document.
   */
  async placeOrder(userId, userEmail, { shippingAddress }) {
    const cart = await cartRepository.findOrCreateByUser(userId);
    const activeItems = cart.items.filter(
      (i) => i.product && i.product.status === 'active',
    );
    if (activeItems.length === 0) {
      throw ApiError.badRequest('Cart is empty');
    }

    const discount = await discountService.calculate(
      activeItems.map((i) => ({
        price: i.product.price,
        quantity: i.quantity,
        categoryId: i.product.category?._id ?? i.product.category,
      })),
    );

    const session = await orderRepository.startSession();
    let order;
    try {
      await session.withTransaction(async () => {
        // Consume the cart first — it acts as a once-only token, so a
        // double-submit (double click, retry, second tab) can't create
        // two orders: the loser aborts here and everything rolls back.
        const consumed = await cartRepository.consumeByUser(userId, {
          session,
        });
        if (!consumed) {
          throw ApiError.conflict(
            'This cart has already been checked out — refresh to see your order',
          );
        }

        for (const item of activeItems) {
          const updated = await orderRepository.decrementStock(
            item.product._id,
            item.quantity,
            { session },
          );
          if (!updated) {
            throw ApiError.conflict(
              `Insufficient stock for "${item.product.name}"`,
            );
          }
        }

        const payment = await paymentProvider.charge({
          amount: discount.payable,
          currency: 'INR',
          reference: userId,
        });
        if (payment.status !== 'paid') {
          throw ApiError.badRequest('Payment failed');
        }

        order = await orderRepository.create(
          {
            orderNumber: newOrderNumber(),
            user: userId,
            items: activeItems.map((i) => ({
              product: i.product._id,
              name: i.product.name,
              price: i.product.price,
              quantity: i.quantity,
              categoryName: i.product.category?.name ?? 'Unknown',
              lineTotal: round2(i.product.price * i.quantity),
            })),
            discount,
            status: 'placed',
            payment: {
              provider: paymentProvider.name,
              status: payment.status,
              transactionId: payment.transactionId,
              paidAt: payment.paidAt,
            },
            shippingAddress,
          },
          { session },
        );
      });
    } finally {
      await session.endSession();
    }

    log.info(
      {
        orderNumber: order.orderNumber,
        userId,
        items: order.items.length,
        subtotal: order.discount.subtotal,
        discountPercent: order.discount.appliedPercent,
        payable: order.discount.payable,
      },
      'order placed',
    );

    // Remember this address for one-click reuse on the next checkout.
    fireAndForget(
      `save-address:${order.orderNumber}`,
      () => addressRepository.upsertForUser(userId, shippingAddress),
      { payload: { userId, shippingAddress } },
    );

    // Side effects must never block or fail the checkout response.
    // Payload is logged on permanent failure so the job can be replayed.
    const jobPayload = { orderNumber: order.orderNumber, userEmail };
    fireAndForget(
      `email:${order.orderNumber}`,
      () => sendOrderConfirmationEmail(order, userEmail),
      { payload: jobPayload },
    );
    fireAndForget(
      `sheets:${order.orderNumber}`,
      () => appendOrderToSheet(order, userEmail),
      { payload: jobPayload },
    );

    return order;
  },

  async getMyOrders(userId, { page = 1, limit = 10 }) {
    const { items, total } = await orderRepository.findByUser(userId, {
      page,
      limit,
    });
    return {
      orders: items,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  },

  async getMyOrderById(userId, orderId) {
    const order = await orderRepository.findById(orderId);
    if (!order || String(order.user) !== userId) {
      throw ApiError.notFound('Order not found');
    }
    return order;
  },

  async adminList({ status, page = 1, limit = 20 }) {
    const { items, total } = await orderRepository.findAll({
      status,
      page,
      limit,
    });
    return {
      orders: items,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  },

  async updateStatus(orderId, status) {
    const existing = await orderRepository.findById(orderId);
    if (!existing) throw ApiError.notFound('Order not found');
    if (existing.status === status) return existing; // idempotent no-op

    // Guarded transition + stock restore are one atomic unit, so two
    // concurrent cancels can't both pass the check and double-restore stock.
    const session = await orderRepository.startSession();
    let updated;
    try {
      await session.withTransaction(async () => {
        updated = await orderRepository.transitionFromPlaced(orderId, status, {
          session,
        });
        if (!updated) {
          const fresh = await orderRepository.findById(orderId);
          throw ApiError.badRequest(
            `Cannot change status of a ${fresh?.status ?? 'deleted'} order`,
          );
        }

        // Cancelling releases the reserved stock.
        if (status === 'cancelled') {
          for (const item of updated.items) {
            // eslint-disable-next-line no-await-in-loop
            await orderRepository.restoreStock(item.product, item.quantity, {
              session,
            });
          }
        }
      });
    } finally {
      await session.endSession();
    }

    log.info(
      { orderNumber: updated.orderNumber, from: 'placed', to: status },
      'order status changed',
    );
    return updated;
  },

  async exportCsv({ status } = {}) {
    const orders = await orderRepository.findAllForExport({ status });

    const esc = (v) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
    };

    const header = [
      'Order Number', 'Date', 'Customer Name', 'Customer Email', 'Items',
      'Subtotal', 'Discounts Applied', 'Discount %', 'Discount Amount',
      'Payable', 'Status',
    ];

    const rows = orders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toISOString(),
      o.user?.name ?? '',
      o.user?.email ?? '',
      o.items.map((i) => `${i.name} x${i.quantity}`).join('; '),
      o.discount.subtotal,
      o.discount.appliedRules.map((r) => `${r.name} ${r.percent}%`).join('; '),
      o.discount.appliedPercent,
      o.discount.discountAmount,
      o.discount.payable,
      o.status,
    ]);

    return [header, ...rows].map((r) => r.map(esc).join(',')).join('\n');
  },
};
