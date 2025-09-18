import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Leaderboard } from '@/components/Leaderboard';
import { SponsorDisplay } from '@/components/SponsorDisplay';
import { MatchCard } from '@/components/MatchCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChampionshipTheme } from '@/contexts/ThemeContext'; // Keep for logo
import { Skeleton } from '@/components/ui/skeleton';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicGroupsTab } from '@/components/PublicGroupsTab'; // Import new public groups tab
import { PublicRoundsTab } from '@/components/PublicRoundsTab'; // Import new public rounds tab
import { CalendarTab } from '@/components/CalendarTab'; // Re-use CalendarTab
import { StatisticsTab } from '@/components/StatisticsTab'; // Re-use StatisticsTab
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils'; // Import cn for conditional classes
import { Badge } from '@/components/ui/badge'; // Import Badge
import { 
  Users, 
  LayoutGrid, 
  Milestone, 
  Calendar as CalendarIconLucide, 
  BarChart2 
} from 'lucide-react';
import { Championship, Team, Match, Group, Round, Sponsor } from '@/types';

const PublicChampionshipView = () => {
  const { id } = useParams<{ id: string }>();
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [masterSponsor, setMasterSponsor] = useState<Sponsor | null>(null); // New state for master sponsor
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoundFilter, setSelectedRoundFilter] = useState<string>('all');
  const { fetchChampionshipLogo } = useChampionshipTheme(); // Keep for logo

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    // Fetch all data in parallel
    const [champRes, teamsRes, groupsRes, roundsRes, matchesRes, sponsorsRes] = await Promise.all([
      supabase.from('championships').select('*').eq('id', id).single(),
      supabase.from('teams').select('*').eq('championship_id', id).order('name', { ascending: true }),
      supabase.from('groups').select('*').eq('championship_id', id).order('name', { ascending: true }),
      supabase.from('rounds').select('*').eq('championship_id', id).order('order_index', { ascending: true }),
      supabase.from('matches').select(`*, team1:teams!matches_team1_id_fkey(id, name, logo_url), team2:teams!matches_team2_id_fkey(id, name, logo_url), groups(name), rounds(name)`).eq('championship_id', id).order('match_date', { ascending: true }),
      supabase.from('sponsors').select('*').eq('championship_id', id).eq('is_active', true).eq('level', 'ouro').order('created_at', { ascending: true }).limit(1) // Fetch only one master sponsor
    ]);

    if (champRes.error) {
      console.error('Error fetching championship:', champRes.error);
      setError('Campeonato não encontrado ou erro ao carregar.');
    } else {
      setChampionship(champRes.data as Championship);
      fetchChampionshipLogo(id); // Fetch and update logo in context
    }

    if (teamsRes.error) console.error('Error fetching teams:', teamsRes.error);
    else setTeams(teamsRes.data as Team[]);

    if (groupsRes.error) console.error('Error fetching groups:', groupsRes.error);
    else setGroups(groupsRes.data as Group[]);

    if (roundsRes.error) console.error('Error fetching rounds:', roundsRes.error);
    else setRounds(roundsRes.data as Round[]);

    if (matchesRes.error) console.error('Error fetching matches:', matchesRes.error);
    else setMatches(matchesRes.data as Match[]);

    if (sponsorsRes.error) console.error('Error fetching master sponsor:', sponsorsRes.error);
    else if (sponsorsRes.data && sponsorsRes.data.length > 0) setMasterSponsor(sponsorsRes.data[0] as Sponsor);
    else setMasterSponsor(null);

    setLoading(false);
  }, [id, fetchChampionshipLogo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredMatches = selectedRoundFilter === 'all'
    ? matches
    : matches.filter(match => match.round_id === selectedRoundFilter);

  const formatRuleText = (text: string) => {
    return text.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <PublicHeader />
        <main className="flex-1 p-4 md:p-10">
          <Skeleton className="h-24 w-full mb-6" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (error || !championship) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || 'Campeonato não encontrado.'}</p>
            <Button asChild><Link to="/">Voltar para a Página Inicial</Link></Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <PublicHeader />
      <main className="flex-1 p-4 md:gap-8 md:p-10"> {/* Adjusted padding */}
        <div className="grid w-full gap-6"> {/* Removed max-w-6xl and mx-auto */}
          <div className="flex flex-col items-center text-center gap-4 mb-6"> {/* Centralized content */}
            {championship.logo_url && (
              <div className="w-32 h-32 relative flex-shrink-0"> {/* Increased size */}
                <AspectRatio ratio={1 / 1}>
                  <img src={championship.logo_url} alt={championship.name} className="rounded-md object-contain" />
                </AspectRatio>
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{championship.name}</h1> {/* Larger title */}
              <p className="text-muted-foreground mt-1">{championship.description || 'Sem descrição.'}</p>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                <Badge variant="secondary">{formatRuleText(championship.sport_type)}</Badge>
                <Badge variant="secondary">{formatRuleText(championship.gender)}</Badge>
                <Badge variant="secondary">{formatRuleText(championship.age_category)}</Badge>
              </div>
            </div>
            {masterSponsor && masterSponsor.logo_url && (
              <a 
                href={masterSponsor.target_url || '#'} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={cn(
                  "flex items-center gap-2 p-2 border rounded-lg hover:shadow-md transition-shadow max-w-[150px] sm:max-w-[200px]",
                  "mx-auto sm:ml-auto sm:mr-0" // Centralize on mobile, push right on larger screens
                )}
              >
                <span className="text-xs text-muted-foreground hidden sm:inline">Patrocínio Master:</span>
                <img src={masterSponsor.logo_url} alt={masterSponsor.name} className="h-8 w-auto object-contain" />
              </a>
            )}
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
                        isPublicView={true}
                        pointsForWin={championship.points_for_win}
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
                  <Leaderboard 
                    teams={teams} 
                    matches={matches} 
                    isPublicView={true} 
                    pointsForWin={championship.points_for_win}
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <CardTitle>Jogos</CardTitle>
                    <CardDescription>Partidas agendadas e resultados.</CardDescription>
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
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredMatches.map((match, index) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        onMatchUpdated={() => {}} // No update action for public view
                        onMatchDeleted={() => {}} // No delete action for public view
                        isEven={index % 2 === 0}
                        groups={groups}
                        rounds={rounds}
                        isPublicView={true}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="teams" className="w-full mt-4">
            <div className="relative w-full overflow-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="teams">
                  <Users className="h-5 w-5 sm:mr-2" />
                  <span className="hidden sm:inline">Times</span>
                </TabsTrigger>
                <TabsTrigger value="groups">
                  <LayoutGrid className="h-5 w-5 sm:mr-2" />
                  <span className="hidden sm:inline">Grupos</span>
                </TabsTrigger>
                <TabsTrigger value="rounds">
                  <Milestone className="h-5 w-5 sm:mr-2" />
                  <span className="hidden sm:inline">Rodadas</span>
                </TabsTrigger>
                <TabsTrigger value="matches-calendar">
                  <CalendarIconLucide className="h-5 w-5 sm:mr-2" />
                  <span className="hidden sm:inline">Calendário</span>
                </TabsTrigger>
                <TabsTrigger value="statistics">
                  <BarChart2 className="h-5 w-5 sm:mr-2" />
                  <span className="hidden sm:inline">Estatísticas</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="teams" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Times Participantes</CardTitle>
                  <CardDescription>Todos os times inscritos no campeonato.</CardDescription>
                </CardHeader>
                <CardContent>
                  {teams.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg">
                      <p className="text-gray-500">Nenhum time cadastrado.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {teams.map(team => (
                        <Link to={`/public/team/${team.id}`} key={team.id}>
                          <Card className="text-center p-4 hover:shadow-lg transition-shadow">
                            {team.logo_url && <img src={team.logo_url} alt={team.name} className="h-16 w-16 mx-auto object-contain mb-2" />}
                            <p className="font-semibold">{team.name}</p>
                            {team.group_id && (
                              <p className="text-sm text-muted-foreground">
                                ({groups.find(g => g.id === team.group_id)?.name || 'Grupo Desconhecido'})
                              </p>
                            )}
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="groups" className="mt-4">
              <PublicGroupsTab championshipId={championship.id} teams={teams} />
            </TabsContent>

            <TabsContent value="rounds" className="mt-4">
              <PublicRoundsTab championshipId={championship.id} />
            </TabsContent>

            <TabsContent value="matches-calendar" className="mt-4">
              <CalendarTab 
                championshipId={championship.id} 
                matches={matches} 
                groups={groups}
                rounds={rounds}
                onMatchUpdated={() => {}} // No update action for public view
                onMatchDeleted={() => {}} // No delete action for public view
              />
            </TabsContent>

            <TabsContent value="statistics" className="mt-4">
              <StatisticsTab 
                championshipId={championship.id} 
                teams={teams} 
                matches={matches} 
              />
            </TabsContent>
          </Tabs>
          
          {/* Sponsors are displayed outside the tabs, as per the admin page layout */}
          <SponsorDisplay championshipId={championship.id} />
        </div>
      </main>
    </div>
  );
};

export default PublicChampionshipView;