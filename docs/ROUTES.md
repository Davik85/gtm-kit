# Routes

## Pages (App Router)

| Route | Purpose | Inputs | Outputs | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `/` | Landing page marketing content. | None. | HTML. | Public. | `app/page.tsx` |
| `/start` | Start order: collect email, optional country/tier. | Email, country, tier (client form). | Redirects to `/brief/[orderId]` after creating an order. | Public. | `app/start/page.tsx` |
| `/brief/[orderId]` | Collect brief details before payment. | Brief fields + optional country. | Redirects to Paddle checkout on submit. | Public (orderId-based). | `app/brief/[orderId]/page.tsx`, `app/brief/[orderId]/BriefForm.tsx` |
| `/order/[orderId]/processing` | Confirmation after checkout. | orderId path param. | HTML page. | Public. | `app/order/[orderId]/processing/page.tsx` |
| `/order/[orderId]/result` | Token-protected result page. | `token` query param. | HTML app page. | **Token required**. | `app/order/[orderId]/result/page.tsx` |
| `/result/[orderId]` | Alternate token-protected result page. | `token` query param. | HTML app page. | **Token required**. | `app/result/[orderId]/page.tsx` |
| `/pricing` | Pricing page. | None. | HTML. | Public. | `app/pricing/page.tsx` |
| `/legal/privacy` | Privacy policy. | None. | HTML. | Public. | `app/legal/privacy/page.tsx` |
| `/legal/terms` | Terms of service. | None. | HTML. | Public. | `app/legal/terms/page.tsx` |
| `/legal/refunds` | Refund policy. | None. | HTML. | Public. | `app/legal/refunds/page.tsx` |
| `/legal/cookies` | Cookies policy. | None. | HTML. | Public. | `app/legal/cookies/page.tsx` |

## API routes (`app/api/*`)

| Route | Method | Purpose | Inputs | Outputs | Auth | Source |
| --- | --- | --- | --- | --- | --- | --- |
| `/api/health` | GET | Basic health check (counts orders). | None. | `{ ok: true, orders }` | Public. | `app/api/health/route.ts` |
| `/api/orders/create` | POST | Create order + customer, returns access token. | `{ email, countryCode?, tier? }` | `{ orderId, status, accessToken }` or error. | Public. | `app/api/orders/create/route.ts` |
| `/api/brief/submit` | POST | Store brief payload and update order status. | `{ orderId, countryCode?, brief }` | `{ ok: true, brief }` or error. | Public (orderId-based). | `app/api/brief/submit/route.ts` |
| `/api/paddle/checkout` | POST | Create Paddle transaction + Payment row. | `{ orderId }` | `{ checkoutUrl, transactionId }` or error. | Public (orderId-based). | `app/api/paddle/checkout/route.ts` |
| `/api/paddle/webhook` | POST | Paddle webhook handler; verifies signature, updates payment + order. | Raw Paddle webhook body + signature header. | `{ ok: true }` (or error). | **Signature required**. | `app/api/paddle/webhook/route.ts` |
| `/api/results/generate` | POST | Generate GTM plan via OpenAI. | `{ orderId, accessToken }` | `{ ok, status, resultId, resultLink, resultText? }` | **Token required**. | `app/api/results/generate/route.ts` |
| `/api/results/[orderId]` | GET | Fetch generated result (JSON). | `token` query param. | `{ ok, status, result }` | **Token required**. | `app/api/results/[orderId]/route.ts` |
| `/api/results/[orderId]/download` | GET | Download plaintext result. | `token` query param. | `text/plain` | **Token required**. | `app/api/results/[orderId]/download/route.ts` |
| `/api/orders/[orderId]/download` | GET | Download DOCX result. | `token` query param; optional `format=docx`. | DOCX bytes or JSON error. | **Token required**. | `app/api/orders/[orderId]/download/route.ts` |
| `/api/orders/[orderId]/email/resend` | POST | Re-send result email (5 min throttle). | None (orderId param). | `{ ok: true }` or error. | Public (orderId-based). | `app/api/orders/[orderId]/email/resend/route.ts` |
