# Architecture

## System overview
LaunchStencil (GTM-Kit) is a Next.js App Router application that collects a marketing brief, takes payment through Paddle, generates a go-to-market plan via OpenAI, and delivers the result via a token-protected page plus email. The system is server-rendered with serverless API routes running on the Node.js runtime.

**Core components**
- **Next.js app router pages** for marketing pages and the brief/result flow (`app/`).
- **API routes** for order lifecycle, Paddle checkout/webhooks, brief submission, result generation, and delivery (`app/api/`).
- **Database** accessed via Prisma + PostgreSQL (`prisma/schema.prisma`, `lib/db/prisma.ts`).
- **AI generation** via OpenAI Responses API (`lib/openaiClient.ts`, `app/api/results/generate/route.ts`).
- **Email delivery** via nodemailer SMTP (`lib/email.ts`).
- **Payments** via Paddle transactions + webhook processing (`lib/paddleApi.ts`, `app/api/paddle/*`).
- **Document export** for results (DOCX) (`lib/planExport.ts`, `/api/orders/[orderId]/download`).

## End-to-end data flow (high level)
```
Visitor
  │
  ▼
Landing + Start Page (app/page.tsx, app/start/page.tsx)
  │  creates Order + Customer
  ▼
/api/orders/create
  │  returns orderId + accessToken
  ▼
Brief page (app/brief/[orderId])
  │  submits brief payload
  ▼
/api/brief/submit ─────► DB: Brief + Order.status=brief_submitted
  │
  ▼
/api/paddle/checkout ─► Paddle transaction + Payment row
  │
  ▼
Paddle checkout UI → webhook → /api/paddle/webhook
  │
  ├─ updates Payment + Order.status=paid
  └─ (attempts) trigger /api/results/generate
  │
  ▼
/api/results/generate → OpenAI → Result row → Order.status=generated
  │
  └─ send email with token link
  ▼
Result page + download routes (token protected)
```

## Main flows

### 1) Landing → Start → Brief → Paddle checkout → Webhook → Generation → Result page → Email
1. **Start**: user enters email (and optional country/tier) on `/start`, which POSTs to `/api/orders/create` and stores the returned access token in `sessionStorage`.
2. **Brief**: `/brief/[orderId]` submits brief payload to `/api/brief/submit`, which stores the brief and moves the order to `brief_submitted`.
3. **Checkout**: `/api/paddle/checkout` creates a Paddle transaction and stores a `Payment` row with `status='created'`.
4. **Webhook**: `/api/paddle/webhook` verifies signature, persists `WebhookEvent` (unique `eventId`), and updates `Payment` + `Order` status.
5. **Generation**: `/api/results/generate` validates the access token, calls OpenAI, writes `Result`, updates `Order` to `generated`, and sends email.
6. **Result**: `/order/[orderId]/result?token=...` and `/result/[orderId]?token=...` serve the result using token gating.

### 2) Token-protected access
The access token is stored on the `Order` record and is required for:
- Server page access checks (`app/result/[orderId]/ResultAccessPage.tsx`).
- Result API read (`app/api/results/[orderId]/route.ts`).
- Result download (`app/api/results/[orderId]/download/route.ts`).
- Result DOCX export (`app/api/orders/[orderId]/download/route.ts`).
- Result generation (`app/api/results/generate/route.ts`).

## Implementation map (what exists and where)

### UI & Pages
- **Marketing**: `/` (landing), `/pricing`, `/legal/*` pages in `app/`.
- **Start + brief**: `/start` and `/brief/[orderId]` (`app/start/page.tsx`, `app/brief/[orderId]/page.tsx`, `app/brief/[orderId]/BriefForm.tsx`).
- **Result view**: `/order/[orderId]/result` and `/result/[orderId]` (shared `ResultAccessPage` + `ResultClient`).
- **Processing page**: `/order/[orderId]/processing` shows after checkout.

### API & server-side flows
- **Order creation**: `app/api/orders/create/route.ts`.
- **Brief submission**: `app/api/brief/submit/route.ts`.
- **Paddle checkout**: `app/api/paddle/checkout/route.ts` + `lib/paddleApi.ts`.
- **Paddle webhooks**: `app/api/paddle/webhook/route.ts`.
- **Result generation**: `app/api/results/generate/route.ts` + `lib/openaiClient.ts` + `lib/prompts/*`.
- **Result fetch + download**: `app/api/results/[orderId]/route.ts`, `app/api/results/[orderId]/download/route.ts`, `app/api/orders/[orderId]/download/route.ts`.
- **Email resend**: `app/api/orders/[orderId]/email/resend/route.ts`.
- **Health check**: `app/api/health/route.ts`.

### Data & integrations
- **Database schema**: `prisma/schema.prisma` (Orders, Results, Payments, Briefs, WebhookEvents, Customers).
- **Email**: `lib/email.ts` (SMTP via nodemailer).
- **Paddle**: `lib/paddleApi.ts` (API key + price IDs).
- **OpenAI**: `lib/openaiClient.ts` + prompt registry `lib/prompts/registry.ts`.
- **Export**: `lib/planExport.ts` (DOCX from markdown).

## Key implementation notes (code excerpts)

**Webhook idempotency (unique `eventId`)**
```ts
await prisma.webhookEvent.create({
  data: { provider: PROVIDER, eventId, eventType, payload: eventJson },
})
```

**Generation access gating**
```ts
if (!accessToken || order.accessToken !== accessToken) {
  return jsonResponse({ error: 'Access denied' }, { status: 404 })
}
```

**Automatic generation trigger from Paddle webhook (currently orderId only)**
```ts
await fetch(`${baseUrl}/api/results/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ orderId }),
})
```

The last snippet means the webhook trigger does **not** include the access token required by `/api/results/generate`, which should be called out in the limitations/TODO list.
