import { cartRepository } from './cart.repository.js';
import { productRepository } from '../product/product.repository.js';
import { discountService } from '../discount/discount.service.js';
import { ApiError } from '../../shared/utils/ApiError.js';

/**
 * Builds the cart view returned by every cart endpoint:
 * items + subtotal + full discount breakdown + payable.
 */
async function buildCartView(cart) {
  // Drop items whose product was deleted or deactivated since being added.
  const validItems = cart.items.filter(
    (i) => i.product && i.product.status === 'active',
  );
  if (validItems.length !== cart.items.length) {
    cart.items = validItems.map((i) => ({
      product: i.product._id,
      quantity: i.quantity,
    }));
    cart = await cartRepository.save(cart);
  }

  const discountInput = cart.items.map((i) => ({
    price: i.product.price,
    quantity: i.quantity,
    categoryId: i.product.category?._id ?? i.product.category,
  }));

  const discount = await discountService.calculate(discountInput);

  return {
    items: cart.items.map((i) => ({
      product: {
        id: i.product.id,
        name: i.product.name,
        price: i.product.price,
        images: i.product.images,
        stock: i.product.stock,
        category: i.product.category,
      },
      quantity: i.quantity,
      lineTotal: Math.round(i.product.price * i.quantity * 100) / 100,
    })),
    ...discount,
  };
}

export const cartService = {
  async getCart(userId) {
    const cart = await cartRepository.findOrCreateByUser(userId);
    return buildCartView(cart);
  },

  async addItem(userId, { productId, quantity }) {
    const product = await productRepository.findById(productId);
    if (!product || product.status !== 'active') {
      throw ApiError.notFound('Product not available');
    }

    const cart = await cartRepository.findOrCreateByUser(userId);
    const existing = cart.items.find(
      (i) => String(i.product._id ?? i.product) === productId,
    );
    const newQty = (existing?.quantity ?? 0) + quantity;

    if (newQty > product.stock) {
      throw ApiError.badRequest(
        `Only ${product.stock} in stock for "${product.name}"`,
      );
    }

    if (existing) {
      existing.quantity = newQty;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    const saved = await cartRepository.save(cart);
    return buildCartView(saved);
  },

  async updateItem(userId, productId, { quantity }) {
    const cart = await cartRepository.findOrCreateByUser(userId);
    const item = cart.items.find(
      (i) => String(i.product._id ?? i.product) === productId,
    );
    if (!item) throw ApiError.notFound('Item not in cart');

    const product = await productRepository.findById(productId);
    if (!product) throw ApiError.notFound('Product not available');
    if (quantity > product.stock) {
      throw ApiError.badRequest(
        `Only ${product.stock} in stock for "${product.name}"`,
      );
    }

    item.quantity = quantity;
    const saved = await cartRepository.save(cart);
    return buildCartView(saved);
  },

  async removeItem(userId, productId) {
    const cart = await cartRepository.findOrCreateByUser(userId);
    const before = cart.items.length;
    cart.items = cart.items.filter(
      (i) => String(i.product._id ?? i.product) !== productId,
    );
    if (cart.items.length === before) {
      throw ApiError.notFound('Item not in cart');
    }
    const saved = await cartRepository.save(cart);
    return buildCartView(saved);
  },
};
