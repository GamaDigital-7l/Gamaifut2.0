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
import { useChampionshipTheme } from '@/contexts/ThemeContext';
import { Skeleton } from '@/components/ui/skeleton';
import { PublicHeader } from '@/components/PublicHeader';

// Re-using types for consistency
type Championship = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  theme_primary: string | null;
  theme_secondary: string | null;
  theme_accent: string | null;
  theme_bg: string | null;
  theme_text: string | null;
  theme_mode: string | null;
};

type Team = {
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

type Group = {
  id: string;
  name: string;
};

type Round = {
  id: string;
  name: string;
  order_index: number;
  type: string;
};

const PublicChampionshipView = () => {
  const { id } = useParams<{ id: string }>();
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetchAndApplyChampionshipTheme, applyThemeToDocument } = useChampionshipTheme();

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    // Fetch all data in parallel
    const [champRes, teamsRes, groupsRes, roundsRes, matchesRes] = await Promise.all([
      supabase.from('championships').select('*').eq('id', id).single(),
      supabase.from('teams').select('*').eq('championship_id', id).order('name', { ascending: true }),
      supabase.from('groups').select('*').eq('championship_id', id).order('name', { ascending: true }),
      supabase.from('rounds').select('*').eq('championship_id', id).order('order_index', { ascending: true }),
      supabase.from('matches').select(`*, team1:teams!matches_team1_id_fkey(name, logo_url), team2:teams!matches_team2_id_fkey(name, logo_url), groups(name), rounds(name)`).eq('championship_id', id).order('match_date', { ascending: true })
    ]);

    if (champRes.error) {
      console.error('Error fetching championship:', champRes.error);
      setError('Campeonato não encontrado ou erro ao carregar.');
      applyThemeToDocument(null);
    } else {
      setChampionship(champRes.data as Championship);
      fetchAndApplyChampionshipTheme(id);
    }

    if (teamsRes.error) console.error('Error fetching teams:', teamsRes.error);
    else setTeams(teamsRes.data as Team[]);

    if (groupsRes.error) console.error('Error fetching groups:', groupsRes.error);
    else setGroups(groupsRes.data as Group[]);

    if (roundsRes.error) console.error('Error fetching rounds:', roundsRes.error);
    else setRounds(roundsRes.data as Round[]);

    if (matchesRes.error) console.error('Error fetching matches:', matchesRes.error);
    else setMatches(matchesRes.data as Match[]);

    setLoading(false);
  }, [id, fetchAndApplyChampionshipTheme, applyThemeToDocument]);

  useEffect(() => {
    fetchData();
    return () => {
      applyThemeToDocument(null); // Revert to global theme on unmount
    };
  }, [fetchData, applyThemeToDocument]);

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
      <main className="flex-1 p-4 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl gap-6">
          <div className="flex items-center gap-4">
            {championship.logo_url && (
              <div className="w-20 h-20 relative">
                <AspectRatio ratio={1 / 1}>
                  <img src={championship.logo_url} alt={championship.name} className="rounded-md object-contain" />
                </AspectRatio>
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{championship.name}</h1>
              <p className="text-muted-foreground mt-1">{championship.description || 'Sem descrição.'}</p>
            </div>
          </div>

          <Tabs defaultValue="leaderboard" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="leaderboard">Classificação</TabsTrigger>
              <TabsTrigger value="matches">Partidas</TabsTrigger>
              <TabsTrigger value="teams">Times</TabsTrigger>
              <TabsTrigger value="sponsors">Patrocinadores</TabsTrigger>
            </TabsList>

            <TabsContent value="leaderboard" className="mt-4">
              {groups.length > 0 ? (
                <div className="space-y-4">
                  {groups.map(group => (
                    <Card key={group.id}>
                      <CardHeader><CardTitle>Classificação - {group.name}</CardTitle></CardHeader>
                      <CardContent>
                        <Leaderboard teams={teams.filter(t => t.group_id === group.id)} matches={matches.filter(m => m.group_id === group.id)} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardHeader><CardTitle>Classificação Geral</CardTitle></CardHeader>
                  <CardContent><Leaderboard teams={teams} matches={matches} /></CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="matches" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Partidas</CardTitle></CardHeader>
                <CardContent>
                  {matches.length === 0 ? (
                    <div className="text-center py-10"><p className="text-gray-500">Nenhuma partida agendada.</p></div>
                  ) : (
                    <div className="space-y-2">
                      {matches.map((match, index) => (
                        <MatchCard key={match.id} match={match} onMatchUpdated={() => {}} onMatchDeleted={() => {}} isEven={index % 2 === 0} groups={groups} rounds={rounds} isPublicView={true} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="teams" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Times Participantes</CardTitle></CardHeader>
                <CardContent>
                  {teams.length === 0 ? (
                    <div className="text-center py-10"><p className="text-gray-500">Nenhum time cadastrado.</p></div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {teams.map(team => (
                        <Link to={`/public/team/${team.id}`} key={team.id}>
                          <Card className="text-center p-4 hover:shadow-lg transition-shadow">
                            {team.logo_url && <img src={team.logo_url} alt={team.name} className="h-16 w-16 mx-auto object-contain mb-2" />}
                            <p className="font-semibold">{team.name}</p>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sponsors" className="mt-4">
              <SponsorDisplay championshipId={championship.id} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default PublicChampionshipView;