import { orderService } from './order.service.js';
import { ApiResponse } from '../../shared/utils/ApiResponse.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';

export const orderController = {
  place: asyncHandler(async (req, res) => {
    const order = await orderService.placeOrder(
      req.user.id,
      req.user.email,
      req.body,
    );
    ApiResponse.created(res, 'Order placed', { order });
  }),

  myOrders: asyncHandler(async (req, res) => {
    const result = await orderService.getMyOrders(req.user.id, req.validatedQuery);
    ApiResponse.ok(res, 'Your orders', result);
  }),

  myOrderById: asyncHandler(async (req, res) => {
    const order = await orderService.getMyOrderById(req.user.id, req.params.id);
    ApiResponse.ok(res, 'Order', { order });
  }),

  adminList: asyncHandler(async (req, res) => {
    const result = await orderService.adminList(req.validatedQuery);
    ApiResponse.ok(res, 'Orders', result);
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const order = await orderService.updateStatus(
      req.params.id,
      req.body.status,
    );
    ApiResponse.ok(res, 'Order status updated', { order });
  }),

  exportCsv: asyncHandler(async (req, res) => {
    const csv = await orderService.exportCsv(req.validatedQuery);
    res
      .status(200)
      .setHeader('Content-Type', 'text/csv')
      .setHeader(
        'Content-Disposition',
        `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      )
      .send(csv);
  }),
};
