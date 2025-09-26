import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Leaderboard } from '@/components/Leaderboard';
import { Team, Group, Match, Championship } from '@/types'; // Import types from centralized types

interface LeaderboardTabProps {
  championshipId: string;
  teams: Team[];
  groups: Group[];
  matches: Match[];
  championship: Championship;
  isLoading: boolean;
}

export function LeaderboardTab({ championshipId, teams, groups, matches, championship, isLoading }: LeaderboardTabProps) {
  // No longer fetching data internally, relying on props
  // const { data, isLoading } = useQuery({
  //   queryKey: ['leaderboard', championshipId],
  //   queryFn: () => fetchData(championshipId),
  // });

  // const { teams = [], groups = [], matches = [], championship } = data || {};

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