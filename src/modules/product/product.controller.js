import { productService } from './product.service.js';
import { ApiResponse } from '../../shared/utils/ApiResponse.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';

export const productController = {
  browse: asyncHandler(async (req, res) => {
    const q = req.validatedQuery;
    const includeInactive =
      req.user?.role === 'admin' && q.includeInactive === 'true';
    const result = await productService.browse({ ...q, includeInactive });
    ApiResponse.ok(res, 'Products', result);
  }),

  getById: asyncHandler(async (req, res) => {
    const product = await productService.getById(req.params.id);
    ApiResponse.ok(res, 'Product', { product });
  }),

  create: asyncHandler(async (req, res) => {
    const product = await productService.create(req.body, req.files);
    ApiResponse.created(res, 'Product created', { product });
  }),

  update: asyncHandler(async (req, res) => {
    const product = await productService.update(
      req.params.id,
      req.body,
      req.files,
    );
    ApiResponse.ok(res, 'Product updated', { product });
  }),

  removeImage: asyncHandler(async (req, res) => {
    const product = await productService.removeImage(
      req.params.id,
      req.params.key,
    );
    ApiResponse.ok(res, 'Image removed', { product });
  }),

  remove: asyncHandler(async (req, res) => {
    await productService.remove(req.params.id);
    ApiResponse.ok(res, 'Product deleted');
  }),
};
