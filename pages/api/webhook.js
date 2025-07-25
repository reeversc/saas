import Stripe from 'stripe';
import { Readable } from 'stream';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

export const config = { api:{ bodyParser:false } };
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function buffer(readable){
  const chunks=[]; for await (const chunk of readable){ chunks.push(typeof chunk==='string'?Buffer.from(chunk):chunk); }
  return Buffer.concat(chunks);
}

export default async function handler(req,res){
  console.log('Webhook received:', req.method, req.headers['stripe-signature'] ? 'with signature' : 'no signature');
  
  const sig=req.headers['stripe-signature'];
  let event;
  try{
    const buf=await buffer(req);
    event=stripe.webhooks.constructEvent(buf,sig,process.env.STRIPE_WEBHOOK_SECRET);
    console.log('Webhook event constructed:', event.type, event.id);
  }catch(e){
    console.error('Webhook signature verification failed:', e.message);
    console.error('Webhook secret configured:', !!process.env.STRIPE_WEBHOOK_SECRET);
    return res.status(400).send(`Webhook Error: ${e.message}`);
  }

  console.log('Processing webhook event:', event.type);
  
  if(event.type==='checkout.session.completed'){
    const session=event.data.object;
    console.log('Checkout completed for:', session.customer_email, 'Subscription:', session.subscription);
    
    try {
      const { data, error } = await supabaseAdmin.from('subscriptions').upsert({
        email: session.customer_email,
        subscription_id: session.subscription,
        status: 'active'
      });
      
      if (error) {
        console.error('Supabase upsert error:', error);
        return res.status(500).json({ error: 'Database update failed' });
      }
      
      console.log('Successfully updated subscription for:', session.customer_email);
    } catch (e) {
      console.error('Unexpected error during subscription update:', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if(event.type==='customer.subscription.updated'){
    const subscription=event.data.object;
    console.log('Subscription updated:', subscription.id, 'Status:', subscription.status);
    
    try {
      const { data, error } = await supabaseAdmin.from('subscriptions').update({
        status: subscription.status
      }).eq('subscription_id', subscription.id);
      
      if (error) {
        console.error('Supabase update error for subscription change:', error);
        return res.status(500).json({ error: 'Database update failed' });
      }
      
      console.log('Successfully updated subscription status:', subscription.id, subscription.status);
    } catch (e) {
      console.error('Unexpected error during subscription status update:', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if(event.type==='customer.subscription.deleted'){
    const subscription=event.data.object;
    console.log('Subscription deleted:', subscription.id);
    
    try {
      const { data, error } = await supabaseAdmin.from('subscriptions').update({
        status: 'canceled'
      }).eq('subscription_id', subscription.id);
      
      if (error) {
        console.error('Supabase update error for subscription deletion:', error);
        return res.status(500).json({ error: 'Database update failed' });
      }
      
      console.log('Successfully canceled subscription:', subscription.id);
    } catch (e) {
      console.error('Unexpected error during subscription cancellation:', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    console.log('Unhandled webhook event type:', event.type);
  }
  
  res.json({ received:true });
}
