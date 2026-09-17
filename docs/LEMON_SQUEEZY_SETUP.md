# Lemon Squeezy setup plan

ShipReady v0.2 is already wired for checkout links and signed Lemon Squeezy webhooks. No store credentials are committed to source control.

## Create these offers

### Automated Launch Scan
- Price: $19 one-time
- Deliverable: one repository scan, launch score and prioritized report
- Put its hosted checkout URL in `LEMONSQUEEZY_STARTER_CHECKOUT_URL`.

### Pro Production Readiness Audit
- Price: $49 one-time introductory price
- Deliverable: automated scan + deeper review + implementation guidance
- Put its hosted checkout URL in `LEMONSQUEEZY_PRO_CHECKOUT_URL`.

### Fix Pack
- Starting at $299, quoted manually
- Put a booking/contact URL in `FIX_PACK_CONTACT_URL`.

## Webhook

Configure Lemon Squeezy to send events to:

`https://YOUR_DOMAIN/api/webhooks/lemonsqueezy`

Generate a webhook secret in Lemon Squeezy and configure the same value as:

`LEMONSQUEEZY_WEBHOOK_SECRET=...`

The server validates the `X-Signature` HMAC-SHA256 signature before accepting an event. v0.2 logs only minimal event metadata; v0.3 will persist paid entitlements and scan credits in the database.

## Do not commit

- API keys
- webhook secret
- checkout management credentials
- customer data
