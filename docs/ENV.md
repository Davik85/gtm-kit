# Environment Variables

Below are **all environment variables referenced in the codebase** (`process.env`). Values marked **Required** are mandatory for the relevant features to work.

## Core runtime

| Variable | Required | Purpose | Example |
| --- | --- | --- | --- |
| `NODE_ENV` | Optional | Standard Node environment flag. Used to control Prisma logging and connection reuse. | `development` |
| `APP_BASE_URL` | Required (for emails, webhook-triggered generation, checkout URLs) | Base URL for building absolute links (result link, checkout success/cancel). | `https://launchstencil.com` |
| `DATABASE_URL` | Required | PostgreSQL connection string for Prisma. | `postgresql://user:pass@localhost:5432/gtmkit` |

## OpenAI

| Variable | Required | Purpose | Example |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | Required for generation | API key for OpenAI client. | `sk-...` |
| `OPENAI_MODEL` | Optional | Overrides default model (`gpt-4o`). | `gpt-4o` |
| `OPENAI_ORG` | Optional | Adds `OpenAI-Organization` header. | `org_...` |
| `OPENAI_PROJECT` | Optional | Adds `OpenAI-Project` header. | `proj_...` |

## Paddle

| Variable | Required | Purpose | Example |
| --- | --- | --- | --- |
| `PADDLE_API_KEY` | Required for checkout | API key for Paddle. | `pdl_live_...` |
| `PADDLE_ENV` | Optional | Selects Paddle base URL (`sandbox` or prod). | `sandbox` |
| `PADDLE_API_VERSION` | Optional | Paddle API version header (default `1`). | `1` |
| `PADDLE_PRICE_BASE` | Required for checkout | Price ID for base tier. | `pri_01...` |
| `PADDLE_PRICE_PLUS` | Required for checkout | Price ID for plus tier. | `pri_01...` |
| `PADDLE_PRICE_PRO` | Required for checkout | Price ID for pro tier. | `pri_01...` |
| `PADDLE_WEBHOOK_SECRET` | Required for webhook | HMAC secret for webhook verification. | `whsec_...` |

## Email (SMTP)

| Variable | Required | Purpose | Example |
| --- | --- | --- | --- |
| `SMTP_HOST` | Required for email | SMTP host. | `smtp.mailgun.org` |
| `SMTP_PORT` | Required for email | SMTP port. | `587` |
| `SMTP_SECURE` | Optional | Whether to use TLS (`true`/`false`), defaults to false. | `true` |
| `SMTP_USER` | Required for email | SMTP username. | `postmaster@mg.example.com` |
| `SMTP_PASS` | Required for email | SMTP password. | `...` |
| `EMAIL_FROM` | Required for email | From address. | `LaunchStencil <hello@launchstencil.com>` |
| `EMAIL_REPLY_TO` | Required for email | Reply-To address (also passed by API handlers). | `support@launchstencil.com` |
