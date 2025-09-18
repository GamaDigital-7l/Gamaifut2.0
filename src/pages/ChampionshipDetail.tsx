import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Palette, 
  Share2,
  Users,
  LayoutGrid,
  Milestone,
  Calendar as CalendarIconLucide,
  BarChart2,
  HeartHandshake,
  Settings
} from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SponsorDisplay } from '@/components/SponsorDisplay';
import { useChampionshipTheme } from '@/contexts/ThemeContext';
import { Skeleton } from '@/components/ui/skeleton';
import { showSuccess, showError } from '@/utils/toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Championship, Team, Match, Group, Round } from '@/types';

// Import tab components
import { TeamsTab } from '@/components/TeamsTab';
import { MatchesTab } from '@/components/MatchesTab';
import { LeaderboardTab } from '@/components/LeaderboardTab';
import { GroupsTab } from '@/components/GroupsTab';
import { RoundsTab } from '@/components/RoundsTab';
import { CalendarTab } from '@/components/CalendarTab';
import { StatisticsTab } from '@/components/StatisticsTab';
import { SponsorsTab } from '@/components/SponsorsTab';
import { ChampionshipSettingsTab } from '@/components/ChampionshipSettingsTab';

// Combined fetch function for all championship data
const fetchChampionshipData = async (id: string) => {
  const [champRes, teamsRes, groupsRes, roundsRes, matchesRes] = await Promise.all([
    supabase.from('championships').select('*').eq('id', id).single(),
    supabase.from('teams').select('*').eq('championship_id', id),
    supabase.from('groups').select('*').eq('championship_id', id),
    supabase.from('rounds').select('*').eq('championship_id', id),
    supabase.from('matches').select(`*, team1:teams!matches_team1_id_fkey(*), team2:teams!matches_team2_id_fkey(*), groups(name), rounds(name)`).eq('championship_id', id)
  ]);

  if (champRes.error) throw new Error(champRes.error.message);
  if (teamsRes.error) throw new Error(teamsRes.error.message);
  if (groupsRes.error) throw new Error(groupsRes.error.message);
  if (roundsRes.error) throw new Error(roundsRes.error.message);
  if (matchesRes.error) throw new Error(matchesRes.error.message);

  return {
    championship: champRes.data as Championship,
    teams: teamsRes.data as Team[],
    groups: groupsRes.data as Group[],
    rounds: roundsRes.data as Round[],
    matches: matchesRes.data as Match[],
  };
};

const ChampionshipDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { fetchChampionshipLogo } = useChampionshipTheme();

  const { data, isLoading, error } = useQuery({
    queryKey: ['championshipData', id],
    queryFn: () => fetchChampionshipData(id!),
    enabled: !!id,
  });

  const { championship, teams, matches, groups, rounds } = data || {};

  useEffect(() => {
    if (id) {
      fetchChampionshipLogo(id);
    }
  }, [id, fetchChampionshipLogo]);

  const handleDataChange = () => {
    queryClient.invalidateQueries({ queryKey: ['championshipData', id] });
  };

  const handleCopyPublicLink = () => {
    if (id) {
      const publicLink = `${window.location.origin}/public/championship/${id}`;
      navigator.clipboard.writeText(publicLink)
        .then(() => showSuccess('Link público copiado para a área de transferência!'))
        .catch(() => showError('Erro ao copiar o link.'));
    }
  };

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
        <Skeleton className="h-10 w-full mt-4" />
        <Skeleton className="h-64 w-full mt-4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">Campeonato não encontrado ou erro ao carregar.</p>
        <Button asChild><Link to="/dashboard">Voltar para o Dashboard</Link></Button>
      </div>
    );
  }

  if (!championship || !teams || !matches || !groups || !rounds) {
    return null;
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

      <Tabs defaultValue="leaderboard" className="w-full">
        <div className="relative w-full overflow-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="leaderboard" className="md:col-span-1"><BarChart2 className="h-5 w-5 sm:mr-2" /><span className="hidden sm:inline">Classificação</span></TabsTrigger>
            <TabsTrigger value="matches" className="md:col-span-1"><CalendarIconLucide className="h-5 w-5 sm:mr-2" /><span className="hidden sm:inline">Jogos</span></TabsTrigger>
            <TabsTrigger value="teams" className="md:col-span-1"><Users className="h-5 w-5 sm:mr-2" /><span className="hidden sm:inline">Times</span></TabsTrigger>
            <TabsTrigger value="groups" className="md:col-span-1"><LayoutGrid className="h-5 w-5 sm:mr-2" /><span className="hidden sm:inline">Grupos</span></TabsTrigger>
            <TabsTrigger value="rounds" className="md:col-span-1"><Milestone className="h-5 w-5 sm:mr-2" /><span className="hidden sm:inline">Rodadas</span></TabsTrigger>
            <TabsTrigger value="calendar" className="md:col-span-1"><CalendarIconLucide className="h-5 w-5 sm:mr-2" /><span className="hidden sm:inline">Calendário</span></TabsTrigger>
            <TabsTrigger value="statistics" className="md:col-span-1"><BarChart2 className="h-5 w-5 sm:mr-2" /><span className="hidden sm:inline">Estatísticas</span></TabsTrigger>
            <TabsTrigger value="sponsors" className="md:col-span-1"><HeartHandshake className="h-5 w-5 sm:mr-2" /><span className="hidden sm:inline">Patrocínios</span></TabsTrigger>
            <TabsTrigger value="settings" className="md:col-span-1"><Settings className="h-5 w-5 sm:mr-2" /><span className="hidden sm:inline">Ajustes</span></TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="leaderboard" className="mt-4"><LeaderboardTab championshipId={championship.id} /></TabsContent>
        <TabsContent value="matches" className="mt-4"><MatchesTab championshipId={championship.id} /></TabsContent>
        <TabsContent value="teams" className="mt-4"><TeamsTab championshipId={championship.id} /></TabsContent>
        <TabsContent value="groups" className="mt-4"><GroupsTab championshipId={championship.id} teams={teams} onTeamUpdated={handleDataChange} /></TabsContent>
        <TabsContent value="rounds" className="mt-4"><RoundsTab championshipId={championship.id} teams={teams} groups={groups} onMatchesAdded={handleDataChange} /></TabsContent>
        <TabsContent value="calendar" className="mt-4"><CalendarTab championshipId={championship.id} matches={matches} groups={groups} rounds={rounds} onMatchUpdated={handleDataChange} onMatchDeleted={handleDataChange} /></TabsContent>
        <TabsContent value="statistics" className="mt-4"><StatisticsTab championshipId={championship.id} teams={teams} matches={matches} /></TabsContent>
        <TabsContent value="sponsors" className="mt-4"><SponsorsTab championshipId={championship.id} /></TabsContent>
        <TabsContent value="settings" className="mt-4"><ChampionshipSettingsTab championshipId={championship.id} /></TabsContent>
      </Tabs>
      
      <SponsorDisplay championshipId={championship.id} />
    </div>
  );
};

export default ChampionshipDetail;