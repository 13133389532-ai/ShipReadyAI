# ShipReady AI

**Know if your AI-built SaaS is ready to ship.**

ShipReady AI scans vibe-coded SaaS projects for common production-readiness risks that are easy to miss when an app was built quickly with Lovable, Bolt, Replit, Cursor, Claude Code or similar tools.

## v0.3 beta

Current scan modes:

1. Local directory via CLI.
2. Public GitHub repository via the web UI or CLI.

The strongest coverage today is for **Next.js + Supabase + Stripe** applications. Other stacks are scanned for generic risks but may receive a **LIMITED COVERAGE** verdict instead of a misleading production-ready result.

### Current checks

- exposed production secrets
- committed `.env` files
- browser-exposed privileged environment variables
- Stripe webhook signature verification
- Supabase Row Level Security
- wildcard CORS
- sensitive API routes without obvious auth guards
- public/AI endpoints without obvious rate limiting
- verbose sensitive logging
- unsanitized `dangerouslySetInnerHTML`
- baseline security-header signals
- automated-test signals
- dependency lockfile presence

### v0.3 report features

- coverage-aware verdicts
- prioritized severity and confidence
- copyable remediation prompts for Cursor / Claude Code / Codex
- downloadable JSON report
- temporary repo clone deleted after scan
- free report retention of about 30 minutes

## Public beta

https://shipready-ai.onrender.com

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

CI runs automatically on pushes to `main`.

## Commercial plan

- Free: public-repo pre-launch scan.
- $49: human-reviewed Pro production-readiness audit.
- $299+: done-for-you Fix Pack.

The Lemon Squeezy checkout is intentionally not marked live until the store product and production checkout URL are configured.

## Still missing before a full paid SaaS

- Lemon Squeezy live checkout + webhook verification test
- paid entitlements / scan credits
- private repository support
- persistent reports and customer history
- customer authentication
- real-user validation on multiple production repositories
- optional Fix PR generation after validation

> ShipReady is a heuristic production-readiness tool, not a penetration test or a guarantee that software is secure. Human security review, runtime testing and infrastructure review are still recommended before production launch.
