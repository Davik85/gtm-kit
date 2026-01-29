# LaunchStencil GTM-Kit

LaunchStencil (GTM-Kit) is a Next.js application that collects a marketing brief, takes payment via Paddle, generates a go-to-market plan using OpenAI, and delivers it via a token-protected result page and email.

## Current features implemented
- Order creation with email capture and optional country/tier.
- Brief submission and storage in PostgreSQL via Prisma.
- Paddle checkout creation and webhook processing.
- OpenAI generation with prompt templates and continuation support.
- Token-gated result page + JSON API + downloadable DOCX/text output.
- SMTP email delivery of result links with resend throttling.

## Quick start (local)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start Postgres locally (example via Docker):
   ```bash
   docker compose up -d
   ```
3. Set environment variables (see `docs/ENV.md`).
4. Run Prisma migrations and generate client:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```
5. Start the dev server:
   ```bash
   npm run dev
   ```
6. Visit `http://localhost:3000`.

## Required env vars (summary)
See `docs/ENV.md` for full details and examples.

**Core**
- `DATABASE_URL`
- `APP_BASE_URL`

**OpenAI**
- `OPENAI_API_KEY`

**Paddle**
- `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`
- `PADDLE_PRICE_BASE`, `PADDLE_PRICE_PLUS`, `PADDLE_PRICE_PRO`

**Email (SMTP)**
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `EMAIL_FROM`, `EMAIL_REPLY_TO`

## Build & test commands
```bash
npm run build
npm run lint
```

## Key routes
See `docs/ROUTES.md` for the full route map.

**Pages**
- `/` landing, `/start`, `/brief/[orderId]`, `/order/[orderId]/processing`, `/order/[orderId]/result`, `/result/[orderId]`, `/pricing`, `/legal/*`

**API**
- `/api/orders/create`
- `/api/brief/submit`
- `/api/paddle/checkout`, `/api/paddle/webhook`
- `/api/results/generate`, `/api/results/[orderId]`
- `/api/orders/[orderId]/download`, `/api/results/[orderId]/download`
- `/api/orders/[orderId]/email/resend`

## Known limitations / TODO
- Webhook-triggered generation does not include `accessToken`, so `/api/results/generate` will reject the call.
- No rate limiting on public API routes.
- Email resend endpoint does not require a token or auth.
- `Order` statuses `delivered` and `refunded` are defined but never set.
- No background job/queue; generation runs inline in API request.

## Documentation
- Architecture: `docs/ARCHITECTURE.md`
- Routes: `docs/ROUTES.md`
- Database: `docs/DB.md`
- Environment: `docs/ENV.md`
- Payments (Paddle): `docs/PAYMENTS_PADDLE.md`
- Email: `docs/EMAIL.md`
- Security: `docs/SECURITY.md`
- Deployment: `docs/DEPLOYMENT.md`
- Troubleshooting: `docs/TROUBLESHOOTING.md`

## Current Implementation Snapshot
- ✅ Implemented
  - Order creation, brief submission, Paddle checkout, webhook processing
  - OpenAI generation with token-protected result access
  - Email delivery + DOCX download
- ⚠️ Implemented but needs hardening
  - Webhook-triggered generation missing access token
  - Public endpoints without rate limiting or auth
  - No delivery status tracking despite `delivered` enum value
- ❌ Not implemented yet (planned)
  - Background job queue / retries for generation and email
  - Admin or customer dashboard
