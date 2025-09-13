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

  return (
    <div className="hidden border-r bg-muted/40 md:block" style={{
      backgroundColor: currentTheme?.theme_bg || 'var(--sidebar-background)',
      borderColor: currentTheme?.theme_primary || 'var(--sidebar-border)'
    }}>
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6" style={{
          borderColor: currentTheme?.theme_primary || 'var(--sidebar-border)'
        }}>
          <Link to="/" className="flex items-center gap-2 font-semibold" style={{
            color: currentTheme?.theme_text || 'var(--sidebar-foreground)'
          }}>
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
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  location.pathname === link.href && "bg-muted text-primary"
                )}
                style={{
                  color: location.pathname === link.href 
                    ? (currentTheme?.theme_primary || 'var(--sidebar-primary)') 
                    : (currentTheme?.theme_text || 'var(--sidebar-foreground)'),
                  backgroundColor: location.pathname === link.href 
                    ? (currentTheme?.theme_secondary || 'var(--sidebar-accent)') 
                    : 'transparent',
                }}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;