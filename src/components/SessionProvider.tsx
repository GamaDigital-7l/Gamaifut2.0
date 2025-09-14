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
  loading: boolean; // Expose loading state
}

const SessionContext = createContext<SessionContextType>({ session: null, userProfile: null, loading: true });

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    return data as UserProfile;
  };

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUserProfile(profile);
      }
      setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SessionContext.Provider value={{ session, userProfile, loading }}>
      {children}
    </SessionContext.Provider>
  );
};

// Custom hook to handle redirects based on session state
const useRedirects = () => {
  const { session, loading } = useContext(SessionContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return; // Don't redirect while loading

    const isPublicRoute = location.pathname.startsWith('/public/');
    const isLoginRoute = location.pathname === '/login';
    const isIndexRoute = location.pathname === '/';

    if (!session && !isPublicRoute && !isLoginRoute && !isIndexRoute) {
      navigate('/login');
    }
    if (session && isLoginRoute) {
      navigate('/dashboard');
    }
  }, [session, loading, navigate, location.pathname]);
};

// A component that uses the redirect hook, to be placed inside the router
const AppRedirects = () => {
  useRedirects();
  return null;
};

export const useSession = () => {
  return useContext(SessionContext);
};

// We need to wrap the Routes with a component that can use the context
const AppRoutes = () => {
  const { loading } = useSession();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  return (
    <>
      <AppRedirects />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/public/championship/:id" element={<PublicChampionshipView />} />
        <Route path="/public/team/:teamId" element={<PublicTeamDetail />} />
        
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/championship/:id" element={<ChampionshipDetail />} />
          <Route path="/championship/:id/theme" element={<ChampionshipTheme />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/official-dashboard" element={<OfficialDashboard />} />
          <Route path="/team/:teamId" element={<AdminTeamDetail />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}