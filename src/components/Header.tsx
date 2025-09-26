import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CircleUser, Menu, Sun, Moon } from "lucide-react"; // Added Sun, Moon icons
import { supabase } from "@/integrations/supabase/client";
import { useChampionshipTheme } from "@/contexts/ThemeContext";
import Sidebar from "./Sidebar";

interface HeaderProps {
  toggleSidebar?: () => void; // Optional prop for toggling sidebar
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  const navigate = useNavigate();
  const { globalThemeMode, toggleGlobalThemeMode } = useChampionshipTheme();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0 bg-sidebar-background border-sidebar-border">
          {/* Pass isCollapsed and toggleCollapsed to Sidebar within SheetContent for mobile */}
          <Sidebar isCollapsed={false} toggleCollapsed={() => { /* No-op for mobile sheet */ }} isMobileSheet={true} /> 
          <Button id="sheet-close-button" className="hidden" />
        </SheetContent>
      </Sheet>
      <div className="w-full flex-1">
        {/* Pode adicionar um search bar aqui no futuro */}
      </div>
      <Button variant="ghost" size="icon" onClick={toggleGlobalThemeMode}>
        {globalThemeMode === 'dark' ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <CircleUser className="h-5 w-5" />
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/profile">Perfil</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default Header;