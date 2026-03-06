import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as path from 'node:path';

test('service worker caches offline shell', () => {
  const swSource = readFileSync(path.resolve(process.cwd(), 'public/sw.js'), 'utf-8');
  assert.match(swSource, /\/offline\.html/);
});

test('offline shell has primary recovery actions', () => {
  const offlineHtml = readFileSync(path.resolve(process.cwd(), 'public/offline.html'), 'utf-8');
  assert.match(offlineHtml, /Sem conexão no momento\./);
  assert.match(offlineHtml, /Tentar novamente/);
  assert.match(offlineHtml, /Voltar ao início/);
});
