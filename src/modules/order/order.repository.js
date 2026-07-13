import mongoose from 'mongoose';
import { Order } from '../../models/order.model.js';
import { Product } from '../../models/product.model.js';

export const orderRepository = {
  startSession() {
    return mongoose.startSession();
  },

  /**
   * Atomically decrement stock — only succeeds when enough stock remains.
   * Returns null if the guard fails (insufficient stock / product gone).
   */
  decrementStock(productId, quantity, { session } = {}) {
    return Product.findOneAndUpdate(
      { _id: productId, status: 'active', stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { new: true, session },
    );
  },

  restoreStock(productId, quantity, { session } = {}) {
    return Product.findByIdAndUpdate(
      productId,
      { $inc: { stock: quantity } },
      { session },
    );
  },

  create(data, { session } = {}) {
    return Order.create([data], { session }).then(([order]) => order);
  },

  findById(id) {
    return Order.findById(id);
  },

  findByUser(userId, { page, limit }) {
    return Promise.all([
      Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments({ user: userId }),
    ]).then(([items, total]) => ({ items, total }));
  },

  findAll({ status, page, limit }) {
    const filter = status ? { status } : {};
    return Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', 'name email'),
      Order.countDocuments(filter),
    ]).then(([items, total]) => ({ items, total }));
  },

  findAllForExport({ status } = {}) {
    const filter = status ? { status } : {};
    return Order.find(filter)
      .sort({ createdAt: -1 })
      .populate('user', 'name email');
  },

  /**
   * Atomic guarded transition: only succeeds if the order is still 'placed'.
   * Returns null when another request already moved it — prevents e.g.
   * two concurrent cancels from restoring stock twice.
   */
  transitionFromPlaced(id, status, { session } = {}) {
    return Order.findOneAndUpdate(
      { _id: id, status: 'placed' },
      { status },
      { new: true, session },
    );
  },
};
