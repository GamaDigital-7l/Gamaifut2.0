import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy } from 'lucide-react';
import { MatchCard } from '@/components/MatchCard';
import { Leaderboard } from '@/components/Leaderboard';
import { PublicHeader } from '@/components/PublicHeader';
import { useChampionshipTheme } from '@/contexts/ThemeContext'; // Keep for logo
import { Team, Match, Group, Round } from '@/types'; // Import Group and Round for MatchCard

const PublicTeamDetail = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetchChampionshipLogo } = useChampionshipTheme(); // Keep for logo
  const [allTeams, setAllTeams] = useState<Team[]>([]); // To pass to MatchCard
  const [allGroups, setAllGroups] = useState<Group[]>([]); // To pass to MatchCard
  const [allRounds, setAllRounds] = useState<Round[]>([]); // To pass to MatchCard

  const fetchTeamDetails = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);

    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select(`*, groups(name)`)
      .eq('id', teamId)
      .single();

    if (teamError || !teamData) {
      setError('Time não encontrado ou erro ao carregar.');
      setLoading(false);
      return;
    }
    setTeam(teamData as Team);
    fetchChampionshipLogo(teamData.championship_id); // Fetch and update logo in context

    // Fetch all teams, groups, and rounds for MatchCard
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .eq('championship_id', teamData.championship_id);
    if (teamsError) console.error('Error fetching all teams for public team detail:', teamsError);
    else setAllTeams(teamsData as Team[]);

    const { data: groupsData, error: groupsError } = await supabase
      .from('groups')
      .select('*')
      .eq('championship_id', teamData.championship_id);
    if (groupsError) console.error('Error fetching groups for public team detail:', groupsError);
    else setAllGroups(groupsData as Group[]);

    const { data: roundsData, error: roundsError } = await supabase
      .from('rounds')
      .select('*')
      .eq('championship_id', teamData.championship_id);
    if (roundsError) console.error('Error fetching rounds for public team detail:', roundsError);
    else setAllRounds(roundsData as Round[]);


    const { data: matchesData, error: matchesError } = await supabase
      .from('matches')
      .select(`*, team1:teams!matches_team1_id_fkey(id, name, logo_url), team2:teams!matches_team2_id_fkey(id, name, logo_url), groups(name), rounds(name), goals:match_goals(*)`)
      .or(`team1_id.eq.${teamId},team2_id.eq.${teamId}`)
      .order('match_date', { ascending: true });

    if (matchesError) {
      setError('Erro ao carregar as partidas do time.');
    } else {
      setMatches(matchesData as Match[]);
    }

    setLoading(false);
  }, [teamId, fetchChampionshipLogo]);

  useEffect(() => {
    fetchTeamDetails();
  }, [fetchTeamDetails]);

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
      <main className="flex-1 p-4 md:gap-8 md:p-10"> {/* Adjusted padding */}
        <div className="grid w-full gap-6"> {/* Removed max-w-6xl and mx-auto */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20"> {/* Increased size */}
              <AvatarImage src={team.logo_url || undefined} alt={team.name} loading="lazy" />
              <AvatarFallback><Trophy className="h-10 w-10 text-gray-500" /></AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{team.name}</h1> {/* Slightly smaller title */}
              <Button asChild variant="link" className="p-0 h-auto mt-1">
                <Link to={`/public/championship/${team.championship_id}`}>Voltar para o Campeonato</Link>
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle>Estatísticas do Time</CardTitle></CardHeader>
            <CardContent>
              <Leaderboard teams={[team]} matches={matches} />
            </CardContent>
          </Card>

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
                      teams={allTeams} // Pass allTeams
                      isPublicView={true} 
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PublicTeamDetail;