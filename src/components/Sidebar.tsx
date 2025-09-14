import { Link, useLocation } from "react-router-dom";
import { Trophy, Home, ChevronLeft, ChevronRight, Users, ClipboardList } from "lucide-react"; // Import Users and ClipboardList icons
import { cn } from "@/lib/utils";
import { useChampionshipTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { useSession } from '@/components/SessionProvider'; // Import useSession

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
}

const Sidebar = ({ isCollapsed, toggleCollapsed }: SidebarProps) => {
  const location = useLocation();
  const { currentTheme } = useChampionshipTheme();
  const { userProfile } = useSession(); // Get user profile from session

  const navLinks = [
    {
      href: "/dashboard",
      icon: <Home className="h-4 w-4" />,
      label: "Dashboard",
      roles: ['user', 'official', 'admin'], // Visible to all authenticated users
    },
    {
      href: "/users", // Updated href
      icon: <Users className="h-4 w-4" />,
      label: "Gerenciar Usuários", // Updated label
      roles: ['admin'], // Only visible to admins
    },
    {
      href: "/official-dashboard",
      icon: <ClipboardList className="h-4 w-4" />,
      label: "Painel do Mesário",
      roles: ['official', 'admin'], // Visible to officials and admins
    },
  ];

  const closeSheet = () => {
    const sheetCloseButton = document.getElementById('sheet-close-button');
    if (sheetCloseButton) {
      sheetCloseButton.click();
    }
  };

  return (
    <div 
      className={cn(
        "hidden border-r md:flex h-full max-h-screen flex-col gap-2 transition-all duration-200 ease-out",
        isCollapsed ? "w-[var(--sidebar-width-collapsed)]" : "w-[var(--sidebar-width-expanded)]"
      )}
      style={{
        backgroundColor: currentTheme?.theme_bg ? `hsl(${currentTheme.theme_bg})` : 'hsl(var(--sidebar-background))',
        borderColor: currentTheme?.theme_primary ? `hsl(${currentTheme.theme_primary})` : 'hsl(var(--sidebar-border))'
      }}
    >
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6" style={{
          borderColor: currentTheme?.theme_primary ? `hsl(${currentTheme.theme_primary})` : 'hsl(var(--sidebar-border))'
        }}>
          <Link to="/" className="flex items-center gap-2 font-semibold" style={{
            color: currentTheme?.theme_text ? `hsl(${currentTheme.theme_text})` : 'hsl(var(--sidebar-foreground))'
          }} onClick={closeSheet}>
            <Trophy className="h-6 w-6" />
            {!isCollapsed && <span>ChampManager</span>}
          </Link>
        </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navLinks.map((link) => (
            // Only render link if user has the required role
            userProfile?.role && link.roles.includes(userProfile.role) && (
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
                  justifyContent: isCollapsed ? 'center' : 'flex-start', // Center icon when collapsed
                }}
                onClick={closeSheet}
              >
                {link.icon}
                {!isCollapsed && link.label}
              </Link>
            )
          ))}
        </nav>
      </div>
      <div className="mt-auto p-2 border-t" style={{
        borderColor: currentTheme?.theme_primary ? `hsl(${currentTheme.theme_primary})` : 'hsl(var(--sidebar-border))'
      }}>
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-full" 
          onClick={toggleCollapsed}
          style={{
            color: currentTheme?.theme_text ? `hsl(${currentTheme.theme_text})` : 'hsl(var(--sidebar-foreground))',
          }}
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          <span className="sr-only">{isCollapsed ? 'Expandir Sidebar' : 'Recolher Sidebar'}</span>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;