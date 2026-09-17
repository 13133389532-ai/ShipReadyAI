import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { RULES, severityRank } from './rules.js';

const TEXT_EXTENSIONS = new Set([
  '.js','.jsx','.ts','.tsx','.mjs','.cjs','.json','.md','.txt','.env','.sql','.yml','.yaml','.toml','.ini','.conf','.properties'
]);
const SKIP_DIRS = new Set(['node_modules','.git','.next','dist','build','coverage','.turbo']);

function walk(dir, root = dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, root, files);
    else {
      const ext = path.extname(entry.name).toLowerCase();
      if (TEXT_EXTENSIONS.has(ext) || entry.name.startsWith('.env')) {
        const stat = fs.statSync(full);
        if (stat.size <= 1024 * 1024) files.push({ full, rel: path.relative(root, full).replaceAll('\\','/') });
      }
    }
  }
  return files;
}

function readSafe(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return ''; }
}

function finding(ruleId, file, evidence, recommendation, confidence = 'high') {
  const rule = RULES.find(r => r.id === ruleId);
  return { ...rule, file, evidence, recommendation, confidence };
}

function lineEvidence(content, needle) {
  const lines = content.split(/\r?\n/);
  const idx = lines.findIndex(l => typeof needle === 'string' ? l.includes(needle) : needle.test(l));
  if (idx < 0) return '';
  return `line ${idx + 1}: ${lines[idx].trim().slice(0, 180)}`;
}

export function scanDirectory(rootDir) {
  const root = path.resolve(rootDir);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) throw new Error(`Directory not found: ${root}`);
  const files = walk(root);
  const all = files.map(f => ({ ...f, content: readSafe(f.full) }));
  const findings = [];

  const secretPatterns = [
    [/\bsk_live_[A-Za-z0-9]{12,}\b/, 'Stripe live secret key'],
    [/\bsk-proj-[A-Za-z0-9_-]{12,}\b/, 'OpenAI project key'],
    [/\bsk-[A-Za-z0-9]{20,}\b/, 'API secret key'],
    [/SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^\s"']{12,}/, 'Supabase service role key']
  ];

  for (const f of all) {
    for (const [pattern, label] of secretPatterns) {
      if (pattern.test(f.content)) {
        findings.push(finding('SR-001', f.rel, lineEvidence(f.content, pattern), `Rotate the ${label} immediately, remove it from Git history, and load it from a deployment secret store.`));
      }
    }
    if (/^\.env(?:\.|$)/.test(path.basename(f.rel)) && /(?:KEY|SECRET|TOKEN|PASSWORD)\s*=/.test(f.content)) {
      findings.push(finding('SR-002', f.rel, 'Environment file contains credential-like variables.', 'Remove the file from version control, rotate exposed credentials, add it to .gitignore, and provide a redacted .env.example instead.'));
    }
    if (/Access-Control-Allow-Origin["'\s,:=*]+\*/i.test(f.content) || /origin\s*:\s*["']\*["']/i.test(f.content)) {
      findings.push(finding('SR-005', f.rel, lineEvidence(f.content, /(?:Access-Control-Allow-Origin|origin\s*:)/i), 'Restrict allowed origins to your production domains and separate development CORS configuration.'));
    }
    if (/console\.(log|debug)\(/.test(f.content) && /(token|secret|password|authorization|payload|user|email)/i.test(f.content)) {
      findings.push(finding('SR-008', f.rel, lineEvidence(f.content, /console\.(log|debug)\(/), 'Use structured logs, redact sensitive fields, and disable verbose payload logging in production.', 'medium'));
    }
  }

  const stripeFiles = all.filter(f => /stripe/i.test(f.content) && /(webhook|checkout\.session|payment_intent)/i.test(f.content));
  for (const f of stripeFiles) {
    const isWebhook = /webhook|checkout\.session|payment_intent/i.test(f.content);
    const verifies = /(constructEvent|webhooks\.constructEvent|verify.*signature|stripe-signature)/i.test(f.content);
    if (isWebhook && !verifies) findings.push(finding('SR-003', f.rel, 'Stripe event handling found but no obvious webhook signature verification was detected.', 'Verify the raw request body using Stripe\'s webhook signing secret before trusting event type, customer, amount, or subscription state.', 'medium'));
  }

  const sqlFiles = all.filter(f => f.rel.endsWith('.sql'));
  for (const f of sqlFiles) {
    const tables = [...f.content.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?(["\w]+)/ig)].map(m => m[1].replaceAll('"',''));
    for (const table of tables) {
      const rls = new RegExp(`alter\\s+table\\s+(?:public\\.)?["']?${table}["']?\\s+enable\\s+row\\s+level\\s+security`, 'i');
      if (!rls.test(f.content)) findings.push(finding('SR-004', f.rel, `Table '${table}' is created in this migration but RLS enablement was not found in the same migration.`, `Enable Row Level Security for ${table}, then add explicit SELECT/INSERT/UPDATE/DELETE policies and test with multiple users.`, 'medium'));
    }
  }

  const sensitiveName = /(admin|billing|payment|export|delete|invite|role|user)/i;
  const routeFiles = all.filter(f => /(app\/api\/|pages\/api\/)/.test(f.rel) && /route\.(ts|js)$|\/api\/.*\.(ts|js)$/.test(f.rel));
  for (const f of routeFiles) {
    if (!sensitiveName.test(f.rel + '\n' + f.content)) continue;
    const authSignals = /(getServerSession|getUser\(|auth\(|currentUser|session|verifyToken|authorization)/i;
    if (!authSignals.test(f.content)) findings.push(finding('SR-006', f.rel, 'Sensitive route name/behavior detected without an obvious auth/session check.', 'Require authentication and role/ownership authorization at the start of the route. Add a negative test proving unauthorized callers receive 401/403.', 'medium'));
  }

  const publicAiOrAuth = all.filter(f => /(app\/api\/|pages\/api\/)/.test(f.rel) && /(openai|anthropic|generate|login|signin|signup|contact)/i.test(f.rel + f.content));
  for (const f of publicAiOrAuth) {
    if (!/(rateLimit|ratelimit|upstash|limiter|429)/i.test(f.content)) findings.push(finding('SR-007', f.rel, 'Potential public/AI endpoint with no obvious rate limiting signal.', 'Add IP/user-based rate limiting, sensible quotas, and 429 responses. For AI endpoints, enforce per-user spend limits.', 'low'));
  }

  const unique = [];
  const seen = new Set();
  for (const x of findings) {
    const key = `${x.id}|${x.file}|${x.evidence}`;
    if (!seen.has(key)) { seen.add(key); unique.push(x); }
  }
  unique.sort((a,b) => severityRank[b.severity] - severityRank[a.severity]);
  const scorePenalty = unique.reduce((n, f) => n + f.weight * (f.confidence === 'low' ? 0.45 : f.confidence === 'medium' ? 0.7 : 1), 0);
  const score = Math.max(0, Math.round(100 - scorePenalty));
  const blockers = unique.filter(f => f.severity === 'blocker').length;
  const verdict = blockers > 0 || score < 70 ? 'DO NOT SHIP YET' : score < 85 ? 'SHIP WITH CAUTION' : 'READY FOR HUMAN REVIEW';
  const stack = detectStack(all);
  return {
    product: 'ShipReady AI',
    version: '0.1.0',
    scannedAt: new Date().toISOString(),
    scanId: crypto.createHash('sha256').update(root + Date.now()).digest('hex').slice(0,12),
    root: path.basename(root),
    filesScanned: all.length,
    stack,
    score,
    verdict,
    summary: {
      blocker: unique.filter(f => f.severity === 'blocker').length,
      high: unique.filter(f => f.severity === 'high').length,
      medium: unique.filter(f => f.severity === 'medium').length,
      low: unique.filter(f => f.severity === 'low').length
    },
    findings: unique
  };
}

function detectStack(files) {
  const names = new Set(files.map(f => f.rel));
  const joined = files.map(f => f.content).join('\n');
  return {
    nextjs: names.has('next.config.js') || names.has('next.config.mjs') || /["']next["']\s*:/.test(joined),
    supabase: /@supabase\/|SUPABASE_URL|supabase/i.test(joined),
    stripe: /["']stripe["']\s*:|from\s+["']stripe["']|stripe\.webhooks/i.test(joined),
    vercel: names.has('vercel.json') || /VERCEL_URL/.test(joined)
  };
}
