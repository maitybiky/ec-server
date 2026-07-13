import { discountRepository } from './discount.repository.js';
import {
  calculators,
  CAP_TYPE,
  RULE_TYPES,
} from './discount.calculators.js';
import { ApiError } from '../../shared/utils/ApiError.js';

const round2 = (n) => Math.round(n * 100) / 100;

export const discountService = {
  /**
   * Calculate the discount breakdown for cart items.
   * @param {Array<{ price: number, quantity: number, categoryId: string }>} items
   * @returns full breakdown — safe to snapshot onto an order.
   */
  async calculate(items) {
    const subtotal = round2(
      items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    );
    const context = {
      totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
      distinctCategoryCount: new Set(items.map((i) => String(i.categoryId)))
        .size,
      subtotal,
    };

    const rules = await discountRepository.findActive();

    const appliedRules = [];
    let totalPercent = 0;
    let capPercent = null;

    for (const rule of rules) {
      if (rule.type === CAP_TYPE) {
        const { maxPercent } = rule.config;
        capPercent = capPercent === null ? maxPercent : Math.min(capPercent, maxPercent);
        continue;
      }

      const calculate = calculators[rule.type];
      if (!calculate) continue; // unknown type in DB — skip, don't crash

      const percent = round2(calculate(rule.config, context));
      if (percent > 0) {
        appliedRules.push({
          ruleId: rule.id,
          type: rule.type,
          name: rule.name,
          percent,
        });
        totalPercent = round2(totalPercent + percent);
      }
    }

    const appliedPercent =
      capPercent !== null ? Math.min(totalPercent, capPercent) : totalPercent;
    const discountAmount = round2((subtotal * appliedPercent) / 100);

    return {
      subtotal,
      appliedRules,
      totalPercent,
      capPercent,
      appliedPercent,
      discountAmount,
      payable: round2(subtotal - discountAmount),
    };
  },

  listRules() {
    return discountRepository.findAll();
  },

  async createRule({ type, name, description, config, isActive, sortOrder }) {
    if (!RULE_TYPES.includes(type)) {
      throw ApiError.badRequest(
        `Unknown rule type "${type}". Supported: ${RULE_TYPES.join(', ')}`,
      );
    }
    return discountRepository.create({
      type,
      name,
      description,
      config,
      isActive,
      sortOrder,
    });
  },

  async updateRule(id, updates) {
    if (updates.type && !RULE_TYPES.includes(updates.type)) {
      throw ApiError.badRequest(`Unknown rule type "${updates.type}"`);
    }
    const rule = await discountRepository.updateById(id, updates);
    if (!rule) throw ApiError.notFound('Discount rule not found');
    return rule;
  },

  async deleteRule(id) {
    const rule = await discountRepository.deleteById(id);
    if (!rule) throw ApiError.notFound('Discount rule not found');
  },
};
