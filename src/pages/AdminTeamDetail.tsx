import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Frown, Trophy } from 'lucide-react';
import { MatchCard } from '@/components/MatchCard';
import { Leaderboard } from '@/components/Leaderboard'; // Re-use Leaderboard logic for single team stats
import { Team, Match, Group, Round } from '@/types';

const AdminTeamDetail = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [allRounds, setAllRounds] = useState<Round[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]); // Adicionado: Para passar para MatchCard

  const fetchTeamDetails = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);

    // Fetch team details
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select(`
        *,
        groups(name)
      `)
      .eq('id', teamId)
      .single();

    if (teamError) {
      console.error('Error fetching team:', teamError);
      setError('Time não encontrado ou erro ao carregar.');
      setLoading(false);
      return;
    }
    setTeam(teamData as Team);

    // Fetch all groups, rounds, and teams for MatchCard
    const [groupsRes, roundsRes, teamsRes] = await Promise.all([
      supabase.from('groups').select('*'),
      supabase.from('rounds').select('*'),
      supabase.from('teams').select('*'), // Fetch all teams
    ]);

    if (groupsRes.error) console.error('Error fetching groups for team detail:', groupsRes.error);
    else setAllGroups(groupsRes.data as Group[]);

    if (roundsRes.error) console.error('Error fetching rounds for team detail:', roundsRes.error);
    else setAllRounds(roundsRes.data as Round[]);

    if (teamsRes.error) console.error('Error fetching all teams for team detail:', teamsRes.error);
    else setAllTeams(teamsRes.data as Team[]);

    // Fetch matches involving this team
    const { data: matchesData, error: matchesError } = await supabase
      .from('matches')
      .select(`
        *,
        team1:teams!matches_team1_id_fkey(id, name, logo_url),
        team2:teams!matches_team2_id_fkey(id, name, logo_url),
        groups(name),
        rounds(name),
        goals:match_goals(*)
      `)
      .or(`team1_id.eq.${teamId},team2_id.eq.${teamId}`)
      .order('match_date', { ascending: true });

    if (matchesError) {
      console.error('Error fetching matches for team:', matchesError);
      setError('Erro ao carregar as partidas do time.');
    } else {
      setMatches(matchesData as Match[]);
    }

    setLoading(false);
  }, [teamId]);

  useEffect(() => {
    fetchTeamDetails();
  }, [fetchTeamDetails]);

  if (loading) {
    return (
      <div className="space-y-4 p-4 lg:p-6">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div>
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button asChild>
          <Link to="/dashboard">Voltar para o Dashboard</Link>
        </Button>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4">Time não encontrado.</p>
        <Button asChild>
          <Link to="/dashboard">Voltar para o Dashboard</Link>
        </Button>
      </div>
    );
  }

  // Prepare data for Leaderboard component to calculate single team stats
  const singleTeamArray = [team];
  const teamMatchesForStats = matches.filter(m => m.team1_score !== null && m.team2_score !== null);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={team.logo_url || undefined} alt={team.name} loading="lazy" />
          <AvatarFallback>
            <Trophy className="h-10 w-10 text-gray-500" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{team.name}</h1>
          <p className="text-muted-foreground">
            {team.groups?.name ? `Grupo: ${team.groups.name}` : 'Sem grupo atribuído'}
          </p>
          <Button asChild variant="link" className="p-0 h-auto mt-1">
            <Link to={`/championship/${team.championship_id}`}>Voltar para o Campeonato</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estatísticas do Time</CardTitle>
          <CardDescription>Desempenho geral do {team.name} no campeonato.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Re-using Leaderboard component for single team stats */}
          <Leaderboard teams={singleTeamArray} matches={teamMatchesForStats} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Partidas de {team.name}</CardTitle>
          <CardDescription>Todas as partidas em que {team.name} participou.</CardDescription>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <p className="text-gray-500">Nenhuma partida encontrada para este time.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {matches.map((match, index) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onMatchUpdated={fetchTeamDetails} // Refresh data if a match is updated
                  onMatchDeleted={fetchTeamDetails} // Refresh data if a match is deleted
                  isEven={index % 2 === 0}
                  groups={allGroups}
                  rounds={allRounds}
                  teams={allTeams}
                  isPublicView={false} // Explicitly set to false for admin view
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTeamDetail;