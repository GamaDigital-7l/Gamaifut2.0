import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: string;
}

interface SessionContextType {
  session: Session | null;
  userProfile: UserProfile | null;
}

const SessionContext = createContext<SessionContextType>({ session: null, userProfile: null });

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
    } else {
      setUserProfile(data as UserProfile);
    }
  };

  useEffect(() => {
    const getSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
      setLoading(false);
    };

    getSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await fetchUserProfile(session.user.id);
        if (_event === 'SIGNED_IN' && location.pathname !== '/dashboard') {
          navigate('/dashboard');
        }
      } else {
        setUserProfile(null);
        // Do not redirect to login if on a public page
        if (_event === 'SIGNED_OUT' && location.pathname !== '/login' && !location.pathname.startsWith('/public/')) {
          navigate('/login');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  useEffect(() => {
    const isPublicRoute = location.pathname.startsWith('/public/');
    const isLoginRoute = location.pathname === '/login';
    const isIndexRoute = location.pathname === '/';

    if (!loading && !session && !isPublicRoute && !isLoginRoute && !isIndexRoute) {
      navigate('/login');
    }
    if (!loading && session && isLoginRoute) {
      navigate('/dashboard');
    }
  }, [session, loading, navigate, location.pathname]);

  if (loading) {
    return <div>Carregando...</div>; // Or a proper spinner component
  }

  return (
    <SessionContext.Provider value={{ session, userProfile }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  return useContext(SessionContext);
};