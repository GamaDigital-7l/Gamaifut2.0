import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';

export const PublicHeader = () => {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <Link to="/" className="flex items-center gap-2 font-semibold">
        <Trophy className="h-6 w-6" />
        <span className="">ChampManager</span>
      </Link>
      <Link to="/login">
        <Button variant="outline">Acessar Painel</Button>
      </Link>
    </header>
  );
};