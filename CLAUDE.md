# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server (Next.js)
- `npm run build` - Build production bundle
- `npm start` - Start production server

## Key API Endpoints

- `POST /api/create-checkout-session` - Creates Stripe Checkout sessions for subscription purchases
- `GET /api/sub-status` - Checks user subscription status against Supabase database
- `POST /api/session` - Generates ephemeral OpenAI API keys for realtime voice sessions
- `POST /api/webhook` - Stripe webhook handler for subscription events (checkout.session.completed, customer.subscription.updated/deleted)
- `POST /api/db-setup` - Database initialization utility

## Architecture Overview

This is a Next.js SaaS application with subscription-based access to OpenAI's realtime voice API. The app integrates Supabase for authentication and database, Stripe for subscription management, and WebRTC for realtime communication.

### Core Components

**Authentication & User Management**
- `pages/_app.js` - App wrapper with UserContext for global auth state using Supabase Auth
- `lib/supabaseClient.js` - Client-side Supabase instance
- `lib/supabaseAdmin.js` - Server-side admin Supabase instance with service role key

**Subscription Flow** 
- `pages/index.js` - Home page with Google OAuth signin and subscription purchase
- `pages/api/create-checkout-session.js` - Creates Stripe Checkout sessions for subscriptions
- `pages/api/sub-status.js` - Checks subscription status via Supabase `subscriptions` table
- Subscription data stored in Supabase table with email/status fields

**Realtime Voice Feature**
- `pages/realtime.js` - Protected page that initializes WebRTC connection to OpenAI realtime API
- `pages/api/session.js` - Generates ephemeral OpenAI API keys for realtime sessions
- Uses WebRTC peer connection with audio tracks and data channels
- Connects to `gpt-4o-realtime-preview-2024-12-17` model

### Environment Variables Required

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key for admin operations
- `STRIPE_SECRET_KEY` - Stripe secret key
- `NEXT_PUBLIC_PRICE_ID` - Stripe price ID for subscription
- `NEXT_PUBLIC_SITE_URL` - Base site URL for redirects
- `OPENAI_API_KEY` - OpenAI API key for realtime sessions
- `NEXT_PUBLIC_OPENAI_VOICE` - OpenAI voice model (defaults to 'verse')
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook endpoint secret (critical for webhook verification)

### Database Schema

The app expects a Supabase `subscriptions` table with:
- `email` (text) - User email address
- `subscription_id` (text) - Stripe subscription ID
- `status` (text) - Subscription status ('active' for access, 'canceled' for revoked access)

### Access Control Pattern

1. User signs in with Google OAuth via Supabase
2. User purchases subscription via Stripe Checkout
3. Webhook updates `subscriptions` table in Supabase based on Stripe events
4. `/realtime` page checks subscription status before allowing access
5. Active subscribers get ephemeral OpenAI keys for realtime voice sessions

### Webhook Event Handling

The `/api/webhook` endpoint processes these Stripe events:
- `checkout.session.completed` - Creates/updates subscription record with 'active' status
- `customer.subscription.updated` - Updates subscription status from Stripe
- `customer.subscription.deleted` - Sets subscription status to 'canceled'

### Setup Requirements

See `SETUP_CHECKLIST.md` for detailed configuration steps including:
- Environment variable configuration
- Stripe webhook endpoint setup with required events
- Supabase database table creation
- Google OAuth provider configuration