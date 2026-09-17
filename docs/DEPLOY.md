# Deploy ShipReady AI v0.2

## What this build does

- Serves the ShipReady landing page.
- Accepts a public GitHub repository URL.
- Clones the repository with `git clone --depth 1`.
- Scans the code with the ShipReady heuristic engine.
- Returns a short summary and an expiring HTML report.
- Limits free scans per IP in memory.

## Docker

```bash
docker build -t shipready-ai .
docker run --rm -p 3000:3000 -e FREE_SCAN_LIMIT=3 shipready-ai
```

Open `http://localhost:3000`.

## MVP safety limits

- github.com only.
- public repositories only.
- 45 second clone timeout.
- 100 MB source limit (excluding `.git`).
- Git LFS smudge disabled.
- report links expire from memory after ~30 minutes.
- never put tokens in repository URLs.

## Next production steps

1. Add a job queue so scans do not block the HTTP worker.
2. Persist scan metadata/results in Postgres.
3. Add GitHub OAuth/GitHub App for private repositories.
4. Store only minimal source metadata; delete cloned code immediately after scan.
5. Add a stronger rate limiter (Redis/Upstash) and abuse monitoring.
6. Finish paid entitlement persistence from Lemon Squeezy webhooks.
7. Add AI-assisted explanations and verified fix patches.
