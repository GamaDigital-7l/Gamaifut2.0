import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { cn } from "@/lib/utils";

const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div 
      className={cn(
        "grid min-h-screen w-full transition-[grid-template-columns] duration-200 ease-out",
        isCollapsed 
          ? "md:grid-cols-[var(--sidebar-width-collapsed)_1fr]" 
          : "md:grid-cols-[var(--sidebar-width-expanded)_1fr]"
      )}
    >
      <Sidebar isCollapsed={isCollapsed} toggleCollapsed={toggleCollapsed} />
      <div className="flex flex-col overflow-hidden"> {/* Added overflow-hidden to prevent content from breaking layout */}
        <Header toggleSidebar={toggleCollapsed} />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background text-foreground overflow-auto"> {/* Added overflow-auto for scrolling */}
            <Outlet />
          </main>
      </div>
    </div>
  );