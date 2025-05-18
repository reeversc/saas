export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const r = await fetch('https://api.openai.com/v1/realtime/sessions', {
    method:'POST',
    headers:{
      Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type':'application/json'
    },
    body:JSON.stringify({
      model:'gpt-4o-realtime-preview-2024-12-17',
      voice:process.env.NEXT_PUBLIC_OPENAI_VOICE || 'verse'
    })
  });
  const data = await r.json();
  res.status(200).json(data);
}
