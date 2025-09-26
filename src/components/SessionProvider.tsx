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
const ChampionshipDetail = lazy(() => import("@/pages/ChampionshipDetail"));
const ChampionshipTheme = lazy(() => import("@/pages/ChampionshipTheme"));
const Profile = lazy(() => import("@/pages/Profile"));
const UserManagement = lazy(() => import("@/pages/UserManagement"));
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
      return null;
    }
    console.log('SessionProvider: User profile fetched:', data);
    return data as UserProfile;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!isMounted) return;

      console.log('SessionProvider: onAuthStateChange event:', _event, 'session:', currentSession);
      setSession(currentSession);

      let profile: UserProfile | null = null;
      if (currentSession?.user) {
        profile = await fetchUserProfile(currentSession.user.id);
      }
      if (isMounted) setUserProfile(profile);
      
      // Set loading to false directly after processing the session
      if (isMounted) {
        setLoading(false);
        console.log('SessionProvider: Loading set to false.');
      }
    });

    // Cleanup function
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]); // fetchUserProfile is stable due to useCallback

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

const LoadingSpinner = () => (
  <div className="flex h-screen items-center justify-center bg-background text-foreground">
    <p className="text-lg font-medium">Carregando aplicativo...</p>
  </div>
);

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
          <Route path="/public/round/:championshipId/:roundId/:roundToken" element={<PublicRoundScoreboard />} /> {/* New public route */}
          
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/official-dashboard" element={<OfficialDashboard />} />
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