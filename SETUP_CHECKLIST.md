# Stripe-Supabase Integration Setup Checklist

## Required Environment Variables

**Supabase Configuration:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon public key  
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)

**Stripe Configuration:**
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook endpoint secret (CRITICAL - webhooks fail without this)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- [ ] `NEXT_PUBLIC_PRICE_ID` - Stripe price ID for your subscription product

**OpenAI Configuration:**
- [ ] `OPENAI_API_KEY` - OpenAI API key for realtime sessions
- [ ] `NEXT_PUBLIC_OPENAI_VOICE` - OpenAI voice model (optional, defaults to 'verse')

**Application Configuration:**
- [ ] `NEXT_PUBLIC_SITE_URL` - Your site's base URL (for Stripe redirects)

## Stripe Webhook Setup

1. **Create Webhook Endpoint in Stripe Dashboard:**
   - URL: `https://yourdomain.com/api/webhook`
   - Events to listen for:
     - [ ] `checkout.session.completed`
     - [ ] `customer.subscription.updated` 
     - [ ] `customer.subscription.deleted`

2. **Copy Webhook Secret:**
   - [ ] Copy the webhook signing secret from Stripe dashboard
   - [ ] Set it as `STRIPE_WEBHOOK_SECRET` environment variable

## Supabase Database Setup

**Create `subscriptions` table:**
```sql
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  subscription_id TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Verify table structure:**
- [ ] Table `subscriptions` exists
- [ ] Column `email` (text, unique constraint recommended)
- [ ] Column `subscription_id` (text)
- [ ] Column `status` (text)

## Authentication Setup

**Supabase Auth:**
- [ ] Google OAuth provider enabled in Supabase Auth settings
- [ ] Redirect URLs configured for your domain

## Testing the Integration

1. **Test webhook endpoint:**
   - [ ] Webhook endpoint accessible at `/api/webhook`
   - [ ] Check server logs for webhook events
   - [ ] Verify Stripe webhook delivery attempts in dashboard

2. **Test subscription flow:**
   - [ ] User can sign in with Google
   - [ ] Checkout session creates successfully
   - [ ] Webhook processes `checkout.session.completed`
   - [ ] Subscription record appears in Supabase
   - [ ] User gains access to `/realtime` page

## Common Issues

**Webhook not receiving events:**
- Verify webhook URL is publicly accessible
- Check `STRIPE_WEBHOOK_SECRET` is correctly set
- Ensure webhook endpoint is configured in Stripe dashboard

**Database errors:**
- Verify `subscriptions` table exists with correct columns
- Check `SUPABASE_SERVICE_ROLE_KEY` has write permissions
- Review Supabase logs for detailed error messages

**Access still denied after payment:**
- Check subscription status in database
- Verify email matches between Stripe and Supabase Auth
- Check console logs in `/realtime` page for API errors