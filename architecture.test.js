/**
 * Architecture boundary checks — run via `npm run arch:check`.
 *
 * Enforced flow:
 *   routes → controller → service → repository → models → MongoDB
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), 'src');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name.endsWith('.js') ? [full] : [];
  });
}

function importsOf(file) {
  const source = fs.readFileSync(file, 'utf8');
  const specs = [];
  const patterns = [
    /import\s+[^'"]*from\s+['"]([^'"]+)['"]/g,
    /import\s+['"]([^'"]+)['"]/g,
    /require\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const re of patterns) {
    for (const m of source.matchAll(re)) specs.push(m[1]);
  }
  return { source, specs };
}

const files = walk(SRC);
const rel = (f) => path.relative(SRC, f).replaceAll('\\', '/');

const kind = (f) => {
  const r = rel(f);
  if (/^models\//.test(r)) return 'model';
  if (/\.routes\.js$/.test(r)) return 'routes';
  if (/\.controller\.js$/.test(r)) return 'controller';
  if (/\.service\.js$/.test(r)) return 'service';
  if (/\.repository\.js$/.test(r)) return 'repository';
  if (/\.validator\.js$/.test(r)) return 'validator';
  return 'other';
};

const FORBIDDEN = {
  routes: [/\.service(\.js)?$/, /\.repository(\.js)?$/, /\/models\//, /^mongoose$/],
  controller: [/\.repository(\.js)?$/, /\/models\//, /^mongoose$/],
  service: [/\/models\//, /^mongoose$/, /\.controller(\.js)?$/, /\.routes(\.js)?$/],
  repository: [/\.service(\.js)?$/, /\.controller(\.js)?$/, /\.routes(\.js)?$/],
  model: [/\.service(\.js)?$/, /\.controller(\.js)?$/, /\.repository(\.js)?$/, /\.routes(\.js)?$/],
};

test('layer boundaries are respected', () => {
  const violations = [];
  for (const file of files) {
    const k = kind(file);
    const rules = FORBIDDEN[k];
    if (!rules) continue;
    const { specs } = importsOf(file);
    for (const spec of specs) {
      for (const forbidden of rules) {
        if (forbidden.test(spec)) {
          violations.push(`${rel(file)} (${k}) imports "${spec}"`);
        }
      }
    }
  }
  assert.deepEqual(violations, [], `Layer violations:\n${violations.join('\n')}`);
});

test('process.env is only read in shared/config/env.js', () => {
  const violations = [];
  for (const file of files) {
    const r = rel(file);
    if (r === 'shared/config/env.js') continue;
    const { source } = importsOf(file);
    if (/process\.env/.test(source)) violations.push(r);
  }
  assert.deepEqual(
    violations,
    [],
    `process.env accessed outside shared/config/env.js:\n${violations.join('\n')}`,
  );
});

test('only repositories, scripts, and db config import mongoose models', () => {
  const violations = [];
  for (const file of files) {
    const r = rel(file);
    const allowed =
      /\.repository\.js$/.test(r) ||
      /^models\//.test(r) ||
      /^scripts\//.test(r);
    if (allowed) continue;
    const { specs } = importsOf(file);
    for (const spec of specs) {
      if (/\/models\//.test(spec) || /\.model(\.js)?$/.test(spec)) {
        violations.push(`${r} imports "${spec}"`);
      }
    }
  }
  assert.deepEqual(
    violations,
    [],
    `Model imports outside repositories:\n${violations.join('\n')}`,
  );
});
