import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ChampionshipDetail from "./pages/ChampionshipDetail";
import ChampionshipTheme from "./pages/ChampionshipTheme";
import Profile from "./pages/Profile";
import UserManagement from "./pages/UserManagement";
import OfficialDashboard from "./pages/OfficialDashboard";
import AdminTeamDetail from "./pages/AdminTeamDetail";
import PublicChampionshipView from "./pages/PublicChampionshipView";
import PublicTeamDetail from "./pages/PublicTeamDetail";
import { SessionProvider, useSession } from "./components/SessionProvider";
import MainLayout from "./components/MainLayout";
import { ThemeProvider } from "./contexts/ThemeContext";

const queryClient = new QueryClient();

// A new component to handle routes, which can be placed inside SessionProvider
const AppRoutes = () => {
  const { loading } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const isPublicRoute = location.pathname.startsWith('/public/');
    const isLoginRoute = location.pathname === '/login';
    const isIndexRoute = location.pathname === '/';
    const { session } = supabase.auth.getSession().data;


    if (!session && !isPublicRoute && !isLoginRoute && !isIndexRoute) {
      navigate('/login');
    }
    if (session && isLoginRoute) {
      navigate('/dashboard');
    }
  }, [loading, navigate, location.pathname]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  return (
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
  );
};


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ThemeProvider>
          <SessionProvider>
            <AppRoutes />
          </SessionProvider>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;