import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, X, Palette, CalendarIcon, MapPin, Share2 } from 'lucide-react';
import { CreateTeamDialog } from '@/components/CreateTeamDialog';
import { EditTeamDialog } from '@/components/EditTeamDialog';
import { DeleteTeamDialog } from '@/components/DeleteTeamDialog';
import { CreateMatchDialog } from '@/components/CreateMatchDialog';
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
import { ChampionshipSettingsTab } from '@/components/ChampionshipSettingsTab';
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
import { showSuccess, showError } from '@/utils/toast';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Data fetching functions
const fetchChampionship = async (id: string) => {
  const { data, error } = await supabase.from('championships').select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  return data;
};

const fetchTeams = async (id: string) => {
  const { data, error } = await supabase.from('teams').select('*').eq('championship_id', id).order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
};

const fetchGroups = async (id: string) => {
  const { data, error } = await supabase.from('groups').select('*').eq('championship_id', id).order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
};

const fetchRounds = async (id: string) => {
  const { data, error } = await supabase.from('rounds').select('*').eq('championship_id', id).order('order_index', { ascending: true }).order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
};

const fetchMatches = async (id: string) => {
  const { data, error } = await supabase.from('matches').select(`*, team1:teams!matches_team1_id_fkey(name, logo_url), team2:teams!matches_team2_id_fkey(name, logo_url), groups(name), rounds(name)`).eq('championship_id', id).order('match_date', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
};


export type Team = {
  id: string;
  name: string;
  logo_url: string | null;
  group_id: string | null;
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
  team1_yellow_cards: number | null;
  team2_yellow_cards: number | null;
  team1_red_cards: number | null;
  team2_red_cards: number | null;
  team1_fouls: number | null;
  team2_fouls: number | null;
  notes: string | null;
  team1: { name: string; logo_url: string | null; };
  team2: { name: string; logo_url: string | null; };
  groups: { name: string } | null;
  rounds: { name: string } | null;
};

const ChampionshipDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [selectedRoundFilter, setSelectedRoundFilter] = useState<string>('all');
  const { fetchChampionshipLogo } = useChampionshipTheme();

  const { data: championship, isLoading: isLoadingChampionship, error: errorChampionship } = useQuery({
    queryKey: ['championship', id],
    queryFn: () => fetchChampionship(id!),
    enabled: !!id,
  });

  const { data: teams = [], isLoading: isLoadingTeams } = useQuery({
    queryKey: ['teams', id],
    queryFn: () => fetchTeams(id!),
    enabled: !!id,
  });

  const { data: groups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: ['groups', id],
    queryFn: () => fetchGroups(id!),
    enabled: !!id,
  });

  const { data: rounds = [], isLoading: isLoadingRounds } = useQuery({
    queryKey: ['rounds', id],
    queryFn: () => fetchRounds(id!),
    enabled: !!id,
  });

  const { data: matches = [], isLoading: isLoadingMatches } = useQuery({
    queryKey: ['matches', id],
    queryFn: () => fetchMatches(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (id) {
      fetchChampionshipLogo(id);
    }
  }, [id, fetchChampionshipLogo]);

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['teams', id] });
    queryClient.invalidateQueries({ queryKey: ['matches', id] });
    queryClient.invalidateQueries({ queryKey: ['groups', id] });
    queryClient.invalidateQueries({ queryKey: ['rounds', id] });
  };

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

  const isLoading = isLoadingChampionship || isLoadingTeams || isLoadingMatches || isLoadingGroups || isLoadingRounds;

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 lg:p-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card><CardHeader><Skeleton className="h-6 w-48 mb-2" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-6 w-24 mb-2" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
        </div>
        <Card><CardHeader><Skeleton className="h-10 w-full" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (errorChampionship) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">Campeonato não encontrado ou erro ao carregar.</p>
        <Button asChild><Link to="/dashboard">Voltar para o Dashboard</Link></Button>
      </div>
    );
  }

  if (!championship) {
    return null; // Should be handled by error state
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center text-center gap-4 mb-6">
        {championship.logo_url && (
          <div className="w-32 h-32 relative flex-shrink-0">
            <AspectRatio ratio={1 / 1}>
              <img src={championship.logo_url} alt={championship.name} className="rounded-md object-contain" />
            </AspectRatio>
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold">{championship.name}</h1>
          <p className="text-muted-foreground mt-1">{championship.description || 'Sem descrição.'}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          <Button variant="outline" onClick={handleCopyPublicLink}><Share2 className="mr-2 h-4 w-4" />Link Público</Button>
          <Button asChild variant="outline"><Link to={`/championship/${championship.id}/theme`}><Palette className="mr-2 h-4 w-4" />Configurar Logo</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {groups.length > 0 ? (
          <div className="space-y-4">
            {groups.map(group => (
              <Card key={group.id}>
                <CardHeader><CardTitle>Classificação - {group.name}</CardTitle><CardDescription>Times do grupo {group.name}</CardDescription></CardHeader>
                <CardContent><Leaderboard teams={teams.filter(team => team.group_id === group.id)} matches={matches.filter(match => match.group_id === group.id)} isPublicView={false} pointsForWin={championship.points_for_win} /></CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader><CardTitle>Classificação Geral</CardTitle><CardDescription>Todos os times do campeonato.</CardDescription></CardHeader>
            <CardContent><Leaderboard teams={teams} matches={matches} isPublicView={false} pointsForWin={championship.points_for_win} /></CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
              <div><CardTitle>Jogos</CardTitle><CardDescription>Agende e atualize os resultados.</CardDescription></div>
              <div className="flex gap-2">
                <GenerateMatchesDialog championshipId={championship.id} teams={teams} groups={groups} rounds={rounds} onMatchesGenerated={invalidateQueries} />
                <CreateMatchDialog championshipId={championship.id} teams={teams} groups={groups} rounds={rounds} onMatchCreated={invalidateQueries} />
              </div>
            </div>
            {rounds.length > 0 && (
              <div className="flex items-center gap-2">
                <Label htmlFor="round-filter" className="text-right sr-only">Filtrar por Rodada</Label>
                <Select value={selectedRoundFilter} onValueChange={setSelectedRoundFilter}>
                  <SelectTrigger id="round-filter" className="w-[180px]"><SelectValue placeholder="Filtrar por Rodada" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Rodadas</SelectItem>
                    {rounds.map(round => (<SelectItem key={round.id} value={round.id}>{round.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {filteredMatches.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed rounded-lg"><p className="text-gray-500">Nenhuma partida agendada.</p></div>
            ) : (
              <div className="space-y-2">{filteredMatches.map((match, index) => (<MatchCard key={match.id} match={match} onMatchUpdated={invalidateQueries} onMatchDeleted={invalidateQueries} isEven={index % 2 === 0} groups={groups} rounds={rounds} isPublicView={false} />))}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="teams" className="w-full mt-4">
        <div className="overflow-x-auto pb-2"><TabsList className="grid w-max grid-flow-col gap-4"><TabsTrigger value="teams">Times</TabsTrigger><TabsTrigger value="groups">Grupos</TabsTrigger><TabsTrigger value="rounds">Rodadas</TabsTrigger><TabsTrigger value="matches-calendar">Calendário</TabsTrigger><TabsTrigger value="statistics">Estatísticas</TabsTrigger><TabsTrigger value="sponsors">Patrocínios</TabsTrigger><TabsTrigger value="settings">Configurações</TabsTrigger></TabsList></div>
        <TabsContent value="teams" className="mt-4">
          <Card>
            <CardHeader><div className="flex justify-between items-center"><div><CardTitle>Times</CardTitle><CardDescription>Gerencie os times participantes.</CardDescription></div><CreateTeamDialog championshipId={championship.id} onTeamCreated={invalidateQueries} groups={groups} /></div></CardHeader>
            <CardContent>
              {teams.length === 0 ? (<div className="text-center py-10 border-2 border-dashed rounded-lg"><p className="text-gray-500">Ainda não há times.</p></div>) : (<div className="space-y-2">{teams.map((team) => (<Card key={team.id}><CardHeader className="flex flex-row items-center justify-between p-4"><div className="flex items-center gap-4">{team.logo_url && <img src={team.logo_url} alt={team.name} className="h-10 w-10 object-contain" />}<CardTitle className="text-base font-medium"><Link to={`/team/${team.id}`} className="hover:underline">{team.name}</Link></CardTitle>{team.group_id && (<span className="text-sm text-muted-foreground">({groups.find(g => g.id === team.group_id)?.name || 'Grupo Desconhecido'})</span>)}</div><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent><EditTeamDialog team={team} onTeamUpdated={invalidateQueries} groups={groups}><DropdownMenuItem onSelect={(e) => e.preventDefault()}>Editar</DropdownMenuItem></EditTeamDialog><DeleteTeamDialog team={team} onTeamDeleted={invalidateQueries}><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">Excluir</DropdownMenuItem></DeleteTeamDialog></DropdownMenuContent></DropdownMenu></CardHeader></Card>))}</div>)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="groups" className="mt-4"><GroupsTab championshipId={championship.id} teams={teams} onTeamUpdated={invalidateQueries} /></TabsContent>
        <TabsContent value="rounds" className="mt-4"><RoundsTab championshipId={championship.id} teams={teams} groups={groups} onMatchesAdded={invalidateQueries} /></TabsContent>
        <TabsContent value="matches-calendar" className="mt-4"><CalendarTab championshipId={championship.id} matches={matches} groups={groups} rounds={rounds} onMatchUpdated={invalidateQueries} onMatchDeleted={invalidateQueries} /></TabsContent>
        <TabsContent value="statistics" className="mt-4"><StatisticsTab championshipId={championship.id} teams={teams} matches={matches} /></TabsContent>
        <TabsContent value="sponsors" className="mt-4"><SponsorsTab championshipId={championship.id} /></TabsContent>
        <TabsContent value="settings" className="mt-4"><ChampionshipSettingsTab championshipId={championship.id} /></TabsContent>
      </Tabs>
      <SponsorDisplay championshipId={championship.id} />
    </div>
  );
};

export default ChampionshipDetail;