import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Leaderboard } from '@/components/Leaderboard';

type Team = { id: string; name: string; logo_url: string | null; group_id: string | null; };
type Group = { id: string; name: string; };
type Match = { id: string; team1_id: string; team2_id: string; team1_score: number | null; team2_score: number | null; match_date: string | null; group_id: string | null; };
type Championship = { points_for_win: number; };

const fetchData = async (championshipId: string) => {
  const [teamsRes, groupsRes, matchesRes, championshipRes] = await Promise.all([
    supabase.from('teams').select('*').eq('championship_id', championshipId),
    supabase.from('groups').select('*').eq('championship_id', championshipId),
    supabase.from('matches').select('*').eq('championship_id', championshipId),
    supabase.from('championships').select('points_for_win').eq('id', championshipId).single(),
  ]);

  if (teamsRes.error || groupsRes.error || matchesRes.error || championshipRes.error) {
    console.error(teamsRes.error, groupsRes.error, matchesRes.error, championshipRes.error);
    throw new Error('Failed to fetch data for leaderboard');
  }

  return {
    teams: teamsRes.data as Team[],
    groups: groupsRes.data as Group[],
    matches: matchesRes.data as Match[],
    championship: championshipRes.data as Championship,
  };
};

interface LeaderboardTabProps {
  championshipId: string;
}

export function LeaderboardTab({ championshipId }: LeaderboardTabProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', championshipId],
    queryFn: () => fetchData(championshipId),
  });

  const { teams = [], groups = [], matches = [], championship } = data || {};

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card><CardHeader><Skeleton className="h-6 w-48 mb-2" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-6 w-48 mb-2" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.length > 0 ? (
        groups.map((group: Group) => (
          <Card key={group.id}>
            <CardHeader><CardTitle>Classificação - {group.name}</CardTitle><CardDescription>Times do grupo {group.name}</CardDescription></CardHeader>
            <CardContent>
              <Leaderboard 
                teams={teams.filter((team: Team) => team.group_id === group.id)} 
                matches={matches.filter((match: Match) => match.group_id === group.id)} 
                isPublicView={false} 
                pointsForWin={championship?.points_for_win}
              />
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardHeader><CardTitle>Classificação Geral</CardTitle><CardDescription>Todos os times do campeonato.</CardDescription></CardHeader>
          <CardContent>
            <Leaderboard 
              teams={teams} 
              matches={matches} 
              isPublicView={false} 
              pointsForWin={championship?.points_for_win}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}