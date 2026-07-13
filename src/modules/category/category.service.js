import { categoryRepository } from './category.repository.js';
import { ApiError } from '../../shared/utils/ApiError.js';

const slugify = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const categoryService = {
  list({ includeInactive = false } = {}) {
    return categoryRepository.findAll({ includeInactive });
  },

  async create({ name }) {
    const existing = await categoryRepository.findByName(name);
    if (existing) throw ApiError.conflict('Category already exists');
    return categoryRepository.create({ name, slug: slugify(name) });
  },

  async update(id, { name, isActive }) {
    const updates = {};
    if (name !== undefined) {
      updates.name = name;
      updates.slug = slugify(name);
    }
    if (isActive !== undefined) updates.isActive = isActive;

    const category = await categoryRepository.updateById(id, updates);
    if (!category) throw ApiError.notFound('Category not found');
    return category;
  },

  async disable(id) {
    const category = await categoryRepository.updateById(id, {
      isActive: false,
    });
    if (!category) throw ApiError.notFound('Category not found');
    return category;
  },
};
