import { addressService } from './address.service.js';
import { ApiResponse } from '../../shared/utils/ApiResponse.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';

export const addressController = {
  list: asyncHandler(async (req, res) => {
    const addresses = await addressService.list(req.user.id);
    ApiResponse.ok(res, 'Addresses', { addresses });
  }),

  create: asyncHandler(async (req, res) => {
    const address = await addressService.create(req.user.id, req.body);
    ApiResponse.created(res, 'Address saved', { address });
  }),

  remove: asyncHandler(async (req, res) => {
    await addressService.remove(req.user.id, req.params.id);
    ApiResponse.ok(res, 'Address deleted');
  }),
};
