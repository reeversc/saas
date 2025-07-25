// pages/_app.js
import { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const UserContext = createContext({
  user: null,
  loaded: false,
  supabase: null,
});

function MyApp({ Component, pageProps }) {
  const [user,   setUser]   = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // listen for login/logout events
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // fetch the initial session
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoaded(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, loaded, supabase }}>
      <Component {...pageProps} />
    </UserContext.Provider>
  );
}

export default MyApp;
