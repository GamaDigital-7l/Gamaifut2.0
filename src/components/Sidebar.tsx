import { Link, useLocation } from "react-router-dom";
import { Trophy, Home, ChevronLeft, ChevronRight, Users } from "lucide-react"; // Removed ClipboardList icon
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSession } from '@/components/SessionProvider'; // Import useSession

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
}

const Sidebar = ({ isCollapsed, toggleCollapsed }: SidebarProps) => {
  const location = useLocation();
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
    // Removed the "Painel do Mesário" link
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
        "hidden border-r bg-sidebar-background text-sidebar-foreground md:flex h-full max-h-screen flex-col gap-2 transition-all duration-200 ease-out",
        isCollapsed ? "w-[var(--sidebar-width-collapsed)]" : "w-[var(--sidebar-width-expanded)]"
      )}
    >
      <div className="flex h-14 items-center border-b border-sidebar-border px-4 lg:h-[60px] lg:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold text-sidebar-foreground" onClick={closeSheet}>
            <Trophy className="h-6 w-6" />
            {!isCollapsed && <span>Gama Creative Fut</span>}
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
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "text-sidebar-foreground hover:text-sidebar-primary"
                )}
                style={{
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
      <div className="mt-auto p-2 border-t border-sidebar-border">
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-full text-sidebar-foreground" 
          onClick={toggleCollapsed}
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          <span className="sr-only">{isCollapsed ? 'Expandir Sidebar' : 'Recolher Sidebar'}</span>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;