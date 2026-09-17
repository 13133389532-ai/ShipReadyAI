import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { scanDirectory } from '../src/scanner.js';

function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'shipready-test-'));
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(root, rel); fs.mkdirSync(path.dirname(full), { recursive:true }); fs.writeFileSync(full, content);
  }
  return { root, cleanup:()=>fs.rmSync(root,{recursive:true,force:true}) };
}

test('detects client-exposed privileged env and generates a fix prompt', () => {
  const fx = fixture({ 'package.json':'{"dependencies":{"next":"15.0.0","@supabase/supabase-js":"2.0.0"}}', '.env':'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_SECRET=supersecretvalue', 'app/page.tsx':'export default function Page(){return <div/>}' });
  try { const report = scanDirectory(fx.root); const finding = report.findings.find(f=>f.id==='SR-009'); assert.ok(finding); assert.match(finding.fixPrompt, /smallest safe change/i); assert.equal(report.version,'0.3.0'); } finally { fx.cleanup(); }
});

test('flags a target app with no automated tests and no lockfile', () => {
  const fx = fixture({'package.json':'{"dependencies":{"next":"15.0.0"}}','next.config.js':'export default {}'});
  try { const report = scanDirectory(fx.root); assert.ok(report.findings.some(f=>f.id==='SR-012')); assert.ok(report.findings.some(f=>f.id==='SR-013')); } finally { fx.cleanup(); }
});

test('uses LIMITED COVERAGE for unrelated stacks instead of claiming readiness', () => {
  const fx = fixture({'Main.java':'class Main {}'});
  try { assert.equal(scanDirectory(fx.root).verdict,'LIMITED COVERAGE'); } finally { fx.cleanup(); }
});
