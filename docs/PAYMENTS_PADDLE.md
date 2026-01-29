# Payments (Paddle)

## Checkout creation
Checkout is created via `/api/paddle/checkout`:
1. Looks up the order and prior payments.
2. Re-uses an existing transaction URL if a `Payment` with `status='created'` or `status='draft'` exists.
3. Calls Paddle `/transactions` with `enable_checkout: true` and price ID by tier.
4. Stores a `Payment` row (`status='created'`) with the Paddle payload.

Key payload fields:
- `items: [{ price_id, quantity: 1 }]`
- `custom_data: { orderId }` (used later by webhook)
- Optional `checkout.success_url` and `checkout.cancel_url` built from `APP_BASE_URL`.

## What gets stored
`Payment` rows include:
- `paddleTransactionId`: Paddle transaction ID
- `status`: `created`, `completed`, `draft`, `canceled`, `failed`
- `payload`: full Paddle response payload (JSON)

## Webhook verification
Webhook requests must include the `paddle-signature` header. The handler uses HMAC SHA-256 with `PADDLE_WEBHOOK_SECRET` and supports hex or base64 signature formats:

```ts
const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
const expectedBase64 = Buffer.from(expectedHex, 'hex').toString('base64')
return matchesHex || matchesBase64
```

## Idempotency logic
Each webhook payload is stored in `WebhookEvent` with a **unique `eventId`**. Duplicates are detected with Prisma unique constraint errors and return `{ ok: true, duplicate: true }`.

```ts
await prisma.webhookEvent.create({
  data: { provider: PROVIDER, eventId, eventType, payload: eventJson },
})
```

## Event types handled
The webhook currently handles:
- `transaction.completed`
- `transaction.canceled`
- `transaction.payment_failed`

## Status transitions

**On `transaction.completed`:**
- `Payment.status` → `completed`
- `Order.status` → `paid` (only if previously `created` or `brief_submitted`)

**On `transaction.canceled` or `transaction.payment_failed`:**
- `Payment.status` → `canceled` or `failed`
- `Order.status` → `created` (only if previously `paid`)

## Automatic generation trigger (current behavior)
The webhook attempts to trigger `/api/results/generate` after a completed transaction **without** passing an access token:

```ts
await fetch(`${baseUrl}/api/results/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ orderId }),
})
```

The generation endpoint requires a valid access token, so this call will be rejected with `Access denied` unless the token requirement is removed or a token is provided. This should be addressed as a hardening item.
