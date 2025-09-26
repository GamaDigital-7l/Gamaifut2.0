import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Team, Match } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

interface StatisticsTabProps {
  championshipId: string;
  teams: Team[];
  matches: Match[];
  isLoading: boolean;
  onDataChange: () => void; // Callback to notify parent of data changes (though not used directly here, good practice)
}

export function StatisticsTab({ championshipId, teams, matches, isLoading, onDataChange }: StatisticsTabProps) {
  const playedMatches = matches.filter(m => m.team1_score !== null && m.team2_score !== null);

  const totalMatches = matches.length;
  const totalPlayedMatches = playedMatches.length;
  const totalGoals = playedMatches.reduce((sum, match) => sum + (match.team1_score || 0) + (match.team2_score || 0), 0);
  const avgGoalsPerMatch = totalPlayedMatches > 0 ? (totalGoals / totalPlayedMatches).toFixed(2) : '0.00';

  const teamStats = new Map<string, { wins: number; draws: number; losses: number }>();
  teams.forEach(team => teamStats.set(team.id, { wins: 0, draws: 0, losses: 0 }));

  playedMatches.forEach(match => {
    if (match.team1_score !== null && match.team2_score !== null) {
      const team1Stats = teamStats.get(match.team1_id);
      const team2Stats = teamStats.get(match.team2_id);

      if (team1Stats && team2Stats) {
        if (match.team1_score > match.team2_score) {
          team1Stats.wins++;
          team2Stats.losses++;
        } else if (match.team1_score < match.team2_score) {
          team2Stats.wins++;
          team1Stats.losses++;
        } else {
          team1Stats.draws++;
          team2Stats.draws++;
        }
      }
    }
  });

  const totalWins = Array.from(teamStats.values()).reduce((sum, stats) => sum + stats.wins, 0) / 2; // Each win counted twice
  const totalDraws = Array.from(teamStats.values()).reduce((sum, stats) => sum + stats.draws, 0) / 2; // Each draw counted twice
  const totalLosses = Array.from(teamStats.values()).reduce((sum, stats) => sum + stats.losses, 0) / 2; // Each loss counted twice

  // Most common scores
  const scoreCounts = new Map<string, number>();
  playedMatches.forEach(match => {
    if (match.team1_score !== null && match.team2_score !== null) {
      const score = `${match.team1_score}-${match.team2_score}`;
      scoreCounts.set(score, (scoreCounts.get(score) || 0) + 1);
    }
  });
  const sortedScores = Array.from(scoreCounts.entries()).sort((a, b) => b[1] - a[1]);
  const top3Scores = sortedScores.slice(0, 3);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full md:col-span-2 lg:col-span-3" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estatísticas do Campeonato</CardTitle>
        <CardDescription>Visão geral dos dados e desempenho do campeonato.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Partidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMatches}</div>
            <p className="text-xs text-muted-foreground">
              {totalPlayedMatches} jogadas, {totalMatches - totalPlayedMatches} agendadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gols Marcados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGoals}</div>
            <p className="text-xs text-muted-foreground">
              Média de {avgGoalsPerMatch} gols por partida
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 text-2xl font-bold">
              <Badge variant="default" className="bg-green-500 hover:bg-green-500">{totalWins} Vitórias</Badge>
              <Badge variant="secondary" className="bg-gray-400 hover:bg-gray-400">{totalDraws} Empates</Badge>
              <Badge variant="destructive" className="bg-red-500 hover:bg-red-500">{totalLosses} Derrotas</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Baseado em partidas jogadas.
            </p>
          </CardContent>
        </Card>
        {top3Scores.length > 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Placares Mais Comuns</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placar</TableHead>
                    <TableHead className="text-right">Ocorrências</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {top3Scores.map(([score, count]) => (
                    <TableRow key={score}>
                      <TableCell className="font-medium">{score}</TableCell>
                      <TableCell className="text-right">{count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}