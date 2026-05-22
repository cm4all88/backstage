# Backstagely

Serving domain for Backstage creator content. Part of the Spotlightly platform (Tahoma Systems LLC).

## What this is

backstagely.app is not a standalone product. It is a content delivery domain for Backstage (adult) creator profiles hosted on the Spotlightly platform.

- No landing page (root redirects to spotlightly.app)
- Same Supabase backend as Spotlightly
- CCBill handles all payments (separate from Stripe on spotlightly.app)
- Age gate on all creator pages
- robots.txt: noindex, nofollow

## Setup

### 1. Vercel project
- Create new Vercel project linked to this repo
- Add domain: backstagely.app
- Copy env vars from .env.example and fill in

### 2. Env vars (same Supabase as Spotlightly)
Copy NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY
from your Spotlightly Vercel project.

### 3. CCBill merchant account
Apply at ccbill.com. Required for live subscriptions.
Once approved:
- Get your FlexForm ID
- Set CCBILL_FLEXFORM_ID in Vercel env vars
- Configure webhook URLs in CCBill merchant portal:
  - Approval: https://backstagely.app/api/webhooks/ccbill?event=NewSaleSuccess
  - Denial:   https://backstagely.app/api/webhooks/ccbill?event=NewSaleDenied
  - Cancel:   https://backstagely.app/api/webhooks/ccbill?event=Cancellation

### 4. Supabase — add ccbill_subscription_id column
Run this in the Supabase SQL editor:
```sql
alter table public.subscriptions
  add column if not exists ccbill_subscription_id text;
```

## URL structure
- backstagely.app → redirects to spotlightly.app
- backstagely.app/[handle] → Backstage creator profile (age-gated)
- backstagely.app/api/subscribe → CCBill subscription initiation
- backstagely.app/api/webhooks/ccbill → CCBill event webhook
