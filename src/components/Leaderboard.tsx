import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDown, ArrowUp, Minus } from "lucide-react"; // Import icons for position change
import { Team } from '@/pages/ChampionshipDetail'; // Import Team type from ChampionshipDetail

interface Match {
  id: string;
  team1_id: string;
  team2_id: string;
  team1_score: number | null;
  team2_score: number | null;
  match_date: string | null; // Needed for recent form sorting
  group_id: string | null; // Added group_id
}

interface LeaderboardProps {
  teams: Team[];
  matches: Match[];
}

interface Standing {
  teamId: string;
  teamName: string;
  logo_url: string | null; // Added logo_url
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  percentage: number;
  recentForm: ('W' | 'D' | 'L' | '-')[]; // Last 5 games, '-' for unplayed
  positionChange: 'up' | 'down' | 'same' | 'new' | null; // Placeholder for now
}

export function Leaderboard({ teams, matches }: LeaderboardProps) {
  if (teams.length === 0) {
    return (
      <div className="text-center py-10 border-2 border-dashed rounded-lg">
        <p className="text-gray-500">Adicione times a este grupo para ver a classificação.</p>
      </div>
    );
  }

  const standings: Standing[] = teams.map(team => ({
    teamId: team.id,
    teamName: team.name,
    logo_url: team.logo_url, // Assign logo_url
    points: 0,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    percentage: 0,
    recentForm: [],
    positionChange: null, // Placeholder
  }));

  const standingsMap = new Map<string, Standing>(standings.map(s => [s.teamId, s]));

  const playedMatches = matches.filter(m => m.team1_score !== null && m.team2_score !== null);

  // Group matches by team for recent form calculation
  const teamMatches = new Map<string, Match[]>();
  teams.forEach(team => teamMatches.set(team.id, []));
  matches.forEach(match => {
    if (match.team1_id) teamMatches.get(match.team1_id)?.push(match);
    if (match.team2_id) teamMatches.get(match.team2_id)?.push(match);
  });

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

  // Calculate percentage and recent form
  standingsMap.forEach(standing => {
    if (standing.played > 0) {
      standing.percentage = (standing.points / (standing.played * 3)) * 100;
    } else {
      standing.percentage = 0;
    }

    const teamRecentMatches = teamMatches.get(standing.teamId)
      ?.filter(m => m.team1_score !== null && m.team2_score !== null) // Only played matches
      .sort((a, b) => new Date(b.match_date || 0).getTime() - new Date(a.match_date || 0).getTime()) // Most recent first
      .slice(0, 5); // Last 5 matches

    standing.recentForm = teamRecentMatches?.map(match => {
      if (match.team1_id === standing.teamId) {
        return match.team1_score! > match.team2_score! ? 'W' : match.team1_score! < match.team2_score! ? 'L' : 'D';
      } else { // match.team2_id === standing.teamId
        return match.team2_score! > match.team1_score! ? 'W' : match.team2_score! < match.team1_score! ? 'L' : 'D';
      }
    }) || [];
    
    // Fill remaining slots with '-' if less than 5 played matches
    while (standing.recentForm.length < 5) {
      standing.recentForm.push('-');
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

  // Placeholder for position change (requires historical data for real implementation)
  // For now, we'll just show a static indicator or a dash.
  sortedStandings.forEach((standing, index) => {
    // This is a placeholder. A real implementation would compare with previous round's standings.
    if (index % 3 === 0) standing.positionChange = 'up';
    else if (index % 3 === 1) standing.positionChange = 'down';
    else standing.positionChange = 'same';
  });


  return (
    <div>
      <div className="rounded-md border overflow-x-auto"> {/* Added overflow-x-auto here */}
        <Table className="min-w-max"> {/* Added min-w-max here */}
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px] text-center px-2 py-2">#</TableHead>
              <TableHead className="w-[30px] text-center px-2 py-2">Var.</TableHead> {/* Position Change */}
              <TableHead className="px-2 py-2">Time</TableHead> {/* Removed explicit width */}
              <TableHead className="text-center px-2 py-2">P</TableHead>
              <TableHead className="text-center px-2 py-2">J</TableHead>
              <TableHead className="text-center px-2 py-2">V</TableHead>
              <TableHead className="text-center px-2 py-2">E</TableHead>
              <TableHead className="text-center px-2 py-2">D</TableHead>
              <TableHead className="text-center px-2 py-2">GP</TableHead>
              <TableHead className="text-center px-2 py-2">GC</TableHead>
              <TableHead className="text-center px-2 py-2">SG</TableHead>
              <TableHead className="text-center px-2 py-2">%</TableHead> {/* Percentage */}
              <TableHead className="text-center px-2 py-2">Recentes</TableHead> {/* Recent Form */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStandings.map((standing, index) => (
              <TableRow key={standing.teamId}>
                <TableCell className="font-medium text-center px-2 py-2">{index + 1}</TableCell>
                <TableCell className="text-center px-2 py-2">
                  {standing.positionChange === 'up' && <ArrowUp className="h-4 w-4 text-green-500 inline" />}
                  {standing.positionChange === 'down' && <ArrowDown className="h-4 w-4 text-red-500 inline" />}
                  {standing.positionChange === 'same' && <Minus className="h-4 w-4 text-gray-500 inline" />}
                  {standing.positionChange === 'new' && <span className="text-blue-500 text-xs">Novo</span>}
                  {!standing.positionChange && <Minus className="h-4 w-4 text-gray-500 inline" />}
                </TableCell>
                <TableCell className="flex items-center gap-2 px-2 py-2"> {/* Removed min-w */}
                  {standing.logo_url && <img src={standing.logo_url} alt={standing.teamName} className="h-6 w-6 object-contain" />}
                  {standing.teamName}
                </TableCell>
                <TableCell className="text-center font-bold px-2 py-2">{standing.points}</TableCell>
                <TableCell className="text-center px-2 py-2">{standing.played}</TableCell>
                <TableCell className="text-center px-2 py-2">{standing.wins}</TableCell>
                <TableCell className="text-center px-2 py-2">{standing.draws}</TableCell>
                <TableCell className="text-center px-2 py-2">{standing.losses}</TableCell>
                <TableCell className="text-center px-2 py-2">{standing.goalsFor}</TableCell>
                <TableCell className="text-center px-2 py-2">{standing.goalsAgainst}</TableCell>
                <TableCell className="text-center px-2 py-2">{standing.goalDifference}</TableCell>
                <TableCell className="text-center px-2 py-2">{standing.percentage.toFixed(1)}%</TableCell>
                <TableCell className="text-center px-2 py-2"> {/* Removed min-w */}
                  <div className="flex justify-center gap-1">
                    {standing.recentForm.map((form, i) => (
                      <span
                        key={i}
                        className={`w-4 h-4 flex items-center justify-center text-xs font-bold rounded-sm
                          ${form === 'W' ? 'bg-green-500 text-white' :
                            form === 'D' ? 'bg-gray-400 text-white' :
                            form === 'L' ? 'bg-red-500 text-white' :
                            'bg-gray-200 text-gray-500'
                          }`}
                      >
                        {form}
                      </span>
                    ))}
                  </div>
                </TableCell>
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