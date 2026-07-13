import { cartService } from './cart.service.js';
import { ApiResponse } from '../../shared/utils/ApiResponse.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';

export const cartController = {
  get: asyncHandler(async (req, res) => {
    const cart = await cartService.getCart(req.user.id);
    ApiResponse.ok(res, 'Cart', { cart });
  }),

  addItem: asyncHandler(async (req, res) => {
    const cart = await cartService.addItem(req.user.id, req.body);
    ApiResponse.ok(res, 'Item added to cart', { cart });
  }),

  updateItem: asyncHandler(async (req, res) => {
    const cart = await cartService.updateItem(
      req.user.id,
      req.params.productId,
      req.body,
    );
    ApiResponse.ok(res, 'Cart updated', { cart });
  }),

  removeItem: asyncHandler(async (req, res) => {
    const cart = await cartService.removeItem(
      req.user.id,
      req.params.productId,
    );
    ApiResponse.ok(res, 'Item removed', { cart });
  }),
};
