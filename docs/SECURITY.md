# Security & Access Control

## Token model
- Each `Order` has a unique `accessToken` stored in the database (`Order.accessToken`).
- The token is returned during order creation and stored in browser `sessionStorage` using the key `order-access-token:{orderId}`.
- Token-based access is the primary mechanism for gating results and downloads.

## Where token validation is enforced

**Server-rendered page gate**
- `app/result/[orderId]/ResultAccessPage.tsx`: loads the order and calls `notFound()` if the token is missing or invalid.

**Result API (JSON)**
- `app/api/results/[orderId]/route.ts`: checks token query param before returning content.

**Result download (text)**
- `app/api/results/[orderId]/download/route.ts`: checks token query param before returning content.

**Result download (DOCX)**
- `app/api/orders/[orderId]/download/route.ts`: checks token query param before returning content.

**Result generation**
- `app/api/results/generate/route.ts`: requires token in POST body and denies access when it doesn't match.

## Paid-gating checks
Payment status impacts when generation is allowed in `/api/results/generate`:
- Generation proceeds only when `Order.status` is `brief_submitted` or `paid`.
- Orders in `created`, `generating`, `generated`, or `error` are blocked or treated as pending.

## Observations & TODOs
- **No auth on write endpoints**: `/api/orders/create`, `/api/brief/submit`, `/api/paddle/checkout`, and `/api/orders/[orderId]/email/resend` do not require a token or auth. This makes them susceptible to abuse if order IDs can be guessed.
- **No rate limiting** is implemented on API routes.
- **Webhook generation trigger** does not include the access token required by `/api/results/generate` (see payments doc), which prevents automated generation after payment.
- **Access token expiry** is not enforced even though `accessTokenCreatedAt` exists in the schema.
