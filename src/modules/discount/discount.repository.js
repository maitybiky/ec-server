import { DiscountRule } from '../../models/discount-rule.model.js';

export const discountRepository = {
  findAll() {
    return DiscountRule.find().sort({ sortOrder: 1, createdAt: 1 });
  },

  findActive() {
    return DiscountRule.find({ isActive: true }).sort({
      sortOrder: 1,
      createdAt: 1,
    });
  },

  findById(id) {
    return DiscountRule.findById(id);
  },

  create(data) {
    return DiscountRule.create(data);
  },

  updateById(id, data) {
    return DiscountRule.findByIdAndUpdate(id, data, { new: true });
  },

  deleteById(id) {
    return DiscountRule.findByIdAndDelete(id);
  },
};
