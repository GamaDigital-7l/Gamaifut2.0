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
import Officials from "./pages/Officials";
import OfficialDashboard from "./pages/OfficialDashboard";
import TeamDetail from "./pages/TeamDetail"; // Import the new TeamDetail page
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
              
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/championship/:id" element={<ChampionshipDetail />} />
                <Route path="/championship/:id/theme" element={<ChampionshipTheme />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/officials" element={<Officials />} />
                <Route path="/official-dashboard" element={<OfficialDashboard />} />
                <Route path="/team/:teamId" element={<TeamDetail />} /> {/* New route for Team Detail */}
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