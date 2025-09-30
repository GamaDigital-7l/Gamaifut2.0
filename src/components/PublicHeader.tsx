import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trophy, Calculator } from 'lucide-react'; // Added Calculator icon

export const PublicHeader = () => {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <Link to="/" className="flex items-center gap-2 font-semibold">
        <Trophy className="h-6 w-6" />
        <span className="">Gama Creative Fut</span>
      </Link>
      <div className="flex items-center gap-2">
        <Link to="/match-simulator"> {/* UPDATED: Link to new MatchSimulator route */}
          <Button variant="ghost" className="text-foreground flex items-center gap-1">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Simular Resultados</span>
          </Button>
        </Link>
        <Link to="/login">
          <Button variant="outline" className="text-foreground">Acessar Painel</Button>
        </Link>
      </div>
    </header>
  );
};