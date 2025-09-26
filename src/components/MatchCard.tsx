import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditMatchDialog } from "./EditMatchDialog";
import { DeleteMatchDialog } from "./DeleteMatchDialog";
import { QuickScoreUpdateDrawer } from "./QuickScoreUpdateDrawer"; // Import the new drawer
import { MoreHorizontal, X, CalendarIcon, MapPin, SquareDot, MinusCircle, Goal, Shirt } from "lucide-react"; // Added Shirt icon
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Group, Round, Team, Match } from '@/types'; // Import types from centralized types

interface MatchCardProps {
  match: Match;
  onMatchUpdated: () => void;
  onMatchDeleted: () => void;
  isEven: boolean;
  groups: Group[];
  rounds: Round[];
  teams: Team[]; // Added teams prop
  isPublicView?: boolean;
  publicRoundId?: string; // New prop for public editing
  publicRoundToken?: string; // New prop for public editing
}

export function MatchCard({ match, onMatchUpdated, onMatchDeleted, isEven, groups, rounds, teams, isPublicView = false, publicRoundId, publicRoundToken }: MatchCardProps) {
  const matchDate = match.match_date ? new Date(match.match_date) : null;
  const isPlayed = match.team1_score !== null && match.team2_score !== null;

  const team1Goals = match.goals.filter(g => g.team_id === match.team1_id);
  const team2Goals = match.goals.filter(g => g.team_id === match.team2_id);

  return (
    <Card className={cn(
      "w-full",
      isEven ? "bg-card" : "bg-muted/50 dark:bg-muted/20"
    )}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-muted-foreground mb-2 gap-1">
          <div className="flex items-center gap-1 flex-wrap">
            {match.location && (
              <>
                <MapPin className="h-3 w-3" />
                <span>{match.location}</span>
              </>
            )}
            {match.groups?.name && (
              <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs dark:bg-gray-800">
                {match.groups.name}
              </span>
            )}
            {match.rounds?.name && (
              <span className="ml-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs dark:bg-gray-800">
                {match.rounds.name}
              </span>
            )}
          </div>
          {matchDate && (
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              <span>{format(matchDate, "dd/MM/yyyy • HH:mm", { locale: ptBR })}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 sm:gap-3"> {/* Changed to flex for better control */}
          {/* Team 1 */}
          <div className="flex items-center gap-2 justify-end flex-1 min-w-0"> {/* flex-1 and min-w-0 */}
            <span className="font-medium text-sm sm:text-base text-right truncate" title={match.team1.name}>{match.team1.name}</span>
            {match.team1.logo_url && (
              <img src={match.team1.logo_url} alt={match.team1.name} className="h-8 w-8 object-contain flex-shrink-0" loading="lazy" />
            )}
          </div>

          {/* Scores / Separator */}
          <div className="flex items-center gap-2 sm:gap-3 text-xl sm:text-2xl font-bold flex-shrink-0"> {/* flex-shrink-0 to keep scores centered */}
            <span>{isPlayed ? (match.team1_score ?? '-') : ''}</span>
            <div className="p-1 rounded-full bg-primary text-primary-foreground">
              <X className="h-4 w-4" /> 
            </div>
            <span>{isPlayed ? (match.team2_score ?? '-') : ''}</span>
          </div>

          {/* Team 2 */}
          <div className="flex items-center gap-2 justify-start flex-1 min-w-0"> {/* flex-1 and min-w-0 */}
            {match.team2.logo_url && (
              <img src={match.team2.logo_url} alt={match.team2.name} className="h-8 w-8 object-contain flex-shrink-0" loading="lazy" />
            )}
            <span className="font-medium text-sm sm:text-base text-left truncate" title={match.team2.name}>{match.team2.name}</span>
          </div>
        </div>

        {/* Goal Scorers Display */}
        {(team1Goals.length > 0 || team2Goals.length > 0) && (
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-3 border-t pt-2">
            <div className="flex flex-col items-end pr-2 border-r">
              {team1Goals.map(goal => (
                <span key={goal.id} className="flex items-center gap-1">
                  {goal.jersey_number && <Shirt className="h-3 w-3" />}
                  {goal.jersey_number && <span className="font-bold">{goal.jersey_number}</span>}
                  {goal.player_name}
                </span>
              ))}
            </div>
            <div className="flex flex-col items-start pl-2">
              {team2Goals.map(goal => (
                <span key={goal.id} className="flex items-center gap-1">
                  {goal.jersey_number && <Shirt className="h-3 w-3" />}
                  {goal.jersey_number && <span className="font-bold">{goal.jersey_number}</span>}
                  {goal.player_name}
                </span>
              ))}
            </div>
          </div>
        )}

        {isPlayed && (
          <div className="hidden sm:grid grid-cols-2 gap-2 text-sm text-muted-foreground mt-3 border-t pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <SquareDot className="h-3 w-3 text-yellow-500" /> Amarelos:
              </div>
              <span>{match.team1_yellow_cards ?? 0} - {match.team2_yellow_cards ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <SquareDot className="h-3 w-3 text-red-500" /> Vermelhos:
              </div>
              <span>{match.team1_red_cards ?? 0} - {match.team2_red_cards ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <MinusCircle className="h-3 w-3" /> Faltas:
              </div>
              <span>{match.team1_fouls ?? 0} - {match.team2_fouls ?? 0}</span>
            </div>
            {match.notes && (
              <div className="col-span-2 text-xs text-gray-500 mt-1">
                Notas: {match.notes}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end items-center mt-2 gap-2">
          {/* QuickScoreUpdateDrawer is always available, but its behavior changes based on isPublicView */}
          <QuickScoreUpdateDrawer
            match={match}
            onMatchUpdated={onMatchUpdated}
            isPublicView={isPublicView}
            publicRoundId={publicRoundId}
            publicRoundToken={publicRoundToken}
          >
            <Button variant="outline" size="sm" className="flex items-center gap-1 px-2 py-1 h-auto">
              <Goal className="h-4 w-4" />
              <span className="text-xs">Placar Rápido</span> {/* Always visible, smaller text */}
            </Button>
          </QuickScoreUpdateDrawer>

          {/* Dropdown menu for authenticated actions (edit/delete) */}
          {!isPublicView && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <EditMatchDialog match={match} groups={groups} rounds={rounds} teams={teams} onMatchUpdated={onMatchUpdated}>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Editar Detalhes</DropdownMenuItem>
                </EditMatchDialog>
                <DeleteMatchDialog match={match} onMatchDeleted={onMatchDeleted}>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">Excluir Partida</DropdownMenuItem>
                </DeleteMatchDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}