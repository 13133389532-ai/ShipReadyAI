export const RULES = [
  { id:'SR-001', title:'Exposed production secret', severity:'blocker', weight:30, why:'A leaked production secret can let attackers spend API credits, impersonate your backend, or access customer data.' },
  { id:'SR-002', title:'Committed environment file', severity:'high', weight:16, why:'Committed .env files frequently contain credentials that should only exist in deployment secret stores.' },
  { id:'SR-003', title:'Stripe webhook may not verify signatures', severity:'blocker', weight:25, why:'Without signature verification an attacker may be able to forge payment events.' },
  { id:'SR-004', title:'Supabase table may lack Row Level Security', severity:'blocker', weight:25, why:'Without RLS, authenticated users may be able to read or modify rows that belong to other users.' },
  { id:'SR-005', title:'Wildcard CORS configuration', severity:'high', weight:12, why:'Overly broad CORS can expose browser-accessible APIs to untrusted origins.' },
  { id:'SR-006', title:'Sensitive API route may lack authentication guard', severity:'high', weight:14, why:'Administrative, billing, export, or destructive routes should explicitly authenticate and authorize callers.' },
  { id:'SR-007', title:'Public endpoint may lack rate limiting', severity:'medium', weight:7, why:'Unauthenticated endpoints are common abuse targets and can create unexpected infrastructure or AI costs.' },
  { id:'SR-008', title:'Verbose production logging', severity:'medium', weight:5, why:'Debug logs can leak personal data, tokens, payloads, or internal implementation details.' },
  { id:'SR-009', title:'Privileged secret may be exposed to the browser', severity:'blocker', weight:28, why:'Environment variables with public/client prefixes are bundled into browser code. A service-role, private, or secret token there should be treated as compromised.' },
  { id:'SR-010', title:'Dynamic HTML rendered without an obvious sanitizer', severity:'medium', weight:7, why:'Rendering untrusted HTML can create stored or reflected XSS if the value is user-controlled.' },
  { id:'SR-011', title:'No obvious baseline security headers', severity:'low', weight:4, why:'Security headers such as Content-Security-Policy, frame protections, and Referrer-Policy reduce the blast radius of common browser attacks.' },
  { id:'SR-012', title:'No automated test signal detected', severity:'medium', weight:8, why:'A production app with no automated tests is much harder to change safely and more likely to regress during AI-assisted edits.' },
  { id:'SR-013', title:'No dependency lockfile detected', severity:'low', weight:4, why:'Without a lockfile, production installs can resolve different transitive dependency versions over time.' }
];

export const severityRank = { blocker: 4, high: 3, medium: 2, low: 1 };
