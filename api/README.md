# Request notification setup

The request page posts to `/api/request`. On Vercel, configure:

- `RESEND_API_KEY`
- `REQUEST_FROM_EMAIL` (a verified sender, recommended: requests@thequietfewcollective.com)
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

Email is delivered to itsleftybro@thequietfewcollective.com and SMS to +1 607-202-3131. Secrets must only be added through the hosting provider's environment settings; never commit them.

The endpoint validates required fields, includes a honeypot, sanitizes lengths, and returns a request ID. Before high-volume launch, add durable storage, IP-based rate limiting, CAPTCHA/Turnstile, authenticated Studio OS access, delivery retries, and audit logging.
