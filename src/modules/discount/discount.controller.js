import { discountService } from './discount.service.js';
import { ApiResponse } from '../../shared/utils/ApiResponse.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';

export const discountController = {
  listRules: asyncHandler(async (req, res) => {
    const rules = await discountService.listRules();
    ApiResponse.ok(res, 'Discount rules', { rules });
  }),

  createRule: asyncHandler(async (req, res) => {
    const rule = await discountService.createRule(req.body);
    ApiResponse.created(res, 'Discount rule created', { rule });
  }),

  updateRule: asyncHandler(async (req, res) => {
    const rule = await discountService.updateRule(req.params.id, req.body);
    ApiResponse.ok(res, 'Discount rule updated', { rule });
  }),

  deleteRule: asyncHandler(async (req, res) => {
    await discountService.deleteRule(req.params.id);
    ApiResponse.ok(res, 'Discount rule deleted');
  }),
};
