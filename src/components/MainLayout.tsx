import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
// Removed useChampionshipTheme as it's no longer needed for main layout colors
import { cn } from "@/lib/utils"; // Import cn for conditional classes

const MainLayout = () => {
  // Removed currentTheme from useChampionshipTheme
  const [isCollapsed, setIsCollapsed] = useState(false); // State for sidebar collapse

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div 
      className={cn(
        "grid min-h-screen w-full",
        isCollapsed ? "md:grid-cols-[var(--sidebar-width-collapsed)_1fr]" : "md:grid-cols-[var(--sidebar-width-expanded)_1fr]"
      )}
      style={{
        gridTemplateColumns: isCollapsed 
          ? 'var(--sidebar-width-collapsed) 1fr' 
          : 'var(--sidebar-width-expanded) 1fr',
        transition: 'grid-template-columns 0.2s ease-out', // Smooth transition
      }}
    >
      <Sidebar isCollapsed={isCollapsed} toggleCollapsed={toggleCollapsed} />
      <div className="flex flex-col">
        <Header toggleSidebar={toggleCollapsed} /> {/* Pass toggle function to Header */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background text-foreground">
            <Outlet />
          </main>
      </div>
    </div>
  );
};

export default MainLayout;