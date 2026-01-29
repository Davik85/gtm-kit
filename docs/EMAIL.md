# Email

## SMTP provider and configuration
Email delivery uses **nodemailer** with SMTP credentials from environment variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`). The sender and reply-to are configured via `EMAIL_FROM` and `EMAIL_REPLY_TO`.

## From / Reply-To logic
`lib/email.ts` builds the email like this:
- `from`: `EMAIL_FROM`
- `replyTo`: `EMAIL_REPLY_TO` (or a passed-in override, but the API routes pass the env value)
- Subject: `"Your GTM plan is ready"`

If `EMAIL_REPLY_TO` is missing, `sendResultEmail` throws and email sending fails.

## When emails are sent
1. **After successful generation** in `/api/results/generate`:
   - Sends the result link email if the order has a customer email.
   - Updates `Result.emailSentAt` on success.

2. **Manual resend** in `/api/orders/[orderId]/email/resend`:
   - Allowed once per 5 minutes (`RESEND_WINDOW_MS`).
   - Updates `Result.emailSentAt` on success.

## Failure handling / retry
- Failures are logged (`console.error`) and the request continues (no retries).
- There is **no queue** or retry system for email delivery; failures must be retried manually via the resend endpoint or after fixing SMTP configuration.

## Result link format
Emails contain a token-protected URL:
```
{APP_BASE_URL}/order/{orderId}/result?token={accessToken}
```
The token comes from the `Order.accessToken` column.
