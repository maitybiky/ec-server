import { homepageService } from './homepage.service.js';
import { ApiResponse } from '../../shared/utils/ApiResponse.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';

export const homepageController = {
  get: asyncHandler(async (req, res) => {
    const homepage = await homepageService.get();
    ApiResponse.ok(res, 'Homepage content', { homepage });
  }),

  update: asyncHandler(async (req, res) => {
    const homepage = await homepageService.update(req.body);
    ApiResponse.ok(res, 'Homepage updated', { homepage });
  }),
};
