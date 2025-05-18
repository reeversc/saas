import { useEffect, useContext, useState } from 'react';
import { useRouter } from 'next/router';
import { UserContext } from './_app';

export default function Realtime() {
  const { user } = useContext(UserContext);
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace('/');
      return;
    }
    fetch('/api/sub-status', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ email: user.email })
    })
      .then(r => r.json())
      .then(({ active }) => {
        if (active) setAllowed(true);
        else router.replace('/?needs_sub=1');
      });
  }, [user]);

  useEffect(() => {
    if (!allowed) return;
    async function init() {
      const tokenRes = await fetch('/api/session');
      const { client_secret } = await tokenRes.json();
      const EPHEMERAL_KEY = client_secret.value;

      const pc = new RTCPeerConnection();
      const audioEl = new Audio();
      audioEl.autoplay = true;
      pc.ontrack = e => (audioEl.srcObject = e.streams[0]);
      const ms = await navigator.mediaDevices.getUserMedia({ audio:true });
      pc.addTrack(ms.getTracks()[0]);

      pc.createDataChannel('oai-events').addEventListener('message', e => console.log(e));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = 'gpt-4o-realtime-preview-2024-12-17';
      const sdpRes = await fetch(`${baseUrl}?model=${model}`, {
        method:'POST',
        body:offer.sdp,
        headers:{
          Authorization:`Bearer ${EPHEMERAL_KEY}`,
          'Content-Type':'application/sdp'
        }
      });
      const answer = { type:'answer', sdp: await sdpRes.text() };
      await pc.setRemoteDescription(answer);
    }
    init();
  }, [allowed]);

  return allowed ? <p>Realtime voice session initialized (check console).</p> : <p>Checking subscription…</p>;
}
