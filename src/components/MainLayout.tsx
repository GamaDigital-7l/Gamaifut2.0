import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useChampionshipTheme } from "@/contexts/ThemeContext"; // Import the hook

const MainLayout = () => {
  const { currentTheme } = useChampionshipTheme(); // Get the current theme

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <div className="flex flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6" style={{ 
          backgroundColor: currentTheme?.theme_bg ? `hsl(${currentTheme.theme_bg})` : 'hsl(var(--background))',
          color: currentTheme?.theme_text ? `hsl(${currentTheme.theme_text})` : 'hsl(var(--foreground))'
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;