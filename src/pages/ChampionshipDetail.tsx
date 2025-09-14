import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, X, Palette, CalendarIcon, MapPin, Share2 } from 'lucide-react'; // Added Share2 icon
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
import { GroupsTab, Group } from '@/components/GroupsTab';
import { RoundsTab, Round } from '@/components/RoundsTab';
import { CalendarTab } from '@/components/CalendarTab';
import { StatisticsTab } from '@/components/StatisticsTab';
import { format } from 'date-fns';
import { useChampionshipTheme } from '@/contexts/ThemeContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { showSuccess, showError } from '@/utils/toast'; // Import toast utilities

type Championship = {
  id: string;
  name: string;
  description: string | null;
};

export type Team = { // Export Team type for use in other components
  id: string;
  name: string;
  logo_url: string | null;
  group_id: string | null; // Added group_id
};

type Match = {
  id: string;
  team1_id: string;
  team2_id: string;
  team1_score: number | null;
  team2_score: number | null;
  match_date: string | null;
  location: string | null;
  group_id: string | null;
  round_id: string | null;
  assigned_official_id: string | null;
  team1_yellow_cards: number | null; // New field
  team2_yellow_cards: number | null; // New field
  team1_red_cards: number | null; // New field
  team2_red_cards: number | null; // New field
  team1_fouls: number | null; // New field
  team2_fouls: number | null; // New field
  notes: string | null; // New field
  team1: { name: string; logo_url: string | null; };
  team2: { name: string; logo_url: string | null; };
  groups: { name: string } | null;
  rounds: { name: string } | null;
};

const ChampionshipDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoundFilter, setSelectedRoundFilter] = useState<string>('all'); // New state for round filter
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
        assigned_official_id,
        team1_yellow_cards,
        team2_yellow_cards,
        team1_red_cards,
        team2_red_cards,
        team1_fouls,
        team2_fouls,
        notes,
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

  const filteredMatches = selectedRoundFilter === 'all'
    ? matches
    : matches.filter(match => match.round_id === selectedRoundFilter);

  const handleCopyPublicLink = () => {
    if (id) {
      const publicLink = `${window.location.origin}/public/championship/${id}`;
      navigator.clipboard.writeText(publicLink)
        .then(() => showSuccess('Link público copiado para a área de transferência!'))
        .catch(() => showError('Erro ao copiar o link.'));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4 lg:p-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>

        {/* Main Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Leaderboard Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-2">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Matches Card Skeleton */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-28" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-10 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCopyPublicLink}>
            <Share2 className="mr-2 h-4 w-4" />
            Link Público
          </Button>
          <Button asChild variant="outline">
            <Link to={`/championship/${championship.id}/theme`}>
              <Palette className="mr-2 h-4 w-4" />
              Configurar Tema
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Leaderboards por Grupo */}
        {groups.length > 0 ? (
          <div className="space-y-4">
            {groups.map(group => (
              <Card key={group.id}>
                <CardHeader>
                  <CardTitle>Classificação - {group.name}</CardTitle>
                  <CardDescription>Times do grupo {group.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Leaderboard 
                    teams={teams.filter(team => team.group_id === group.id)} 
                    matches={matches.filter(match => match.group_id === group.id)} 
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Classificação Geral</CardTitle>
              <CardDescription>Todos os times do campeonato.</CardDescription>
            </CardHeader>
            <CardContent>
              <Leaderboard teams={teams} matches={matches} />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
              <div>
                <CardTitle>Jogos</CardTitle>
                <CardDescription>Agende e atualize os resultados das partidas.</CardDescription>
              </div>
              <div className="flex gap-2">
                <GenerateMatchesDialog championshipId={championship.id} teams={teams} groups={groups} rounds={rounds} onMatchesGenerated={fetchData} />
                <CreateMatchDialog championshipId={championship.id} teams={teams} groups={groups} rounds={rounds} onMatchCreated={fetchData} />
              </div>
            </div>
            {/* Round Filter */}
            {rounds.length > 0 && (
              <div className="flex items-center gap-2">
                <Label htmlFor="round-filter" className="text-right sr-only">Filtrar por Rodada</Label>
                <Select value={selectedRoundFilter} onValueChange={setSelectedRoundFilter}>
                  <SelectTrigger id="round-filter" className="w-[180px]">
                    <SelectValue placeholder="Filtrar por Rodada" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Rodadas</SelectItem>
                    {rounds.map(round => (
                      <SelectItem key={round.id} value={round.id}>{round.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {filteredMatches.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-gray-500">Nenhuma partida agendada.</p>
                {teams.length < 2 && <p className="text-gray-500 mt-2">Adicione pelo menos 2 times para agendar uma partida.</p>}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMatches.map((match, index) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onMatchUpdated={fetchData}
                    onMatchDeleted={fetchData}
                    isEven={index % 2 === 0}
                    groups={groups}
                    rounds={rounds}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="teams" className="w-full mt-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="teams">Times</TabsTrigger>
          <TabsTrigger value="groups">Grupos</TabsTrigger>
          <TabsTrigger value="rounds">Rodadas</TabsTrigger>
          <TabsTrigger value="matches-calendar">Calendário</TabsTrigger>
          <TabsTrigger value="statistics">Estatísticas</TabsTrigger>
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
                <CreateTeamDialog championshipId={championship.id} onTeamCreated={fetchData} groups={groups} />
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
                          <CardTitle className="text-base font-medium">
                            <Link to={`/team/${team.id}`} className="hover:underline">
                              {team.name}
                            </Link>
                          </CardTitle>
                          {team.group_id && (
                            <span className="text-sm text-muted-foreground">
                              ({groups.find(g => g.id === team.group_id)?.name || 'Grupo Desconhecido'})
                            </span>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <EditTeamDialog team={team} onTeamUpdated={fetchData} groups={groups}>
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
          <GroupsTab championshipId={championship.id} teams={teams} onTeamUpdated={fetchData} />
        </TabsContent>

        <TabsContent value="rounds" className="mt-4">
          <RoundsTab 
            championshipId={championship.id} 
            teams={teams} 
            groups={groups} 
            onMatchesAdded={fetchData} // Pass fetchData as callback
          />
        </TabsContent>

        <TabsContent value="matches-calendar" className="mt-4">
          <CalendarTab 
            championshipId={championship.id} 
            matches={matches} 
            groups={groups}
            rounds={rounds}
            onMatchUpdated={fetchData} 
            onMatchDeleted={fetchData} 
          />
        </TabsContent>

        <TabsContent value="statistics" className="mt-4">
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