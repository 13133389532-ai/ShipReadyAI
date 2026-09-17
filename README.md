# ShipReady AI

**Know if your AI-built SaaS is ready to ship.**

ShipReady AI scans vibe-coded SaaS projects for common production-readiness risks that are easy to miss when an app was built quickly with Lovable, Bolt, Replit, Cursor, Claude Code or similar tools.

## v0.2 MVP

This version supports two ways to scan:

1. Local directory via CLI.
2. Public GitHub repository via the web UI or CLI.

The current rules target common Next.js + Supabase + Stripe + Vercel failure modes:

- exposed production secrets
- committed `.env` files
- Stripe webhook signature verification
- Supabase Row Level Security
- wildcard CORS
- sensitive API routes without obvious auth guards
- public/AI endpoints without obvious rate limiting
- verbose sensitive logging

## Local scan

```bash
node ./bin/shipready.js ./examples/demo-vulnerable-app \
  --html ./reports/demo-report.html \
  --json ./reports/demo-report.json
```

## Public GitHub repo scan

```bash
node ./bin/shipready.js https://github.com/OWNER/REPO --html ./reports/repo.html
```

## Web app

```bash
npm run serve
```

Open `http://localhost:3000`, paste a public GitHub repository URL and start a scan.

## Test

```bash
npm test
npm run scan:demo
```

## Product direction

- Free: limited public-repo preview scan.
- $19: automated full scan.
- $49: Pro production-readiness audit.
- $299+: done-for-you Fix Pack.

> ShipReady is a heuristic production-readiness tool, not a guarantee that software is secure. Human security review, dependency scanning, runtime testing and infrastructure review are still recommended before production launch.
