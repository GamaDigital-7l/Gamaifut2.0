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
import { MoreHorizontal, Swords, CalendarIcon, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils"; // Import cn utility

interface Team {
  id: string;
  name: string;
  logo_url: string | null;
}

interface Match {
  id: string;
  team1_id: string;
  team2_id: string;
  team1_score: number | null;
  team2_score: number | null;
  match_date: string | null;
  location: string | null;
  group_id: string | null; // Added group_id
  round_id: string | null; // Added round_id
  team1: Team;
  team2: Team;
  groups: { name: string } | null; // Nested group data
  rounds: { name: string } | null; // Nested round data
}

interface MatchCardProps {
  match: Match;
  onMatchUpdated: () => void;
  onMatchDeleted: () => void;
  isEven: boolean; // New prop for alternating colors
}

export function MatchCard({ match, onMatchUpdated, onMatchDeleted, isEven }: MatchCardProps) {
  const matchDate = match.match_date ? new Date(match.match_date) : null;
  const isPlayed = match.team1_score !== null && match.team2_score !== null;

  return (
    <Card className={cn(
      "w-full",
      isEven ? "bg-card" : "bg-muted/50 dark:bg-muted/20" // Alternating background
    )}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
          <div className="flex items-center gap-1">
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

        <div className="flex items-center justify-between gap-2">
          {/* Team 1 */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <span className="font-medium text-right">{match.team1.name}</span>
            {match.team1.logo_url && (
              <img src={match.team1.logo_url} alt={match.team1.name} className="h-8 w-8 object-contain" />
            )}
          </div>

          {/* Scores / Separator */}
          <div className="flex items-center gap-2 text-xl font-bold">
            <span>{isPlayed ? (match.team1_score ?? '-') : ''}</span>
            <div className="p-1 rounded-full bg-primary text-primary-foreground"> {/* Enhanced Swords icon */}
              <Swords className="h-4 w-4" />
            </div>
            <span>{isPlayed ? (match.team2_score ?? '-') : ''}</span>
          </div>

          {/* Team 2 */}
          <div className="flex items-center gap-2 flex-1 justify-start">
            {match.team2.logo_url && (
              <img src={match.team2.logo_url} alt={match.team2.name} className="h-8 w-8 object-contain" />
            )}
            <span className="font-medium text-left">{match.team2.name}</span>
          </div>
        </div>

        <div className="flex justify-end mt-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <EditMatchDialog match={match} onMatchUpdated={onMatchUpdated}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Editar Partida</DropdownMenuItem>
              </EditMatchDialog>
              <DeleteMatchDialog match={match} onMatchDeleted={onMatchDeleted}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">Excluir Partida</DropdownMenuItem>
              </DeleteMatchDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}