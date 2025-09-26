import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDown, ArrowUp, Minus } from "lucide-react"; // Import icons for position change
import { Team, Match } from '@/types';
import { Link } from 'react-router-dom'; // Import Link

interface LeaderboardProps {
  teams: Team[];
  matches: Match[];
  isPublicView?: boolean; // New prop to determine link path
  pointsForWin?: number; // New prop for points rule
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

export function Leaderboard({ teams, matches, isPublicView = false, pointsForWin = 3 }: LeaderboardProps) {
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
      team1Standing.points += pointsForWin;
      team2Standing.losses += 1;
    } else if (match.team1_score < match.team2_score) {
      team2Standing.wins += 1;
      team2Standing.points += pointsForWin;
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
      standing.percentage = (standing.points / (standing.played * pointsForWin)) * 100;
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
  sortedStandings.forEach((standing, index) => {
    if (index % 3 === 0) standing.positionChange = 'up';
    else if (index % 3 === 1) standing.positionChange = 'down';
    else standing.positionChange = 'same';
  });


  return (
    <div>
      <div className="rounded-md border overflow-x-auto"> {/* Ensure horizontal scroll as fallback */}
        <Table className="min-w-full table-fixed"> {/* Use table-fixed for consistent column widths */}
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px] text-center px-1 py-1 text-xs whitespace-nowrap">Pos.</TableHead>
              <TableHead className="w-[120px] px-1 py-1 text-xs">Time</TableHead> {/* Fixed width for team name */}
              <TableHead className="w-[25px] text-center px-1 py-1 text-xs whitespace-nowrap">P</TableHead>
              <TableHead className="w-[25px] text-center px-1 py-1 text-xs whitespace-nowrap">J</TableHead>
              <TableHead className="w-[25px] text-center px-1 py-1 text-xs whitespace-nowrap">V</TableHead>
              <TableHead className="w-[25px] text-center px-1 py-1 text-xs whitespace-nowrap">E</TableHead>
              <TableHead className="w-[25px] text-center px-1 py-1 text-xs whitespace-nowrap">D</TableHead>
              <TableHead className="w-[35px] text-center px-1 py-1 text-xs whitespace-nowrap">GP</TableHead>
              <TableHead className="w-[35px] text-center px-1 py-1 text-xs whitespace-nowrap">GC</TableHead>
              <TableHead className="w-[35px] text-center px-1 py-1 text-xs whitespace-nowrap">SG</TableHead>
              <TableHead className="w-[45px] text-center px-1 py-1 text-xs whitespace-nowrap">%</TableHead>
              <TableHead className="w-[70px] text-center px-1 py-1 text-xs whitespace-nowrap">Recentes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStandings.map((standing, index) => (
              <TableRow key={standing.teamId}>
                <TableCell className="font-medium text-center px-1 py-1 text-xs whitespace-nowrap">{index + 1}</TableCell>
                <TableCell className="flex items-center gap-1 px-1 py-1">
                  {standing.logo_url && <img src={standing.logo_url} alt={standing.teamName} className="h-5 w-5 object-contain flex-shrink-0" />}
                  <Link to={isPublicView ? `/public/team/${standing.teamId}` : `/team/${standing.teamId}`} className="hover:underline text-[0.65rem] leading-tight text-wrap"> {/* Smaller font, tighter line height, allow wrap */}
                    {standing.teamName}
                  </Link>
                </TableCell>
                <TableCell className="text-center font-bold px-1 py-1 text-xs whitespace-nowrap">{standing.points}</TableCell>
                <TableCell className="text-center px-1 py-1 text-xs whitespace-nowrap">{standing.played}</TableCell>
                <TableCell className="text-center px-1 py-1 text-xs whitespace-nowrap">{standing.wins}</TableCell>
                <TableCell className="text-center px-1 py-1 text-xs whitespace-nowrap">{standing.draws}</TableCell>
                <TableCell className="text-center px-1 py-1 text-xs whitespace-nowrap">{standing.losses}</TableCell>
                <TableCell className="text-center px-1 py-1 text-xs whitespace-nowrap">{standing.goalsFor}</TableCell>
                <TableCell className="text-center px-1 py-1 text-xs whitespace-nowrap">{standing.goalsAgainst}</TableCell>
                <TableCell className="text-center px-1 py-1 text-xs whitespace-nowrap">{standing.goalDifference}</TableCell>
                <TableCell className="text-center px-1 py-1 text-xs whitespace-nowrap">{standing.percentage.toFixed(1)}%</TableCell>
                <TableCell className="text-center px-1 py-1 whitespace-nowrap">
                  <div className="flex justify-center gap-0.5"> {/* Smaller gap for circles */}
                    {standing.recentForm.map((form, i) => (
                      <span
                        key={i}
                        className={`w-2.5 h-2.5 flex items-center justify-center text-xs font-bold rounded-full
                          ${form === 'W' ? 'bg-green-500' :
                            form === 'D' ? 'bg-gray-400' :
                            form === 'L' ? 'bg-red-500' :
                            'bg-gray-200'
                          }`}
                      >
                        {/* Removed text content to make circles smaller */}
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