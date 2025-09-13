import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, X, Palette, CalendarIcon, MapPin } from 'lucide-react'; // Changed Swords to X
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
import { SponsorDisplay } from '@/components/SponsorDisplay';
import { MatchCard } from '@/components/MatchCard';
import { GroupsTab, Group } from '@/components/GroupsTab'; // Import GroupsTab and Group type
import { RoundsTab, Round } from '@/components/RoundsTab'; // Import RoundsTab and Round type
import { CalendarTab } from '@/components/CalendarTab'; // Import CalendarTab
import { StatisticsTab } from '@/components/StatisticsTab'; // Import StatisticsTab
import { format } from 'date-fns';
import { useChampionshipTheme } from '@/contexts/ThemeContext';

type Championship = {
  id: string;
  name: string;
  description: string | null;
};

type Team = {
  id: string;
  name: string;
  logo_url: string | null;
};

type Match = {
  id: string;
  team1_id: string;
  team2_id: string;
  team1_score: number | null;
  team2_score: number | null;
  match_date: string | null;
  location: string | null;
  group_id: string | null; // Added group_id
  round_id: string | null; // Added round_id
  team1: { name: string; logo_url: string | null; };
  team2: { name: string; logo_url: string | null; };
  groups: { name: string } | null; // Nested group data
  rounds: { name: string } | null; // Nested round data
};

const ChampionshipDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [groups, setGroups] = useState<Group[]>([]); // State for groups
  const [rounds, setRounds] = useState<Round[]>([]); // State for rounds
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetchAndApplyChampionshipTheme } = useChampionshipTheme();

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

    const { data: groupsData, error: groupsError } = await supabase
      .from('groups')
      .select('*')
      .eq('championship_id', id)
      .order('name', { ascending: true });

    if (groupsError) {
      console.error('Error fetching groups:', groupsError);
      setError('Erro ao carregar os grupos.');
    } else {
      setGroups(groupsData as Group[]);
    }

    const { data: roundsData, error: roundsError } = await supabase
      .from('rounds')
      .select('*')
      .eq('championship_id', id)
      .order('order_index', { ascending: true })
      .order('name', { ascending: true });

    if (roundsError) {
      console.error('Error fetching rounds:', roundsError);
      setError('Erro ao carregar as rodadas.');
    } else {
      setRounds(roundsData as Round[]);
    }

    const { data: matchesData, error: matchesError } = await supabase
      .from('matches')
      .select(`
        id,
        team1_id,
        team2_id,
        team1_score,
        team2_score,
        match_date,
        location,
        group_id,
        round_id,
        team1:teams!matches_team1_id_fkey(name, logo_url),
        team2:teams!matches_team2_id_fkey(name, logo_url),
        groups(name),
        rounds(name)
      `)
      .eq('championship_id', id)
      .order('match_date', { ascending: true });

    if (matchesError) {
        console.error('Error fetching matches:', matchesError);
        setError('Erro ao carregar as partidas.');
    } else {
        setMatches(matchesData as Match[]);
    }

    setLoading(false);
    fetchAndApplyChampionshipTheme(id);
  }, [id, fetchAndApplyChampionshipTheme]);

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <Leaderboard teams={teams} matches={matches} />
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Jogos</CardTitle>
                <CardDescription>Agende e atualize os resultados das partidas.</CardDescription>
              </div>
              <div className="flex gap-2">
                <GenerateMatchesDialog championshipId={championship.id} teams={teams} groups={groups} rounds={rounds} onMatchesGenerated={fetchData} />
                <CreateMatchDialog championshipId={championship.id} teams={teams} groups={groups} rounds={rounds} onMatchCreated={fetchData} />
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
                {matches.map((match, index) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onMatchUpdated={fetchData}
                    onMatchDeleted={fetchData}
                    isEven={index % 2 === 0} // Pass isEven prop
                    groups={groups} // Pass groups
                    rounds={rounds} // Pass rounds
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="teams" className="w-full mt-4">
        <TabsList className="grid w-full grid-cols-6"> {/* Changed to 6 columns for new tabs */}
          <TabsTrigger value="teams">Times</TabsTrigger>
          <TabsTrigger value="groups">Grupos</TabsTrigger>
          <TabsTrigger value="rounds">Rodadas</TabsTrigger>
          <TabsTrigger value="matches-calendar">Calendário</TabsTrigger> {/* New tab */}
          <TabsTrigger value="statistics">Estatísticas</TabsTrigger> {/* New tab */}
          <TabsTrigger value="sponsors">Patrocínios</TabsTrigger>
        </TabsList>
        
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
                        <div className="flex items-center gap-4">
                          {team.logo_url && <img src={team.logo_url} alt={team.name} className="h-10 w-10 object-contain" />}
                          <CardTitle className="text-base font-medium">{team.name}</CardTitle>
                        </div>
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

        <TabsContent value="groups" className="mt-4">
          <GroupsTab championshipId={championship.id} />
        </TabsContent>

        <TabsContent value="rounds" className="mt-4">
          <RoundsTab championshipId={championship.id} />
        </TabsContent>

        <TabsContent value="matches-calendar" className="mt-4"> {/* New TabsContent for Calendar */}
          <CalendarTab 
            championshipId={championship.id} 
            matches={matches} 
            groups={groups}
            rounds={rounds}
            onMatchUpdated={fetchData} 
            onMatchDeleted={fetchData} 
          />
        </TabsContent>

        <TabsContent value="statistics" className="mt-4"> {/* New TabsContent for Statistics */}
          <StatisticsTab 
            championshipId={championship.id} 
            teams={teams} 
            matches={matches} 
          />
        </TabsContent>

        <TabsContent value="sponsors" className="mt-4">
          <SponsorsTab championshipId={championship.id} />
        </TabsContent>
      </Tabs>
      
      <SponsorDisplay championshipId={championship.id} />
    </div>
  );
};

export default ChampionshipDetail;