import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CreateChampionshipDialog } from '@/components/CreateChampionshipDialog';
import { EditChampionshipDialog } from '@/components/EditChampionshipDialog';
import { DeleteChampionshipDialog } from '@/components/DeleteChampionshipDialog';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from 'lucide-react';

type Championship = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

const Dashboard = () => {
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChampionships = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('championships')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching championships:', error);
    } else if (data) {
      setChampionships(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchChampionships();
  }, []);

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Meus Campeonatos</h1>
        <CreateChampionshipDialog onChampionshipCreated={fetchChampionships} />
      </div>

      {loading ? (
        <p>Carregando campeonatos...</p>
      ) : championships.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <p className="text-gray-500">Você ainda não criou nenhum campeonato.</p>
          <p className="text-gray-500 mt-2">Clique em "Criar Campeonato" para começar.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {championships.map((championship) => (
            <Card key={championship.id} className="flex flex-col justify-between">
              <CardHeader>
                <CardTitle>{championship.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{championship.description || 'Sem descrição.'}</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/championship/${championship.id}`}>Ver Detalhes</Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <EditChampionshipDialog championship={championship} onChampionshipUpdated={fetchChampionships}>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Editar</DropdownMenuItem>
                    </EditChampionshipDialog>
                    <DeleteChampionshipDialog championship={championship} onChampionshipDeleted={fetchChampionships}>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">Excluir</DropdownMenuItem>
                    </DeleteChampionshipDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};

export default Dashboard;