import { connectDB, disconnectDB } from '../shared/config/db.js';
import { DiscountRule } from '../models/discount-rule.model.js';
import { Category } from '../models/category.model.js';

const DEFAULT_RULES = [
  {
    type: 'base_cart',
    name: 'Base Cart Discount',
    description: 'Applies when the cart contains at least 1 item.',
    config: { percent: 5 },
    sortOrder: 1,
  },
  {
    type: 'quantity_threshold',
    name: 'Quantity Bonus',
    description: 'Extra discount for every quantity threshold reached.',
    config: { threshold: 5, percentPerThreshold: 2 },
    sortOrder: 2,
  },
  {
    type: 'multi_category',
    name: 'Multi-Category Bonus',
    description: 'Extra discount when the cart spans enough categories.',
    config: { minCategories: 4, percent: 3 },
    sortOrder: 3,
  },
  {
    type: 'max_cap',
    name: 'Maximum Discount Cap',
    description: 'Total discount can never exceed this percentage.',
    config: { maxPercent: 50 },
    sortOrder: 100,
  },
];

const DEFAULT_CATEGORIES = [
  { name: 'Clothes', slug: 'clothes' },
  { name: 'Tech', slug: 'tech' },
];

async function seed() {
  await connectDB();

  for (const rule of DEFAULT_RULES) {
    const existing = await DiscountRule.findOne({ type: rule.type });
    if (existing) {
      console.log(`Rule "${rule.name}" (${rule.type}) already exists — skipped.`);
    } else {
      await DiscountRule.create(rule);
      console.log(`Rule "${rule.name}" created.`);
    }
  }

  for (const cat of DEFAULT_CATEGORIES) {
    const existing = await Category.findOne({ slug: cat.slug });
    if (existing) {
      console.log(`Category "${cat.name}" already exists — skipped.`);
    } else {
      await Category.create(cat);
      console.log(`Category "${cat.name}" created.`);
    }
  }

  await disconnectDB();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
