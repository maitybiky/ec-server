import { Product } from '../../models/product.model.js';

export const productRepository = {
  async paginate({ filter, sort, page, limit }) {
    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('category', 'name slug isActive'),
      Product.countDocuments(filter),
    ]);
    return { items, total };
  },

  findById(id) {
    return Product.findById(id).populate('category', 'name slug isActive');
  },

  findManyByIds(ids) {
    return Product.find({ _id: { $in: ids } }).populate(
      'category',
      'name slug isActive',
    );
  },

  create(data) {
    return Product.create(data);
  },

  updateById(id, data) {
    return Product.findByIdAndUpdate(id, data, { new: true }).populate(
      'category',
      'name slug isActive',
    );
  },

  deleteById(id) {
    return Product.findByIdAndDelete(id);
  },
};
