import { Cart } from '../../models/cart.model.js';

const POPULATE = {
  path: 'items.product',
  select: 'name price images stock status category',
  populate: { path: 'category', select: 'name slug isActive' },
};

export const cartRepository = {
  async findOrCreateByUser(userId) {
    let cart = await Cart.findOne({ user: userId }).populate(POPULATE);
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
      cart = await cart.populate(POPULATE);
    }
    return cart;
  },

  async save(cart) {
    await cart.save();
    return cart.populate(POPULATE);
  },

  /**
   * Atomically empty the cart, but only if it still has items.
   * Returns null when another request already consumed it — makes the cart
   * a consume-once token so concurrent checkouts can't create two orders.
   */
  consumeByUser(userId, { session } = {}) {
    return Cart.findOneAndUpdate(
      { user: userId, 'items.0': { $exists: true } },
      { items: [] },
      { session },
    );
  },
};
