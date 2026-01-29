# Troubleshooting

## Prisma client errors
**Symptoms**: `PrismaClientInitializationError`, database connection failures.

**Checks**:
- Verify `DATABASE_URL` is set and reachable.
- Confirm Postgres is running and accessible (Docker or managed DB).
- Ensure Prisma client is generated (`npx prisma generate`).

**Files**: `lib/db/prisma.ts`, `prisma/schema.prisma`.

## Paddle webhook signature failures
**Symptoms**: `/api/paddle/webhook` returns 400 with `Invalid signature`.

**Checks**:
- Verify `PADDLE_WEBHOOK_SECRET` matches Paddle dashboard.
- Confirm raw body is sent unmodified and `paddle-signature` header is present.
- Validate Paddle environment (`PADDLE_ENV`) and API version settings.

**Files**: `app/api/paddle/webhook/route.ts`.

## Missing env vars
**Symptoms**: errors like `Missing <VAR> environment variable` or `is not set`.

**Checks**:
- Ensure all required variables in `docs/ENV.md` are populated.
- Pay attention to `APP_BASE_URL`, `OPENAI_API_KEY`, and SMTP envs.

**Files**: `lib/paddleApi.ts`, `lib/openaiClient.ts`, `lib/email.ts`, `lib/db/prisma.ts`.

## Email sending issues
**Symptoms**: email send fails, result page never receives email.

**Checks**:
- Verify SMTP credentials.
- Confirm `EMAIL_REPLY_TO` is set (required by `sendResultEmail`).
- Check logs for `Failed to send result email`.

**Files**: `lib/email.ts`, `app/api/results/generate/route.ts`, `app/api/orders/[orderId]/email/resend/route.ts`.

## Token access issues
**Symptoms**: 404 on result page or download despite a valid order.

**Checks**:
- Ensure the `token` query param is present and matches `Order.accessToken`.
- Verify the token stored in `sessionStorage` matches the orderId (key `order-access-token:{orderId}`).
- Confirm `accessToken` is passed to `/api/results/generate`.

**Files**: `app/result/[orderId]/ResultAccessPage.tsx`, `app/api/results/[orderId]/route.ts`, `app/api/results/generate/route.ts`.

## Generation not triggered after payment
**Symptoms**: order paid but no result generated.

**Checks**:
- Webhook calls `/api/results/generate` **without** the required access token, causing rejection.
- Manually open the token-protected result link to trigger generation.

**Files**: `app/api/paddle/webhook/route.ts`, `app/api/results/generate/route.ts`.

## Logs
- API route logs print to the server runtime logs (`console.info` / `console.error`).
- Check deployment provider logs for `/api/results/generate` and `/api/paddle/webhook` failures.
