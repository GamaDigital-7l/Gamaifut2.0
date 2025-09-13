import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';

const SessionContext = createContext<{ session: Session | null }>({ session: null });

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'SIGNED_IN' && location.pathname !== '/dashboard') {
        navigate('/dashboard');
      } else if (_event === 'SIGNED_OUT' && location.pathname !== '/login') {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  useEffect(() => {
    if (!loading && !session && location.pathname !== '/login') {
      navigate('/login');
    }
    if (!loading && session && location.pathname === '/login') {
      navigate('/dashboard');
    }
  }, [session, loading, navigate, location.pathname]);

  if (loading) {
    return <div>Loading...</div>; // Or a proper spinner component
  }

  return (
    <SessionContext.Provider value={{ session }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  return useContext(SessionContext);
};