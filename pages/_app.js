import { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const UserContext = createContext();

export default function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user ?? null)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, supabase }}>
      <Component {...pageProps} />
    </UserContext.Provider>
  );
}
