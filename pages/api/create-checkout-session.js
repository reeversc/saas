import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).end();
  try{
    const { email } = req.body;
    const session = await stripe.checkout.sessions.create({
      mode:'subscription',
      payment_method_types:['card'],
      customer_email:email,
      line_items:[{ price:process.env.NEXT_PUBLIC_PRICE_ID, quantity:1 }],
      success_url:`${process.env.NEXT_PUBLIC_SITE_URL}/?success=1`,
      cancel_url:`${process.env.NEXT_PUBLIC_SITE_URL}/?canceled=1`
    });
    res.status(200).json({ id: session.id });
  }catch(e){
    console.error(e);
    res.status(400).json({ message:e.message });
  }
}
