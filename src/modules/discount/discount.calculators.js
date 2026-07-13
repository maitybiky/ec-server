/**
 * Discount calculators — one pure function per rule type.
 *
 * Each receives (config, context) and returns a non-negative additive
 * percentage. Context:
 *   { totalQuantity, distinctCategoryCount, subtotal }
 *
 * The `max_cap` type is special: it does not add a term, it caps the sum.
 * To add a new discount rule type: add an entry here + create a DB rule.
 */
export const CAP_TYPE = 'max_cap';

export const calculators = {
  base_cart(config, context) {
    return context.totalQuantity >= 1 ? config.percent : 0;
  },

  quantity_threshold(config, context) {
    if (!config.threshold || config.threshold <= 0) return 0;
    const times = Math.floor(context.totalQuantity / config.threshold);
    return times * config.percentPerThreshold;
  },

  multi_category(config, context) {
    return context.distinctCategoryCount >= config.minCategories
      ? config.percent
      : 0;
  },
};

export const RULE_TYPES = [...Object.keys(calculators), CAP_TYPE];
