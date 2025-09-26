import React from 'react'; // Importar React
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Championship } from '@/types';

const fetchChampionships = async () => {
  const { data, error } = await supabase
    .from('championships')
    .select('id, name, description, city, state, logo_url, user_id, points_for_win, sport_type, gender, age_category, tie_breaker_order')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

const Dashboard = () => {
  const queryClient = useQueryClient();
  const { data: championships = [], isLoading } = useQuery<Championship[]>({
    queryKey: ['championships'],
    queryFn: fetchChampionships,
  });

  const handleChampionshipChange = () => {
    queryClient.invalidateQueries({ queryKey: ['championships'] });
  };

  // No need for useMemo here as the data is already memoized by react-query and not filtered/transformed further in this component.

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Meus Campeonatos</h1>
        <div className="flex gap-2">
          <CreateChampionshipDialog onChampionshipCreated={handleChampionshipChange} />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="flex flex-col justify-between">
              <CardHeader><Skeleton className="h-6 w-3/4 mb-2" /></CardHeader>
              <CardContent className="flex-grow"><Skeleton className="h-4 w-full mb-1" /><Skeleton className="h-4 w-5/6" /></CardContent>
              <CardFooter className="flex justify-between items-center"><Skeleton className="h-8 w-24" /><Skeleton className="h-8 w-8 rounded-full" /></CardFooter>
            </Card>
          ))}
        </div>
      ) : championships.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <p className="text-gray-500">Você ainda não criou nenhum campeonato.</p>
          <p className="text-gray-500 mt-2">Clique em "Criar Campeonato" para começar.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {championships.map((championship) => (
            <Card key={championship.id} className="flex flex-col justify-between">
              <CardHeader><CardTitle>{championship.name}</CardTitle></CardHeader>
              <CardContent className="flex-grow"><p className="text-sm text-muted-foreground line-clamp-3">{championship.description || 'Sem descrição.'}</p></CardContent>
              <CardFooter className="flex justify-between items-center">
                <Button asChild variant="outline" size="sm"><Link to={`/championship/${championship.id}`}>Ver Detalhes</Link></Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <EditChampionshipDialog championship={championship} onChampionshipUpdated={handleChampionshipChange}>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Editar</DropdownMenuItem>
                    </EditChampionshipDialog>
                    <DeleteChampionshipDialog championship={championship} onChampionshipDeleted={handleChampionshipChange}>
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