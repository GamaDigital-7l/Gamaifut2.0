import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Importar useMemo
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Camera } from 'lucide-react';
import { MatchCard } from '@/components/MatchCard';
import { Leaderboard } from '@/components/Leaderboard';
import { PublicHeader } from '@/components/PublicHeader';
import { useChampionshipTheme } from '@/contexts/ThemeContext';
import { Team, Match, Group, Round } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaGallery } from '@/components/MediaGallery';

const PublicTeamDetail = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetchChampionshipLogo } = useChampionshipTheme();
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [allRounds, setAllRounds] = useState<Round[]>([]);

  const fetchTeamDetails = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);

    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select(`id, name, logo_url, championship_id, user_id, group_id, groups(name)`)
      .eq('id', teamId)
      .single();

    if (teamError || !teamData) {
      setError('Time não encontrado ou erro ao carregar.');
      setLoading(false);
      return;
    }
    
    const transformedTeamData = {
      ...teamData,
      groups: Array.isArray(teamData.groups) ? teamData.groups[0] : teamData.groups,
    } as Team;
    setTeam(transformedTeamData); // Corrected type assertion
    fetchChampionshipLogo(teamData.championship_id);

    const [teamsRes, groupsRes, roundsRes, matchesRes] = await Promise.all([
      supabase.from('teams').select('id, name, logo_url, championship_id, user_id, group_id, groups(name)').eq('championship_id', teamData.championship_id),
      supabase.from('groups').select('id, name, championship_id, created_at').eq('championship_id', teamData.championship_id),
      supabase.from('rounds').select('id, name, order_index, type, championship_id, created_at, public_edit_token').eq('championship_id', teamData.championship_id),
      supabase.from('matches').select(`id, team1_id, team2_id, team1_score, team2_score, match_date, location, group_id, round_id, team1_yellow_cards, team2_yellow_cards, team1_red_cards, team2_red_cards, team1_fouls, team2_fouls, notes, team1:teams!matches_team1_id_fkey(id, name, logo_url), team2:teams!matches_team2_id_fkey(id, name, logo_url), groups(name), rounds(name), goals:match_goals(id, match_id, team_id, player_name, jersey_number)`)
        .eq('championship_id', teamData.championship_id)
        .or(`team1_id.eq.${teamId},team2_id.eq.${teamId}`)
        .order('round_id', { ascending: true, nullsFirst: true })
        .order('match_date', { ascending: true, nullsFirst: true })
        .order('created_at', { ascending: true }),
    ]);

    if (teamsRes.error) console.error('Error fetching all teams for public team detail:', teamsRes.error);
    else {
      const transformedAllTeams = (teamsRes.data || []).map((team: any) => ({
        ...team,
        groups: Array.isArray(team.groups) ? team.groups[0] : team.groups,
      })) as Team[];
      setAllTeams(transformedAllTeams); // Corrected type assertion
    }

    if (groupsRes.error) console.error('Error fetching groups for public team detail:', groupsRes.error);
    else setAllGroups(groupsRes.data as Group[]);

    if (roundsRes.error) console.error('Error fetching rounds for public team detail:', roundsRes.error);
    else setAllRounds(roundsRes.data as Round[]);

    if (matchesRes.error) {
      setError('Erro ao carregar as partidas do time.');
    } else {
      const transformedMatches = (matchesRes.data || []).map((match: any) => ({
        ...match,
        team1: Array.isArray(match.team1) ? match.team1[0] : match.team1,
        team2: Array.isArray(match.team2) ? match.team2[0] : match.team2,
        groups: Array.isArray(match.groups) ? match.groups[0] : match.groups,
        rounds: Array.isArray(match.rounds) ? match.rounds[0] : match.rounds,
      })) as Match[];
      setMatches(transformedMatches); // Corrected type assertion
    }

    setLoading(false);
  }, [teamId, fetchChampionshipLogo]);

  useEffect(() => {
    fetchTeamDetails();
  }, [fetchTeamDetails]);

  const singleTeamArray = useMemo(() => (team ? [team] : []), [team]);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <PublicHeader />
        <main className="flex-1 p-4 md:p-10"><Skeleton className="h-64 w-full" /></main>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || 'Time não encontrado.'}</p>
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
        <div className="grid w-full gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={team.logo_url || undefined} alt={team.name} loading="lazy" />
              <AvatarFallback><Trophy className="h-10 w-10 text-gray-500" /></AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{team.name}</h1>
              <Button asChild variant="link" className="p-0 h-auto mt-1">
                <Link to={`/public/championship/${team.championship_id}`}>Voltar para o Campeonato</Link>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="stats" className="w-full">
            <div className="relative w-full overflow-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="stats">Estatísticas</TabsTrigger>
                <TabsTrigger value="matches">Partidas</TabsTrigger>
                <TabsTrigger value="portfolio">
                  <Camera className="h-5 w-5 sm:mr-2" />
                  <span className="hidden sm:inline">Portfólio</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="stats" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Estatísticas do Time</CardTitle></CardHeader>
                <CardContent>
                  <Leaderboard teams={singleTeamArray} matches={matches} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="matches" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Partidas de {team.name}</CardTitle></CardHeader>
                <CardContent>
                  {matches.length === 0 ? (
                    <div className="text-center py-10"><p className="text-gray-500">Nenhuma partida encontrada.</p></div>
                  ) : (
                    <div className="space-y-2">
                      {matches.map((match, index) => (
                        <MatchCard 
                          key={match.id} 
                          match={match} 
                          onMatchUpdated={() => {}} 
                          onMatchDeleted={() => {}} 
                          isEven={index % 2 === 0} 
                          groups={allGroups} 
                          rounds={allRounds} 
                          teams={allTeams}
                          isPublicView={true} 
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="portfolio" className="mt-4">
              <MediaGallery
                championshipId={team.championship_id}
                matches={matches}
                teams={allTeams}
                rounds={allRounds}
                teamId={team.id}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default PublicTeamDetail;