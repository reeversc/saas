// pages/realtime.js
import { useContext, useEffect, useState } from 'react';
import { useRouter }                      from 'next/router';
import { UserContext }                    from './_app';

export default function Realtime() {
  const { user, loaded } = useContext(UserContext);
  const router           = useRouter();
  const [allowed, setAllowed] = useState(false);

  // 1) Wait until we know whether the user is signed in
  useEffect(() => {
    if (!loaded) return;        // still checking auth
    if (!user) {
      router.replace('/');      // not signed in → back home
      return;
    }

    // 2) Now that we’re sure we have a user, check subscription
    fetch('/api/sub-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.active) {
          setAllowed(true);
        } else {
          router.replace('/?needs_sub=1');
        }
      });
  }, [loaded, user, router]);

  // 3) Once allowed, kick off the WebRTC + OpenAI realtime init
  useEffect(() => {
    if (!allowed) return;

    async function init() {
      // fetch ephemeral key
      const tokenRes = await fetch('/api/session');
      const { client_secret } = await tokenRes.json();
      const EPHEMERAL_KEY = client_secret.value;

      // set up peer connection
      const pc = new RTCPeerConnection();
      const audioEl = new Audio();
      audioEl.autoplay = true;
      pc.ontrack = e => (audioEl.srcObject = e.streams[0]);

      // add mic
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      pc.addTrack(ms.getTracks()[0]);

      // data channel
      pc.createDataChannel('oai-events')
        .addEventListener('message', e => console.log(e));

      // SDP handshake
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model   = 'gpt-4o-realtime-preview-2024-12-17';
      const sdpRes  = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          'Content-Type': 'application/sdp',
        },
      });

      const answer = { type: 'answer', sdp: await sdpRes.text() };
      await pc.setRemoteDescription(answer);
    }

    init();
  }, [allowed]);

  // Render
  if (!loaded || !allowed) {
    return <p>Checking access…</p>;
  }
  return <p>Realtime voice session initialized (check console).</p>;
}
