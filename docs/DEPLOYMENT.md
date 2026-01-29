# Deployment Runbook

## Pre-deploy checklist
1. **Environment variables** configured (see `docs/ENV.md`).
2. **Database** provisioned (PostgreSQL) and reachable via `DATABASE_URL`.
3. **Paddle** configured:
   - API key + price IDs
   - Webhook secret
   - Webhook URL set to `/api/paddle/webhook`
4. **Email** configured:
   - SMTP credentials
   - `EMAIL_FROM` and `EMAIL_REPLY_TO`
   - DNS: SPF, DKIM, DMARC
5. **APP_BASE_URL** points to the production domain (used for checkout redirects + email links).

## Build & deploy commands
```bash
npm run build
npx prisma migrate deploy
npx prisma generate
```

## Release steps (suggested)
1. Pull latest code.
2. Install dependencies (`npm install`).
3. Run build (`npm run build`).
4. Apply Prisma migrations (`npx prisma migrate deploy`).
5. Restart the app service.

## Post-deploy verification
- **Health**: `GET /api/health` returns `{ ok: true }`.
- **Order flow**: create an order from `/start` and reach `/brief/[orderId]`.
- **Checkout**: `/api/paddle/checkout` returns a valid `checkoutUrl`.
- **Webhook**: test Paddle webhook signature and ensure events appear in `WebhookEvent` table.
- **Generation**: access result page with token; verify generation occurs.
- **Email**: confirm result email arrives with a valid link.
- **Download**: test DOCX download from result page.

## Rollback checklist
- Revert to previous deploy artifact.
- Validate `DATABASE_URL` and migration state.
- Re-test `/api/health` and `/api/results/[orderId]`.
