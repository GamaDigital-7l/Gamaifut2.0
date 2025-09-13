import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { CreateTeamDialog } from '@/components/CreateTeamDialog';
import { EditTeamDialog } from '@/components/EditTeamDialog';
import { DeleteTeamDialog } from '@/components/DeleteTeamDialog';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Championship = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

type Team = {
  id: string;
  name: string;
  created_at: string;
};

const ChampionshipDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('championship_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching teams:', error);
      setError('Erro ao carregar os times.');
    } else {
      setTeams(data);
    }
  }, [id]);

  useEffect(() => {
    const fetchChampionship = async () => {
      if (!id) {
        setError('ID do campeonato não encontrado.');
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error: champError } = await supabase
        .from('championships')
        .select('*')
        .eq('id', id)
        .single();

      if (champError) {
        console.error('Error fetching championship:', champError);
        setError('Campeonato não encontrado ou erro ao carregar.');
        setChampionship(null);
      } else {
        setChampionship(data);
        await fetchTeams();
        setError(null);
      }
      setLoading(false);
    };

    fetchChampionship();
  }, [id, fetchTeams]);

  if (loading) {
    return <div className="p-8">Carregando detalhes do campeonato...</div>;
  }

  if (error && !championship) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button asChild>
          <Link to="/dashboard">Voltar para o Dashboard</Link>
        </Button>
      </div>
    );
  }

  if (!championship) {
    return (
       <div className="p-8 text-center">
        <p className="mb-4">Campeonato não encontrado.</p>
        <Button asChild>
          <Link to="/dashboard">Voltar para o Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link to="/dashboard" className="flex items-center gap-2">
            <ArrowLeft size={16} />
            Voltar para o Dashboard
          </Link>
        </Button>
      </div>
      
      <div className="mb-8">
        <h1 className="text-4xl font-bold">{championship.name}</h1>
        <p className="text-lg text-muted-foreground mt-2">{championship.description || 'Sem descrição.'}</p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Times</h2>
          <CreateTeamDialog championshipId={championship.id} onTeamCreated={fetchTeams} />
        </div>
        {teams.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-gray-500">Ainda não há times neste campeonato.</p>
            <p className="text-gray-500 mt-2">Clique em "Adicionar Time" para começar.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {teams.map((team) => (
              <Card key={team.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{team.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <EditTeamDialog team={team} onTeamUpdated={fetchTeams}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          Editar
                        </DropdownMenuItem>
                      </EditTeamDialog>
                      <DeleteTeamDialog team={team} onTeamDeleted={fetchTeams}>
                         <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                          Excluir
                        </DropdownMenuItem>
                      </DeleteTeamDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChampionshipDetail;