// pages/realtime.js
import { useContext, useEffect, useState } from 'react';
import { useRouter }                      from 'next/router';
import { UserContext }                    from './_app';

export default function Realtime() {
  const { user, loaded } = useContext(UserContext);
  const router           = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  // 1) Wait until we know whether the user is signed in
  useEffect(() => {
    if (!loaded) return;        // still checking auth
    if (!user) {
      router.replace('/');      // not signed in → back home
      return;
    }

    // 2) Now that we're sure we have a user, check subscription
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

  // 3) Manual audio initialization - requires user interaction
  const startVoiceSession = async () => {
    try {
      setConnecting(true);
      setError('');

      // fetch ephemeral key
      const tokenRes = await fetch('/api/session');
      const { client_secret } = await tokenRes.json();
      const EPHEMERAL_KEY = client_secret.value;

      // set up peer connection
      const pc = new RTCPeerConnection();
      
      // Create audio element and append to DOM for mobile compatibility
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioEl.playsInline = true; // Required for iOS
      document.body.appendChild(audioEl);
      
      pc.ontrack = e => {
        audioEl.srcObject = e.streams[0];
        // Manually play for mobile browsers
        audioEl.play().catch(err => console.log('Audio play failed:', err));
      };

      // Request microphone access
      const ms = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      pc.addTrack(ms.getTracks()[0]);

      // data channel
      const dataChannel = pc.createDataChannel('oai-events');
      dataChannel.addEventListener('message', e => console.log('Received:', e.data));
      dataChannel.addEventListener('open', () => {
        console.log('Data channel opened');
        setConnected(true);
      });

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

      if (!sdpRes.ok) {
        throw new Error(`OpenAI API error: ${sdpRes.status}`);
      }

      const answer = { type: 'answer', sdp: await sdpRes.text() };
      await pc.setRemoteDescription(answer);

      setAudioReady(true);
      console.log('Voice session ready - you can now speak!');
    } catch (err) {
      console.error('Voice session error:', err);
      let errorMessage = err.message;
      
      // Provide better error messages for common mobile issues
      if (err.name === 'NotAllowedError' || errorMessage.includes('not allowed')) {
        errorMessage = 'Microphone access denied. Please enable microphone permissions in your browser settings and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please check that your device has a microphone.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Your browser does not support voice chat. Try using Chrome or Safari.';
      }
      
      setError(errorMessage);
    } finally {
      setConnecting(false);
    }
  };

  // Render
  if (!loaded || !allowed) {
    return <div style={{ padding: 32 }}>
      <p>Checking access…</p>
    </div>;
  }

  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <h1>🎤 AI Voice Chat</h1>
      
      {!audioReady && !connecting && (
        <div>
          <p>Ready to start your AI voice conversation!</p>
          <button 
            onClick={startVoiceSession}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            🎤 Start Voice Session
          </button>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '16px' }}>
            This will request microphone access and connect to OpenAI's realtime voice API
          </p>
          <details style={{ marginTop: '16px', fontSize: '12px', color: '#888' }}>
            <summary style={{ cursor: 'pointer' }}>📱 Having issues on mobile?</summary>
            <div style={{ marginTop: '8px', textAlign: 'left' }}>
              <p><strong>iOS Safari:</strong></p>
              <p>• Tap AA in address bar → Website Settings → Microphone → Allow</p>
              <p>• Or: Settings → Safari → Camera & Microphone → Ask/Allow</p>
              <p><strong>Android Chrome:</strong></p>
              <p>• Tap lock icon → Permissions → Microphone → Allow</p>
            </div>
          </details>
        </div>
      )}

      {connecting && (
        <div>
          <p>🔄 Connecting to voice session...</p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Setting up microphone and connecting to AI
          </p>
        </div>
      )}

      {audioReady && (
        <div>
          <p style={{ color: 'green', fontWeight: 'bold' }}>
            ✅ Voice session active - speak now!
          </p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            The AI can hear you and will respond with voice
          </p>
          {connected && (
            <p style={{ fontSize: '12px', color: '#0070f3' }}>
              🔗 WebRTC connection established
            </p>
          )}
        </div>
      )}

      {error && (
        <div style={{ color: 'red', marginTop: '16px' }}>
          <p>❌ Error: {error}</p>
          <button 
            onClick={() => {setError(''); startVoiceSession();}}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '8px'
            }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
