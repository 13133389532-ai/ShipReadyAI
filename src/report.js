const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function renderHtml(report) {
  const badge = sev => `<span class="badge ${sev}">${sev.toUpperCase()}</span>`;
  const rows = report.findings.map(f => `
    <article class="finding">
      <div class="finding-top">${badge(f.severity)} <code>${esc(f.id)}</code> <span class="confidence">${esc(f.confidence)} confidence</span></div>
      <h3>${esc(f.title)}</h3>
      <p><strong>File:</strong> <code>${esc(f.file)}</code></p>
      <p><strong>Evidence:</strong> ${esc(f.evidence)}</p>
      <p>${esc(f.why)}</p>
      <div class="fix"><strong>Fix:</strong> ${esc(f.recommendation)}</div>
    </article>`).join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ShipReady AI Report</title><style>
  body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;background:#0b1020;color:#eef2ff;margin:0}.wrap{max-width:980px;margin:0 auto;padding:48px 22px}.hero,.finding{background:#121a30;border:1px solid #263252;border-radius:18px;padding:24px;margin-bottom:18px}.score{font-size:64px;font-weight:800;letter-spacing:-3px}.verdict{font-size:22px;font-weight:800}.muted,.confidence{color:#9ba8c7}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:20px}.metric{background:#0d1428;border-radius:12px;padding:14px}.metric strong{font-size:26px;display:block}.badge{display:inline-block;border-radius:99px;padding:4px 9px;font-size:12px;font-weight:800}.blocker{background:#64212b;color:#ffd5da}.high{background:#673f17;color:#ffe1b2}.medium{background:#4a4616;color:#fff2a8}.low{background:#163e4a;color:#aeefff}.finding h3{margin:12px 0}.finding code{color:#b8c8ff}.fix{background:#0d1428;border-left:4px solid #7c9cff;padding:14px;border-radius:8px}.stack{display:flex;gap:8px;flex-wrap:wrap}.stack span{padding:6px 10px;border:1px solid #33446e;border-radius:99px}.empty{padding:40px;text-align:center;background:#10251d;border:1px solid #286143;border-radius:18px}@media(max-width:700px){.grid{grid-template-columns:repeat(2,1fr)}}
  </style></head><body><div class="wrap"><section class="hero"><p class="muted">ShipReady AI · Production Readiness Report</p><div class="score">${report.score}/100</div><div class="verdict">${esc(report.verdict)}</div><p class="muted">${report.filesScanned} files scanned · ${esc(report.scannedAt)} · Scan ${esc(report.scanId)}</p><div class="stack">${Object.entries(report.stack).filter(([,v])=>v).map(([k])=>`<span>${esc(k)}</span>`).join('')}</div><div class="grid"><div class="metric"><strong>${report.summary.blocker}</strong>Blockers</div><div class="metric"><strong>${report.summary.high}</strong>High</div><div class="metric"><strong>${report.summary.medium}</strong>Medium</div><div class="metric"><strong>${report.summary.low}</strong>Low</div></div></section>${rows || '<div class="empty">No matching high-risk heuristics were detected. Human review is still recommended before production launch.</div>'}</div></body></html>`;
}
