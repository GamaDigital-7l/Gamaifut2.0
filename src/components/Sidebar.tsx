import { Link, useLocation } from "react-router-dom";
import { Trophy, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChampionshipTheme } from "@/contexts/ThemeContext"; // Import the hook

const Sidebar = () => {
  const location = useLocation();
  const { currentTheme } = useChampionshipTheme(); // Get the current theme

  const navLinks = [
    {
      href: "/dashboard",
      icon: <Home className="h-4 w-4" />,
      label: "Dashboard",
    },
  ];

  // Function to close the sheet (used for navigation links)
  const closeSheet = () => {
    const sheetCloseButton = document.getElementById('sheet-close-button');
    if (sheetCloseButton) {
      sheetCloseButton.click();
    }
  };

  return (
    <div className="hidden border-r md:flex h-full max-h-screen flex-col gap-2" style={{ // Modified className
      backgroundColor: currentTheme?.theme_bg ? `hsl(${currentTheme.theme_bg})` : 'hsl(var(--sidebar-background))',
      borderColor: currentTheme?.theme_primary ? `hsl(${currentTheme.theme_primary})` : 'hsl(var(--sidebar-border))'
    }}>
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6" style={{
          borderColor: currentTheme?.theme_primary ? `hsl(${currentTheme.theme_primary})` : 'hsl(var(--sidebar-border))'
        }}>
          <Link to="/" className="flex items-center gap-2 font-semibold" style={{
            color: currentTheme?.theme_text ? `hsl(${currentTheme.theme_text})` : 'hsl(var(--sidebar-foreground))'
          }} onClick={closeSheet}>
            <Trophy className="h-6 w-6" />
            <span>ChampManager</span>
          </Link>
        </div>
      <div className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                location.pathname === link.href 
                  ? "bg-muted text-primary" 
                  : "text-muted-foreground hover:text-primary"
              )}
              style={{
                color: location.pathname === link.href 
                  ? (currentTheme?.theme_primary ? `hsl(${currentTheme.theme_primary})` : 'hsl(var(--sidebar-primary))') 
                  : (currentTheme?.theme_text ? `hsl(${currentTheme.theme_text})` : 'hsl(var(--sidebar-foreground))'),
                backgroundColor: location.pathname === link.href 
                  ? (currentTheme?.theme_secondary ? `hsl(${currentTheme.theme_secondary})` : 'hsl(var(--sidebar-accent))') 
                  : 'transparent',
              }}
              onClick={closeSheet} // Close sheet on navigation
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;