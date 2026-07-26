# Email setup

Payload sends transactional email (login OTP codes) through an email adapter configured in `src/email/adapter.ts`.

Priority (first match wins):

1. **Resend** — when `RESEND_API_KEY` is set (recommended for Vercel)
2. **SMTP** — when `SMTP_HOST` is set (any Nodemailer-compatible provider)
3. **Ethereal** — local development fallback (no real delivery; inbox URL logged on startup)

## Environment variables

Copy from `.env.example`:

```bash
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME=HHT AI Chat

# Option A — Resend
RESEND_API_KEY=

# Option B — SMTP (used when RESEND_API_KEY is empty)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

`EMAIL_FROM_ADDRESS` must be a sender your provider allows (verified domain or sandbox address).

## Resend (production / Vercel)

1. Create an account at [resend.com](https://resend.com).
2. Add and verify your sending domain (DNS records Resend shows).
3. Create an API key and set `RESEND_API_KEY` in Vercel project env (Production / Preview / Development as needed).
4. Set `EMAIL_FROM_ADDRESS` to an address on that domain, e.g. `noreply@yourdomain.com`.
5. Redeploy. OTP emails should arrive within a few seconds.

Resend is preferred on Vercel because the adapter is lightweight (HTTP API, no SMTP socket pool).

## SMTP (SendGrid, Mailgun, Gmail, etc.)

Leave `RESEND_API_KEY` empty and set SMTP vars:

| Provider   | Typical host                  | Notes                                                                                              |
| ---------- | ----------------------------- | -------------------------------------------------------------------------------------------------- |
| SendGrid   | `smtp.sendgrid.net`           | User `apikey`, password = API key                                                                  |
| Mailgun    | `smtp.mailgun.org`            | Use Mailgun SMTP credentials                                                                       |
| Gmail      | `smtp.gmail.com`              | Use an [App Password](https://support.google.com/accounts/answer/185833), not your normal password |
| Amazon SES | region-specific SMTP endpoint | Create SMTP credentials in SES                                                                     |

Example SendGrid:

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxx
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
```

## Local development (Ethereal)

With neither `RESEND_API_KEY` nor `SMTP_HOST` set, Payload uses [Ethereal](https://ethereal.email). On `pnpm dev` startup you will see Ethereal credentials / a preview URL in the server logs. Open that URL to read OTP emails instead of a real inbox.

## Verifying OTP email

1. Open `/login`, enter an email, click **Send code**.
2. Check Resend/SMTP inbox or the Ethereal preview URL.
3. Enter the 6-digit code to finish sign-in.
