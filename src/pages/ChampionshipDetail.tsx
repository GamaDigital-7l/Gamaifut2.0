import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Swords, Palette } from 'lucide-react'; // Import Palette icon
import { CreateTeamDialog } from '@/components/CreateTeamDialog';
import { EditTeamDialog } from '@/components/EditTeamDialog';
import { DeleteTeamDialog } from '@/components/DeleteTeamDialog';
import { CreateMatchDialog } from '@/components/CreateMatchDialog';
import { EditMatchDialog } from '@/components/EditMatchDialog';
import { DeleteMatchDialog } from '@/components/DeleteMatchDialog';
import { GenerateMatchesDialog } from '@/components/GenerateMatchesDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaderboard } from '@/components/Leaderboard';
import { SponsorsTab } from '@/components/SponsorsTab';
import { SponsorDisplay } from '@/components/SponsorDisplay'; // Import the new component

type Championship = {
  id: string;
  name: string;
  description: string | null;
};

type Team = {
  id: string;
  name: string;
};

type Match = {
  id: string;
  team1_id: string;
  team2_id: string;
  team1_score: number | null;
  team2_score: number | null;
  team1: { name: string };
  team2: { name: string };
};

const ChampionshipDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const { data: champData, error: champError } = await supabase
      .from('championships')
      .select('*')
      .eq('id', id)
      .single();

    if (champError) {
      console.error('Error fetching championship:', champError);
      setError('Campeonato não encontrado ou erro ao carregar.');
      setLoading(false);
      return;
    }
    setChampionship(champData);

    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .eq('championship_id', id)
      .order('created_at', { ascending: true });

    if (teamsError) {
      console.error('Error fetching teams:', teamsError);
      setError('Erro ao carregar os times.');
    } else {
      setTeams(teamsData);
    }

    const { data: matchesData, error: matchesError } = await supabase
      .from('matches')
      .select(`
        id,
        team1_id,
        team2_id,
        team1_score,
        team2_score,
        team1:teams!matches_team1_id_fkey(name),
        team2:teams!matches_team2_id_fkey(name)
      `)
      .eq('championship_id', id);

    if (matchesError) {
        console.error('Error fetching matches:', matchesError);
        setError('Erro ao carregar as partidas.');
    } else {
        // @ts-ignore
        setMatches(matchesData);
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [id, fetchData]);

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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{championship.name}</h1>
          <p className="text-muted-foreground mt-1">{championship.description || 'Sem descrição.'}</p>
        </div>
        <Button asChild variant="outline">
          <Link to={`/championship/${championship.id}/theme`}>
            <Palette className="mr-2 h-4 w-4" />
            Configurar Tema
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="leaderboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="leaderboard">Classificação</TabsTrigger>
          <TabsTrigger value="teams">Times</TabsTrigger>
          <TabsTrigger value="matches">Partidas</TabsTrigger>
          <TabsTrigger value="sponsors">Patrocínios</TabsTrigger>
        </TabsList>
        
        <TabsContent value="leaderboard" className="mt-4">
          <Leaderboard teams={teams} matches={matches} />
        </TabsContent>

        <TabsContent value="teams" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Times</CardTitle>
                  <CardDescription>Gerencie os times participantes.</CardDescription>
                </div>
                <CreateTeamDialog championshipId={championship.id} onTeamCreated={fetchData} />
              </div>
            </CardHeader>
            <CardContent>
              {teams.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                  <p className="text-gray-500">Ainda não há times.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {teams.map((team) => (
                    <Card key={team.id}>
                      <CardHeader className="flex flex-row items-center justify-between p-4">
                        <CardTitle className="text-base font-medium">{team.name}</CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <EditTeamDialog team={team} onTeamUpdated={fetchData}>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Editar</DropdownMenuItem>
                            </EditTeamDialog>
                            <DeleteTeamDialog team={team} onTeamDeleted={fetchData}>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">Excluir</DropdownMenuItem>
                            </DeleteTeamDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Partidas</CardTitle>
                  <CardDescription>Agende e atualize os resultados das partidas.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <GenerateMatchesDialog championshipId={championship.id} teams={teams} onMatchesGenerated={fetchData} />
                  <CreateMatchDialog championshipId={championship.id} teams={teams} onMatchCreated={fetchData} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {matches.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                  <p className="text-gray-500">Nenhuma partida agendada.</p>
                  {teams.length < 2 && <p className="text-gray-500 mt-2">Adicione pelo menos 2 times para agendar uma partida.</p>}
                </div>
              ) : (
                <div className="space-y-2">
                  {matches.map((match) => (
                    <Card key={match.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <span className="font-medium flex-1 text-right pr-4">{match.team1.name}</span>
                        <div className="flex items-center gap-2 text-lg">
                          <span>{match.team1_score ?? '-'}</span>
                          <Swords className="h-5 w-5 text-muted-foreground" />
                          <span>{match.team2_score ?? '-'}</span>
                        </div>
                        <span className="font-medium flex-1 text-left pl-4">{match.team2.name}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <EditMatchDialog match={match} onMatchUpdated={fetchData}>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Editar Placar</DropdownMenuItem>
                            </EditMatchDialog>
                            <DeleteMatchDialog match={match} onMatchDeleted={fetchData}>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">Excluir Partida</DropdownMenuItem>
                            </DeleteMatchDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sponsors" className="mt-4">
          <SponsorsTab championshipId={championship.id} />
        </TabsContent>
      </Tabs>
      
      {/* Display active sponsors below the tabs */}
      <SponsorDisplay championshipId={championship.id} />
    </div>
  );
};

export default ChampionshipDetail;