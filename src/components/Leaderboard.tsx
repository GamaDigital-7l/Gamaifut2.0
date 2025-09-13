import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Team {
  id: string;
  name: string;
}

interface Match {
  id: string;
  team1_id: string;
  team2_id: string;
  team1_score: number | null;
  team2_score: number | null;
}

interface LeaderboardProps {
  teams: Team[];
  matches: Match[];
}

interface Standing {
  teamId: string;
  teamName: string;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export function Leaderboard({ teams, matches }: LeaderboardProps) {
  if (teams.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Classificação</h2>
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <p className="text-gray-500">Adicione times para ver a classificação.</p>
        </div>
      </div>
    );
  }

  const standings: Standing[] = teams.map(team => ({
    teamId: team.id,
    teamName: team.name,
    points: 0,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
  }));

  const standingsMap = new Map<string, Standing>(standings.map(s => [s.teamId, s]));

  const playedMatches = matches.filter(m => m.team1_score !== null && m.team2_score !== null);

  playedMatches.forEach(match => {
    if (match.team1_score === null || match.team2_score === null) {
      return;
    }

    const team1Standing = standingsMap.get(match.team1_id);
    const team2Standing = standingsMap.get(match.team2_id);

    if (!team1Standing || !team2Standing) {
      return;
    }

    team1Standing.played += 1;
    team2Standing.played += 1;

    team1Standing.goalsFor += match.team1_score;
    team1Standing.goalsAgainst += match.team2_score;
    team2Standing.goalsFor += match.team2_score;
    team2Standing.goalsAgainst += match.team1_score;

    team1Standing.goalDifference = team1Standing.goalsFor - team1Standing.goalsAgainst;
    team2Standing.goalDifference = team2Standing.goalsFor - team2Standing.goalsAgainst;

    if (match.team1_score > match.team2_score) {
      team1Standing.wins += 1;
      team1Standing.points += 3;
      team2Standing.losses += 1;
    } else if (match.team1_score < match.team2_score) {
      team2Standing.wins += 1;
      team2Standing.points += 3;
      team1Standing.losses += 1;
    } else {
      team1Standing.draws += 1;
      team1Standing.points += 1;
      team2Standing.draws += 1;
      team2Standing.points += 1;
    }
  });

  const sortedStandings = Array.from(standingsMap.values()).sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    return b.goalsFor - a.goalsFor;
  });

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Classificação</h2>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px] text-center">#</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-center">P</TableHead>
              <TableHead className="text-center">J</TableHead>
              <TableHead className="text-center">V</TableHead>
              <TableHead className="text-center">E</TableHead>
              <TableHead className="text-center">D</TableHead>
              <TableHead className="text-center">GP</TableHead>
              <TableHead className="text-center">GC</TableHead>
              <TableHead className="text-center">SG</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStandings.map((standing, index) => (
              <TableRow key={standing.teamId}>
                <TableCell className="font-medium text-center">{index + 1}</TableCell>
                <TableCell>{standing.teamName}</TableCell>
                <TableCell className="text-center font-bold">{standing.points}</TableCell>
                <TableCell className="text-center">{standing.played}</TableCell>
                <TableCell className="text-center">{standing.wins}</TableCell>
                <TableCell className="text-center">{standing.draws}</TableCell>
                <TableCell className="text-center">{standing.losses}</TableCell>
                <TableCell className="text-center">{standing.goalsFor}</TableCell>
                <TableCell className="text-center">{standing.goalsAgainst}</TableCell>
                <TableCell className="text-center">{standing.goalDifference}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
       {playedMatches.length === 0 && teams.length > 0 && (
         <div className="text-center py-4">
            <p className="text-gray-500">Nenhuma partida com placar definido para gerar a classificação.</p>
          </div>
       )}
    </div>
  );
}