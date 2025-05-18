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
  const sig=req.headers['stripe-signature'];
  let event;
  try{
    const buf=await buffer(req);
    event=stripe.webhooks.constructEvent(buf,sig,process.env.STRIPE_WEBHOOK_SECRET);
  }catch(e){
    console.error('Webhook error',e.message);
    return res.status(400).send(`Webhook Error: ${e.message}`);
  }

  if(event.type==='checkout.session.completed'){
    const session=event.data.object;
    await supabaseAdmin.from('subscriptions').upsert({
      email: session.customer_email,
      subscription_id: session.subscription,
      status: 'active'
    });
  }
  res.json({ received:true });
}
