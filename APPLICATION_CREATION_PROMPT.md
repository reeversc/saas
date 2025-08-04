# SaaS Application Creation Prompt

Create a complete Next.js SaaS application that provides subscription-based access to OpenAI's realtime voice API. The application should integrate Supabase for authentication and database management, Stripe for subscription payments, and WebRTC for real-time voice communication.

## Core Features

### 1. Authentication System
- Implement Google OAuth authentication using Supabase Auth
- Create a global user context that manages authentication state across the application
- Provide sign-in and sign-out functionality
- Automatically redirect unauthenticated users to the home page

### 2. Subscription Management
- Integrate Stripe Checkout for subscription purchases
- Create a subscription flow that allows users to purchase access to the voice feature
- Implement webhook handling for subscription lifecycle events (creation, updates, cancellation)
- Store subscription data in Supabase with user email, subscription ID, and status

### 3. Realtime Voice Feature
- Create a protected page that requires an active subscription
- Implement WebRTC connection to OpenAI's realtime voice API
- Generate ephemeral OpenAI API keys for secure realtime sessions
- Enable microphone access and audio playback for voice conversations
- Use the GPT-4o realtime preview model for voice interactions

### 4. Access Control
- Implement subscription status checking before allowing access to premium features
- Redirect users without subscriptions to purchase flow
- Provide clear messaging about subscription requirements

## Technical Architecture

### Frontend Components
- **Home Page (`pages/index.js`)**: Landing page with Google OAuth signin and subscription purchase button
- **Realtime Page (`pages/realtime.js`)**: Protected page that initializes WebRTC voice session
- **App Wrapper (`pages/_app.js`)**: Global UserContext provider for authentication state management

### Backend API Endpoints
- **`/api/create-checkout-session`**: Creates Stripe Checkout sessions for subscriptions
- **`/api/sub-status`**: Checks user subscription status in Supabase database
- **`/api/session`**: Generates ephemeral OpenAI API keys for realtime sessions
- **`/api/webhook`**: Stripe webhook handler for subscription events
- **`/api/db-setup`**: Database initialization utility

### Database Schema
Create a Supabase `subscriptions` table with:
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

### Integration Patterns

#### Supabase Integration
- Use client-side Supabase instance for authentication operations
- Use server-side admin Supabase instance with service role key for database operations
- Implement real-time auth state listening with automatic user state updates

#### Stripe Integration
- Create subscription-mode checkout sessions with customer email
- Handle webhook events for subscription lifecycle:
  - `checkout.session.completed`: Create/activate subscription
  - `customer.subscription.updated`: Update subscription status
  - `customer.subscription.deleted`: Cancel subscription
- Verify webhook signatures for security

#### OpenAI Realtime Integration
- Generate ephemeral API keys for secure client-side access
- Establish WebRTC peer connections with audio tracks
- Configure data channels for real-time communication
- Connect to `gpt-4o-realtime-preview-2024-12-17` model

## Required Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
NEXT_PUBLIC_PRICE_ID=your_stripe_subscription_price_id

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_OPENAI_VOICE=verse

# Application Configuration
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## Implementation Requirements

### Package Dependencies
```json
{
  "dependencies": {
    "next": "latest",
    "react": "latest", 
    "react-dom": "latest",
    "@supabase/supabase-js": "latest",
    "@stripe/stripe-js": "latest",
    "stripe": "latest"
  }
}
```

### Key Implementation Details

1. **Webhook Security**: Implement proper Stripe webhook signature verification using the webhook secret
2. **Error Handling**: Provide comprehensive error handling for all API calls and user interactions
3. **User Experience**: Show loading states and clear messaging for subscription requirements
4. **Security**: Never expose API keys client-side; use ephemeral keys for OpenAI realtime access
5. **Database Operations**: Use upsert operations for subscription data to handle duplicate entries gracefully

### User Flow
1. User visits application and signs in with Google OAuth via Supabase
2. User purchases subscription through Stripe Checkout
3. Webhook processes payment and updates subscription status in Supabase
4. User gains access to protected realtime voice page
5. Application generates ephemeral OpenAI key and establishes WebRTC connection
6. User can have voice conversations with the AI model

### Setup Requirements
- Configure Google OAuth provider in Supabase Auth settings
- Set up Stripe webhook endpoint with required event types
- Create Supabase database table with proper schema
- Configure all environment variables for production deployment

This application demonstrates a complete SaaS pattern with authentication, payments, and AI integration, suitable for production deployment with proper configuration.