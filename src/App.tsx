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
import TeamDetail from "./pages/TeamDetail";
import PublicChampionshipView from "./pages/PublicChampionshipView"; // New import
import { SessionProvider } from "./components/SessionProvider";
import MainLayout from "./components/MainLayout";
import { ThemeProvider } from "./contexts/ThemeContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionProvider>
          <ThemeProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/public/championship/:id" element={<PublicChampionshipView />} /> {/* New public route */}
              
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/championship/:id" element={<ChampionshipDetail />} />
                <Route path="/championship/:id/theme" element={<ChampionshipTheme />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/official-dashboard" element={<OfficialDashboard />} />
                <Route path="/team/:teamId" element={<TeamDetail />} />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ThemeProvider>
        </SessionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;