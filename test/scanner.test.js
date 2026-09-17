import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanDirectory } from '../src/scanner.js';
const here = path.dirname(fileURLToPath(import.meta.url));

test('demo app produces launch blockers', () => {
  const report = scanDirectory(path.join(here, '..', 'examples', 'demo-vulnerable-app'));
  assert.ok(report.summary.blocker >= 1);
  assert.equal(report.verdict, 'DO NOT SHIP YET');
  assert.ok(report.findings.some(f => f.id === 'SR-003'));
  assert.ok(report.findings.some(f => f.id === 'SR-004'));
});
