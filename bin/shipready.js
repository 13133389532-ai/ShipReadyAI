#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { scanDirectory } from '../src/scanner.js';
import { renderHtml } from '../src/report.js';
import { clonePublicRepo } from '../src/repo.js';

const args = process.argv.slice(2);
if (!args[0] || args.includes('--help')) {
  console.log('Usage: shipready <directory|https://github.com/owner/repo> [--html report.html] [--json report.json]');
  process.exit(args.includes('--help') ? 0 : 1);
}
const input = args[0];
const valueAfter = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const htmlPath = valueAfter('--html');
const jsonPath = valueAfter('--json');
let cleanup = null;
let dir = input;
try {
  if (/^https:\/\/github\.com\//i.test(input)) {
    const cloned = clonePublicRepo(input);
    cleanup = cloned.cleanup;
    dir = cloned.target;
  }
  const report = scanDirectory(dir);
  report.version = '0.2.0';
  console.log(`\nShipReady AI ${report.score}/100 — ${report.verdict}`);
  console.log(`Blocker ${report.summary.blocker} · High ${report.summary.high} · Medium ${report.summary.medium} · Low ${report.summary.low}`);
  for (const f of report.findings) console.log(`- [${f.severity.toUpperCase()}] ${f.id} ${f.title} (${f.file})`);
  if (jsonPath) { fs.mkdirSync(path.dirname(jsonPath), { recursive: true }); fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2)); console.log(`JSON: ${jsonPath}`); }
  if (htmlPath) { fs.mkdirSync(path.dirname(htmlPath), { recursive: true }); fs.writeFileSync(htmlPath, renderHtml(report)); console.log(`HTML: ${htmlPath}`); }
} finally {
  cleanup?.();
}
