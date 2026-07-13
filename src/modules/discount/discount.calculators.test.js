import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculators } from './discount.calculators.js';

const base = { percent: 5 };
const qty = { threshold: 5, percentPerThreshold: 2 };
const multi = { minCategories: 4, percent: 3 };

const ctx = (totalQuantity, distinctCategoryCount = 1) => ({
  totalQuantity,
  distinctCategoryCount,
  subtotal: 100,
});

test('base_cart: 5% with at least 1 item, 0% when empty', () => {
  assert.equal(calculators.base_cart(base, ctx(1)), 5);
  assert.equal(calculators.base_cart(base, ctx(0)), 0);
});

test('quantity_threshold matches PRD examples (1→0, 5→2, 10→4, 15→6)', () => {
  assert.equal(calculators.quantity_threshold(qty, ctx(1)), 0);
  assert.equal(calculators.quantity_threshold(qty, ctx(5)), 2);
  assert.equal(calculators.quantity_threshold(qty, ctx(10)), 4);
  assert.equal(calculators.quantity_threshold(qty, ctx(15)), 6);
});

test('multi_category: +3% at 4 categories, 0 below', () => {
  assert.equal(calculators.multi_category(multi, ctx(4, 4)), 3);
  assert.equal(calculators.multi_category(multi, ctx(4, 3)), 0);
});

test('combined PRD example: 5 items across 4 categories = 5+2+3 = 10%', () => {
  const c = ctx(5, 4);
  const total =
    calculators.base_cart(base, c) +
    calculators.quantity_threshold(qty, c) +
    calculators.multi_category(multi, c);
  assert.equal(total, 10);
});
