# Database (Prisma) Summary

The database schema lives in `prisma/schema.prisma` and is deployed via Prisma migrations. The app uses PostgreSQL via the Prisma PG adapter (`lib/db/prisma.ts`).

## Models

### Customer
- **Primary fields**: `id`, `email` (unique), `countryCode`, `createdAt`.
- **Usage**: Created/upserted in `/api/orders/create` from email and optional country.

### Order
- **Primary fields**: `id`, `status`, `tier`, `amountCents`, `currency`, `accessToken`, `promptKey`, `promptVersion`, `countryCode`, `createdAt`, `updatedAt`.
- **Relations**: `customer`, `brief`, `result`, `payments`.
- **Usage**: Created at order creation; status updated through brief submission, payment webhook, and generation.

### Payment
- **Primary fields**: `id`, `orderId`, `paddleTransactionId` (unique), `status`, `payload`, `createdAt`.
- **Usage**: Created when Paddle transaction is created; updated on webhook.

### Brief
- **Primary fields**: `id`, `orderId` (unique), `payload`, `createdAt`.
- **Usage**: Upserted in `/api/brief/submit`.

### Result
- **Primary fields**: `id`, `orderId` (unique), `resultText`, `promptKey`, `promptVersion`, `promptSnapshot`, `modelUsed`, `provider`, `providerResponseId`, `errorMessage`, `emailSentAt`, `createdAt`, `updatedAt`.
- **Usage**: Created after OpenAI generation; `emailSentAt` set after email send/resend.

### WebhookEvent
- **Primary fields**: `id`, `provider`, `eventId` (unique), `eventType`, `payload`, `receivedAt`, `processedAt`, `processingResult`.
- **Usage**: Every webhook payload is stored for idempotency and audit.

## Status fields and values (exact values in code)

### `Order.status` (enum)
Defined in schema: `created`, `paid`, `brief_submitted`, `generating`, `generated`, `delivered`, `error`, `refunded`.

Used in code paths:
- **created**: new order (`/api/orders/create`).
- **brief_submitted**: brief saved (`/api/brief/submit`).
- **paid**: Paddle transaction completed (`/api/paddle/webhook`).
- **generating**: generation lock (`/api/results/generate`).
- **generated**: result stored (`/api/results/generate`).
- **error**: generation failure (`/api/results/generate`).

`delivered` and `refunded` are **defined but not set anywhere in the app** (current behavior).

### `Payment.status` (string)
Used string values in code:
- `created` (when Paddle transaction created)
- `draft` (accepted as an existing in-progress payment)
- `completed` (Paddle webhook `transaction.completed`)
- `canceled` (Paddle webhook `transaction.canceled`)
- `failed` (Paddle webhook `transaction.payment_failed`)

### `WebhookEvent.processingResult` (string)
Set in webhook handler:
- `ignored`
- `completed`
- `payment_failed`

## Indexes & unique constraints (idempotency-related)
- `Customer.email` is unique.
- `Order.accessToken` is unique.
- `Brief.orderId` is unique.
- `Result.orderId` is unique (enforced in DB + handled in generation code).
- `Payment.paddleTransactionId` is unique (prevents duplicate payments).
- `WebhookEvent.eventId` is unique (idempotency for webhook replays).
- `WebhookEvent` has an index on `[provider, eventType]` for auditing.
