import { categoryService } from './category.service.js';
import { ApiResponse } from '../../shared/utils/ApiResponse.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';

export const categoryController = {
  list: asyncHandler(async (req, res) => {
    const includeInactive =
      req.user?.role === 'admin' && req.validatedQuery?.includeInactive === 'true';
    const categories = await categoryService.list({ includeInactive });
    ApiResponse.ok(res, 'Categories', { categories });
  }),

  create: asyncHandler(async (req, res) => {
    const category = await categoryService.create(req.body);
    ApiResponse.created(res, 'Category created', { category });
  }),

  update: asyncHandler(async (req, res) => {
    const category = await categoryService.update(req.params.id, req.body);
    ApiResponse.ok(res, 'Category updated', { category });
  }),

  disable: asyncHandler(async (req, res) => {
    const category = await categoryService.disable(req.params.id);
    ApiResponse.ok(res, 'Category disabled', { category });
  }),
};
