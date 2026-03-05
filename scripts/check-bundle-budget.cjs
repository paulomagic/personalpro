#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const DIST_ASSETS_DIR = path.resolve(process.cwd(), 'dist', 'assets');

function toKb(bytes) {
  return bytes / 1024;
}

function formatKb(bytes) {
  return `${toKb(bytes).toFixed(1)} kB`;
}

function readBudgetEnv(name, fallbackKb) {
  const raw = process.env[name];
  if (!raw) return fallbackKb * 1024;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallbackKb * 1024;
  return parsed * 1024;
}

if (!fs.existsSync(DIST_ASSETS_DIR)) {
  console.error(`[bundle-budget] Missing build output at ${DIST_ASSETS_DIR}. Run "npm run build" first.`);
  process.exit(1);
}

const assetFiles = fs
  .readdirSync(DIST_ASSETS_DIR)
  .filter((file) => file.endsWith('.js'));

if (assetFiles.length === 0) {
  console.error('[bundle-budget] No JavaScript chunks found in dist/assets.');
  process.exit(1);
}

const metrics = assetFiles.map((file) => {
  const fullPath = path.join(DIST_ASSETS_DIR, file);
  const source = fs.readFileSync(fullPath);
  const gzip = zlib.gzipSync(source, { level: 9 });
  return {
    file,
    rawBytes: source.length,
    gzipBytes: gzip.length
  };
});

const totalRawBytes = metrics.reduce((sum, item) => sum + item.rawBytes, 0);
const totalGzipBytes = metrics.reduce((sum, item) => sum + item.gzipBytes, 0);

const appChunks = metrics.filter((item) => !item.file.startsWith('vendor-'));
const entryChunk = appChunks.sort((a, b) => b.gzipBytes - a.gzipBytes)[0];
const chartsGzipBytes = metrics
  .filter((item) => item.file.startsWith('vendor-charts-'))
  .reduce((sum, item) => sum + item.gzipBytes, 0);
const supabaseGzipBytes = metrics
  .filter((item) => item.file.startsWith('vendor-supabase-'))
  .reduce((sum, item) => sum + item.gzipBytes, 0);

const budgets = [
  {
    label: 'Total JS (gzip)',
    actual: totalGzipBytes,
    limit: readBudgetEnv('BUNDLE_BUDGET_TOTAL_GZIP_KB', 520)
  },
  {
    label: 'Entry app chunk (gzip)',
    actual: entryChunk ? entryChunk.gzipBytes : 0,
    limit: readBudgetEnv('BUNDLE_BUDGET_ENTRY_GZIP_KB', 210)
  },
  {
    label: 'Charts chunk (gzip)',
    actual: chartsGzipBytes,
    limit: readBudgetEnv('BUNDLE_BUDGET_CHARTS_GZIP_KB', 220)
  },
  {
    label: 'Supabase chunk (gzip)',
    actual: supabaseGzipBytes,
    limit: readBudgetEnv('BUNDLE_BUDGET_SUPABASE_GZIP_KB', 140)
  }
];

console.log('[bundle-budget] JS assets:', metrics.length);
console.log(`[bundle-budget] Total JS raw: ${formatKb(totalRawBytes)}`);
console.log(`[bundle-budget] Total JS gzip: ${formatKb(totalGzipBytes)}`);
if (entryChunk) {
  console.log(`[bundle-budget] Largest app chunk: ${entryChunk.file} (${formatKb(entryChunk.gzipBytes)} gzip)`);
}

let failed = false;
for (const budget of budgets) {
  if (budget.actual === 0) continue;
  const withinBudget = budget.actual <= budget.limit;
  const marker = withinBudget ? 'PASS' : 'FAIL';
  console.log(
    `[bundle-budget] ${marker} ${budget.label}: ${formatKb(budget.actual)} / ${formatKb(budget.limit)}`
  );
  if (!withinBudget) failed = true;
}

if (failed) {
  console.error('[bundle-budget] Budget exceeded. Reduce bundle size or adjust thresholds intentionally.');
  process.exit(1);
}

console.log('[bundle-budget] All budgets are within limits.');
