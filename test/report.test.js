import test from 'node:test';
import assert from 'node:assert/strict';
import { renderHtml } from '../src/report.js';

test('report exposes remediation prompt and JSON download', () => {
  const html = renderHtml({ version:'0.3.0', score:42, verdict:'DO NOT SHIP YET', coverage:'strong', filesScanned:12, scannedAt:new Date().toISOString(), scanId:'abcdef123456', stack:{nextjs:true,supabase:true,stripe:true,vercel:true}, summary:{blocker:1,high:0,medium:0,low:0}, findings:[{id:'SR-001',severity:'blocker',confidence:'high',title:'Exposed production secret',file:'.env',evidence:'line 1',why:'bad',recommendation:'rotate',fixPrompt:'fix this safely'}] });
  assert.match(html,/Copy fix prompt/); assert.match(html,/abcdef123456\.json/); assert.match(html,/Strong target-stack coverage/);
});
