import { storage } from '../../shared/storage/index.js';
import { ApiResponse } from '../../shared/utils/ApiResponse.js';
import { ApiError } from '../../shared/utils/ApiError.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';

export const uploadController = {
  uploadImage: asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('No image file provided');
    const { key, url } = await storage.upload({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
    });
    ApiResponse.created(res, 'Image uploaded', { key, url });
  }),
};
