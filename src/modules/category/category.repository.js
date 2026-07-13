import { Category } from '../../models/category.model.js';

export const categoryRepository = {
  findAll({ includeInactive = false } = {}) {
    const filter = includeInactive ? {} : { isActive: true };
    return Category.find(filter).sort({ name: 1 });
  },

  findById(id) {
    return Category.findById(id);
  },

  findByName(name) {
    return Category.findOne({ name });
  },

  create(data) {
    return Category.create(data);
  },

  updateById(id, data) {
    return Category.findByIdAndUpdate(id, data, { new: true });
  },

  countActiveByIds(ids) {
    return Category.countDocuments({ _id: { $in: ids }, isActive: true });
  },
};
