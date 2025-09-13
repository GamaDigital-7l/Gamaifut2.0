import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Gerenciador de Campeonatos</h1>
        <p className="text-xl text-gray-600 mb-8">
          Crie e gerencie seus campeonatos de futebol de forma fácil e intuitiva.
        </p>
        <Link to="/login">
          <Button size="lg">Acessar Painel</Button>
        </Link>
      </div>
      <div className="absolute bottom-0">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;