import { useContext } from 'react';
import { UserContext } from './_app';
import { supabase } from '../lib/supabaseClient';
import { loadStripe } from '@stripe/stripe-js';
import { useRouter } from 'next/router';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function Home() {
  const { user } = useContext(UserContext);
  const router = useRouter();
  const needsSub = router.query.needs_sub === '1';

  const signIn = () => supabase.auth.signInWithOAuth({ provider: 'google' });
  const signOut = () => supabase.auth.signOut();

  const subscribe = async () => {
    const stripe = await stripePromise;
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    });
    const data = await res.json();
    if (data.id) await stripe.redirectToCheckout({ sessionId: data.id });
    else alert('Unable to create checkout session');
  };

  if (!user) {
    return (
      <div style={{ padding:32 }}>
        <h1>Welcome</h1>
        <button onClick={signIn}>Sign in with Google</button>
      </div>
    );
  }

  return (
    <div style={{ padding:32 }}>
      {needsSub && <p style={{color:'red'}}>You need an active subscription to access realtime voice.</p>}
      <h1>Hello {user.email}</h1>
      <button onClick={subscribe}>Subscribe</button>
      <button onClick={signOut} style={{marginLeft:16}}>Sign out</button>
    </div>
  );
}
