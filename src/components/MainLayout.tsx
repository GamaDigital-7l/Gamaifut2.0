import { Outlet } from "react-router-dom";
import Header from "./Header";
import { useChampionshipTheme } from "@/contexts/ThemeContext"; // Import the hook

const MainLayout = () => {
  const { currentTheme } = useChampionshipTheme(); // Get the current theme

  return (
    <div className="flex min-h-screen w-full flex-col"> {/* Removed grid layout for fixed sidebar */}
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6" style={{ 
          backgroundColor: currentTheme?.theme_bg ? `hsl(${currentTheme.theme_bg})` : 'hsl(var(--background))',
          color: currentTheme?.theme_text ? `hsl(${currentTheme.theme_text})` : 'hsl(var(--foreground))'
        }}>
          <Outlet />
        </main>
    </div>
  );
};

export default MainLayout;