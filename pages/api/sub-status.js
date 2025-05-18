import { supabaseAdmin } from '../../lib/supabaseAdmin';

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).end();
  const { email } = req.body;
  if(!email) return res.status(400).json({ error:'email required' });
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('status')
    .eq('email', email)
    .single();
  if(error) return res.status(500).json({ error: error.message });
  res.status(200).json({ active: data?.status==='active' });
}
