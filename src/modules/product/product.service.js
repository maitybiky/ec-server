import { productRepository } from './product.repository.js';
import { categoryRepository } from '../category/category.repository.js';
import { ApiError } from '../../shared/utils/ApiError.js';
import { storage } from '../../shared/storage/index.js';

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
};

export const productService = {
  async browse({ category, ids, search, sort = 'newest', page = 1, limit = 12, includeInactive = false }) {
    const filter = includeInactive ? {} : { status: 'active' };
    if (category) filter.category = category;
    if (ids) filter._id = { $in: ids.split(',') };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const { items, total } = await productRepository.paginate({
      filter,
      sort: SORTS[sort] ?? SORTS.newest,
      page,
      limit,
    });

    return {
      products: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  async getById(id) {
    const product = await productRepository.findById(id);
    if (!product) throw ApiError.notFound('Product not found');
    return product;
  },

  async create({ name, description, price, category, stock, status }, files = []) {
    const cat = await categoryRepository.findById(category);
    if (!cat || !cat.isActive) {
      throw ApiError.badRequest('Category does not exist or is inactive');
    }

    const images = await Promise.all(
      files.map((f) =>
        storage.upload({
          buffer: f.buffer,
          originalName: f.originalname,
          mimeType: f.mimetype,
        }),
      ),
    );

    return productRepository.create({
      name,
      description,
      price,
      category,
      stock,
      status,
      images,
    });
  },

  async update(id, updates, files = []) {
    if (updates.category) {
      const cat = await categoryRepository.findById(updates.category);
      if (!cat || !cat.isActive) {
        throw ApiError.badRequest('Category does not exist or is inactive');
      }
    }

    if (files.length > 0) {
      const newImages = await Promise.all(
        files.map((f) =>
          storage.upload({
            buffer: f.buffer,
            originalName: f.originalname,
            mimeType: f.mimetype,
          }),
        ),
      );
      const existing = await productRepository.findById(id);
      if (!existing) throw ApiError.notFound('Product not found');
      updates.images = [...existing.images, ...newImages];
    }

    const product = await productRepository.updateById(id, updates);
    if (!product) throw ApiError.notFound('Product not found');
    return product;
  },

  async removeImage(id, key) {
    const product = await productRepository.findById(id);
    if (!product) throw ApiError.notFound('Product not found');

    const remaining = product.images.filter((img) => img.key !== key);
    if (remaining.length === product.images.length) {
      throw ApiError.notFound('Image not found on product');
    }

    await storage.delete(key);
    return productRepository.updateById(id, { images: remaining });
  },

  async remove(id) {
    const product = await productRepository.deleteById(id);
    if (!product) throw ApiError.notFound('Product not found');
    await Promise.all(product.images.map((img) => storage.delete(img.key)));
  },
};
