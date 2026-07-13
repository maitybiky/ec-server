import mongoose from 'mongoose';

/**
 * A configurable discount rule. `config` shape depends on `type`:
 *   base_cart          → { percent }
 *   quantity_threshold → { threshold, percentPerThreshold }
 *   multi_category     → { minCategories, percent }
 *   max_cap            → { maxPercent }
 * New rule types add a calculator — no schema change needed.
 */
const discountRuleSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    config: { type: mongoose.Schema.Types.Mixed, required: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const DiscountRule = mongoose.model('DiscountRule', discountRuleSchema);
