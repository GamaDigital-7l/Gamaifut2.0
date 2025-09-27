import { createContext, useState, useEffect, useContext, Suspense, lazy, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';

// Lazy load pages
const Index = lazy(() => import("@/pages/Index"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const OfficialDashboard = lazy(() => import("@/pages/OfficialDashboard")); // Import new OfficialDashboard
const OfficialChampionshipMatches = lazy(() => import("@/pages/OfficialChampionshipMatches")); // NEW: Import OfficialChampionshipMatches
const ChampionshipDetail = lazy(() => import("@/pages/ChampionshipDetail"));
const ChampionshipTheme = lazy(() => import("@/pages/ChampionshipTheme"));
const Profile = lazy(() => import("@/pages/Profile"));
const UserManagement = lazy(() => import("@/pages/UserManagement"));
const TopScorers = lazy(() => import("@/pages/TopScorers")); // NEW: Import TopScorers page
const AdminTeamDetail = lazy(() => import("@/pages/AdminTeamDetail"));
const PublicChampionshipView = lazy(() => import("@/pages/PublicChampionshipView"));
const PublicTeamDetail = lazy(() => import("@/pages/PublicTeamDetail"));
const PublicRoundScoreboard = lazy(() => import("@/pages/PublicRoundScoreboard")); // Import new PublicRoundScoreboard
const MainLayout = lazy(() => import("@/components/MainLayout"));


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
  const [loading, setLoading] = useState(true); // Start true

  const fetchUserProfile = useCallback(async (userId: string) => {
    console.log('SessionProvider: Attempting to fetch user profile for ID:', userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('SessionProvider: Error fetching user profile:', error);
      // Retornar null para indicar que o perfil não foi carregado
      return null;
    }
    console.log('SessionProvider: User profile fetched:', data);
    return data as UserProfile;
  }, []);

  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component
    console.log('SessionProvider: useEffect mounted.');

    const handleAuthStateChange = async (_event: string, currentSession: Session | null) => {
      if (!isMounted) {
        console.log('SessionProvider: handleAuthStateChange called on unmounted component, skipping.');
        return;
      }

      console.log('SessionProvider: onAuthStateChange event:', _event, 'session:', currentSession ? 'present' : 'null');
      setLoading(true); // Set loading to true at the start of any auth state change processing

      setSession(currentSession);

      let profile: UserProfile | null = null;
      if (currentSession?.user) {
        console.log('SessionProvider: User found in session, fetching profile...');
        profile = await fetchUserProfile(currentSession.user.id);
      } else {
        console.log('SessionProvider: No user in session.');
      }
      
      if (isMounted) {
        setUserProfile(profile);
        console.log('SessionProvider: User profile set:', profile);
      }
      
      setLoading(false); // Set loading to false after all async operations are complete
      console.log('SessionProvider: Loading set to false after auth state change.');
    };

    console.log('SessionProvider: Calling supabase.auth.getSession()...');
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log('SessionProvider: supabase.auth.getSession() returned. Initial session:', initialSession ? 'present' : 'null');
      if (isMounted) {
        handleAuthStateChange('INITIAL_SESSION', initialSession);
      }
    }).catch(err => {
      console.error('SessionProvider: Error in supabase.auth.getSession():', err);
      if (isMounted) {
        setSession(null); // Ensure session is null on error
        setUserProfile(null); // Ensure profile is null on error
        setLoading(false); // Ensure loading is false even if initial session fetch fails
        console.log('SessionProvider: Loading set to false after initial session fetch error.');
      }
    });

    console.log('SessionProvider: Setting up onAuthStateChange listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    console.log('SessionProvider: onAuthStateChange listener set up.');

    // Cleanup function
    return () => {
      isMounted = false;
      console.log('SessionProvider: useEffect unmounted, unsubscribing from auth state changes.');
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]); // fetchUserProfile is the only dependency

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
    if (loading) {
      console.log('Redirects: Still loading, skipping redirects.');
      return; // Don't redirect while loading
    }

    const isPublicRoute = location.pathname.startsWith('/public/');
    const isLoginRoute = location.pathname === '/login';
    const isIndexRoute = location.pathname === '/';

    if (!session && !isPublicRoute && !isLoginRoute && !isIndexRoute) {
      console.log('Redirects: No session, not public/login/index. Redirecting to /login');
      navigate('/login');
    } else if (session && isLoginRoute) {
      console.log('Redirects: Has session, on login page. Redirecting to /dashboard');
      navigate('/dashboard');
    } else {
      console.log('Redirects: No redirect needed for current state.');
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

const LoadingSpinner = () => {
  console.log('LoadingSpinner: Rendering...');
  return (
    <div className="flex h-screen items-center justify-center bg-background text-foreground">
      <p className="text-lg font-medium">Carregando aplicativo...</p>
    </div>
  );
};

// We need to wrap the Routes with a component that can use the context
export const AppRoutes = () => {
  const { loading } = useSession();
  console.log('AppRoutes: Current loading state:', loading);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <AppRedirects />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/public/championship/:id" element={<PublicChampionshipView />} />
          <Route path="/public/team/:teamId" element={<PublicTeamDetail />} />
          <Route path="/public/round/:championshipId/:roundId/:roundToken" element={<PublicRoundScoreboard />} />
          
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/official-dashboard" element={<OfficialDashboard />} />
            <Route path="/official-championship-matches/:id" element={<OfficialChampionshipMatches />} /> {/* NEW ROUTE */}
            <Route path="/top-scorers" element={<TopScorers />} /> {/* NEW ROUTE */}
            <Route path="/championship/:id" element={<ChampionshipDetail />} />
            <Route path="/championship/:id/theme" element={<ChampionshipTheme />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/team/:teamId" element={<AdminTeamDetail />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}