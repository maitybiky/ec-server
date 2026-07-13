/**
 * Bulk product seeder.
 *
 * Usage:
 *   npm run seed:products                 → loads src/scripts/products.sample.json
 *   npm run seed:products -- ./my.json    → loads your own file
 *
 * JSON format: array of
 *   {
 *     "name": "Basic Tee",            (required)
 *     "category": "Clothes",          (required — created if missing)
 *     "price": 499,                   (required, ≥ 0)
 *     "description": "…",             (optional)
 *     "stock": 100,                   (optional, default 0)
 *     "status": "active",             (optional: active | inactive)
 *     "image": "https://…"            (optional — external image URL)
 *   }
 *
 * Categories are matched by name (case-insensitive) and created when absent.
 * Products are matched by name — existing ones are skipped, not duplicated.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDB, disconnectDB } from '../shared/config/db.js';
import { Category } from '../models/category.model.js';
import { Product } from '../models/product.model.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] ?? path.join(here, 'products.sample.json');

const slugify = (name) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function validate(entry, index) {
  const errors = [];
  if (!entry.name || typeof entry.name !== 'string') errors.push('name is required');
  if (!entry.category || typeof entry.category !== 'string') errors.push('category is required');
  if (typeof entry.price !== 'number' || entry.price < 0) errors.push('price must be a number ≥ 0');
  if (entry.stock !== undefined && (!Number.isInteger(entry.stock) || entry.stock < 0)) {
    errors.push('stock must be an integer ≥ 0');
  }
  if (entry.status !== undefined && !['active', 'inactive'].includes(entry.status)) {
    errors.push('status must be "active" or "inactive"');
  }
  if (entry.image !== undefined && !/^https?:\/\//.test(entry.image)) {
    errors.push('image must be an http(s) URL');
  }
  if (errors.length > 0) {
    throw new Error(`Entry #${index + 1} (${entry.name ?? 'unnamed'}): ${errors.join('; ')}`);
  }
}

async function findOrCreateCategory(name, cache) {
  const key = name.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key);

  let category = await Category.findOne({
    name: { $regex: `^${name.trim()}$`, $options: 'i' },
  });
  if (!category) {
    category = await Category.create({ name: name.trim(), slug: slugify(name) });
    console.log(`  + category created: ${category.name}`);
  }
  cache.set(key, category);
  return category;
}

async function seedProducts() {
  const resolved = path.resolve(file);
  if (!fs.existsSync(resolved)) {
    console.error(`File not found: ${resolved}`);
    process.exit(1);
  }

  const entries = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  if (!Array.isArray(entries) || entries.length === 0) {
    console.error('JSON must be a non-empty array of products.');
    process.exit(1);
  }
  entries.forEach(validate);

  await connectDB();
  console.log(`Seeding ${entries.length} products from ${path.basename(resolved)}…`);

  const categoryCache = new Map();
  let created = 0;
  let skipped = 0;

  for (const entry of entries) {
    const category = await findOrCreateCategory(entry.category, categoryCache);

    const images = entry.image
      ? [{ key: `external-${slugify(entry.name)}`, url: entry.image }]
      : [];

    const exists = await Product.findOne({
      name: { $regex: `^${entry.name.trim()}$`, $options: 'i' },
    });
    if (exists) {
      // Backfill an image onto an existing product that has none.
      if (exists.images.length === 0 && images.length > 0) {
        exists.images = images;
        await exists.save();
        console.log(`  ~ image backfilled: ${entry.name}`);
      } else {
        skipped += 1;
        console.log(`  = skipped (already exists): ${entry.name}`);
      }
      continue;
    }

    await Product.create({
      name: entry.name.trim(),
      description: entry.description ?? '',
      price: entry.price,
      category: category._id,
      stock: entry.stock ?? 0,
      status: entry.status ?? 'active',
      images,
    });
    created += 1;
    console.log(`  + product created: ${entry.name} (${category.name})`);
  }

  console.log(`\nDone — ${created} created, ${skipped} skipped.`);
  await disconnectDB();
}

seedProducts().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
