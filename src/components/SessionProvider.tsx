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
// Removed MatchSimulator import as it's no longer a standalone page
// const MatchSimulator = lazy(() => import("@/pages/MatchSimulator")); 

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

// Minimum time the loading spinner should be visible to prevent flashes
const MIN_LOADING_TIME = 300; // milliseconds
const LOADING_TIMEOUT_MS = 15000; // 15 seconds before showing reload prompt

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  let isMounted = true; // Flag to prevent state updates on unmounted component
  let loadingTimer: number;
  let timeoutId: number; // For the loading timeout
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // Start true
  const [showReloadPrompt, setShowReloadPrompt] = useState(false); // New state for reload prompt

  const fetchUserProfile = useCallback(async (userId: string) => {
    console.log('SessionProvider: Attempting to fetch user profile for ID:', userId);
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, role')
        .eq('id', userId)
        .single();

      if (error && status !== 406) { // 406 means no row found, which is not an error for .single()
        console.error('SessionProvider: Error fetching user profile:', error);
        return null;
      }

      if (data) {
        console.log('SessionProvider: User profile fetched:', data);
        return data as UserProfile;
      } else {
        console.log('SessionProvider: No user profile found for ID:', userId, 'Status:', status);
        return null;
      }
    } catch (err: any) {
      console.error('SessionProvider: Unexpected error in fetchUserProfile:', err.message);
      return null;
    } finally {
      console.log('SessionProvider: fetchUserProfile finished for ID:', userId); // Added log
    }
  }, []);

  useEffect(() => {
    console.log('SessionProvider: useEffect mounted.');
    setLoading(true); // Ensure loading is true when component mounts
    setShowReloadPrompt(false); // Reset reload prompt on mount

    const finalizeLoading = () => {
      if (isMounted) {
        setLoading(false);
        window.clearTimeout(timeoutId); // Clear the loading timeout
        console.log('SessionProvider: Loading set to false after all async operations and min time.');
      }
    };

    const handleAuthStateChange = async (_event: string, currentSession: Session | null) => {
      if (!isMounted) {
        console.log('SessionProvider: handleAuthStateChange called on unmounted component, skipping.');
        return;
      }

      console.log('SessionProvider: onAuthStateChange event:', _event, 'session:', currentSession ? 'present' : 'null');
      
      const startTime = Date.now();

      try {
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
      } catch (err: any) {
        console.error('SessionProvider: Unexpected error in handleAuthStateChange:', err.message);
        if (isMounted) {
          setSession(null);
          setUserProfile(null);
        }
      } finally {
        // Ensure loading is false after a minimum time
        const elapsedTime = Date.now() - startTime;
        const remainingTime = MIN_LOADING_TIME - elapsedTime;

        if (remainingTime > 0) {
          loadingTimer = window.setTimeout(finalizeLoading, remainingTime); // Use window.setTimeout
        } else {
          finalizeLoading();
        }
      }
    };

    console.log('SessionProvider: Setting up onAuthStateChange listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    console.log('SessionProvider: onAuthStateChange listener set up.');

    // Set a timeout to show the reload prompt if loading takes too long
    timeoutId = window.setTimeout(() => {
      if (isMounted && loading) { // Only show if still loading
        console.log('SessionProvider: Loading timeout reached. Showing reload prompt.');
        setShowReloadPrompt(true);
      }
    }, LOADING_TIMEOUT_MS);

    // Cleanup function
    return () => {
      isMounted = false;
      window.clearTimeout(loadingTimer); // Use window.clearTimeout
      window.clearTimeout(timeoutId); // Clear the loading timeout
      console.log('SessionProvider: useEffect unmounted, unsubscribing from auth state changes.');
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, loading]); // Add 'loading' to dependencies to re-evaluate timeout if loading state changes

  const handleReloadApp = () => {
    console.log('SessionProvider: Reload App button clicked. Forcing full reload.');
    window.location.reload(true); // true forces a reload from the server, bypassing cache
  };

  return (
    <SessionContext.Provider value={{ session, userProfile, loading }}>
      {children}
      {showReloadPrompt && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4 text-center">
          <p className="text-lg font-medium mb-4">O aplicativo está demorando para carregar.</p>
          <button
            onClick={handleReloadApp}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md shadow-lg hover:bg-primary/90 transition-colors"
          >
            Recarregar Aplicativo
          </button>
        </div>
      )}
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
    // Removed isMatchSimulatorRoute check as it's no longer a standalone route
    // const isMatchSimulatorRoute = location.pathname === '/match-simulator'; 

    if (!session && !isPublicRoute && !isLoginRoute && !isIndexRoute) { // UPDATED: Removed match simulator
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
    <div className="fixed inset-0 flex h-screen items-center justify-center bg-background text-foreground z-50">
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
          {/* Removed MatchSimulator route */}
          
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/official-dashboard" element={<OfficialDashboard />} />
            <Route path="/official-championship-matches/:id" element={<OfficialChampionshipMatches />} />
            <Route path="/top-scorers" element={<TopScorers />} />
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