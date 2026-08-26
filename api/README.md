# Request notification setup

The request page posts to `/api/request`. On Vercel, configure:

- `RESEND_API_KEY`
- `REQUEST_FROM_EMAIL` (a verified sender, recommended: requests@thequietfewcollective.com)
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

Email is delivered to itsleftybro@thequietfewcollective.com and SMS to +1 607-201-3131. Secrets must only be added through the hosting provider's environment settings; never commit them.

The endpoint validates required fields, includes a honeypot, sanitizes lengths, and returns a request ID. Before high-volume launch, add durable storage, IP-based rate limiting, CAPTCHA/Turnstile, authenticated Studio OS access, delivery retries, and audit logging.

## Pricing methodology

The public estimator uses a versioned August 2026 rate card based on current US freelancer, boutique-studio, and verified Clutch project ranges. It intentionally prices below a conventional full-service agency while retaining budget for discovery, bespoke UI/UX, development, QA, launch, and normal revisions.

- Website baseline: $1,800 including three pages; $250 per additional page.
- Web app baseline: $9,500 including three screens; $450 per additional screen.
- Mobile app baseline: $12,500 including three screens; $500 per additional screen.
- Features use scope-specific prices rather than a single generic add-on.
- Overlapping payment work receives an automatic bundle credit.
- Domain discovery and connection planning adds $150.
- The upper bound reflects discovery uncertainty: 25% for websites and 35% for application work.
- Third-party subscriptions, domain registration, hosting, transaction fees, usage charges, app-store fees, copywriting, photography, regulated compliance, migration, and ongoing maintenance are excluded unless added to the final proposal.

The estimator is a non-binding planning range. Final proposals must confirm scope, deliverables, revision limits, timeline, ownership, support, and change-order pricing.
