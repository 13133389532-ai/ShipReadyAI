# ShipReady AI — MVP Scope

## Target customer
Non-security-specialist founders who built a SaaS with Lovable, Bolt, Replit, Cursor or Claude Code and are preparing to accept real users/payments.

## Initial supported stack
- Next.js
- Supabase
- Stripe
- Vercel

## Promise
Answer one question in plain English: **Can I safely launch this app to real customers?**

## v0.2 checks
1. Obvious production secret leakage
2. Committed environment files
3. Stripe webhook signature-verification heuristic
4. Supabase RLS heuristic from SQL migrations
5. Wildcard CORS
6. Sensitive API routes without obvious auth guards
7. Public/AI endpoints without obvious rate limiting
8. Verbose logging of sensitive payloads

## Next backlog
- GitHub OAuth/App repository connection for private repos
- SARIF export and GitHub PR comments
- package vulnerability checks
- database policy graph
- automatic fix patches / PRs
- external URL scan
- paid entitlement persistence and report history

## Important positioning
This product is a production-readiness assistant, not a substitute for professional penetration testing or a guarantee that software is vulnerability-free.
