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
import { OfficialMatchUpdateDialog } from "./OfficialMatchUpdateDialog";
import { QuickScoreUpdateDrawer } from "./QuickScoreUpdateDrawer"; // Import the new drawer
import { MoreHorizontal, X, CalendarIcon, MapPin, SquareDot, MinusCircle, Goal } from "lucide-react";
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
  isOfficialView?: boolean;
  isPublicView?: boolean;
}

export function MatchCard({ match, onMatchUpdated, onMatchDeleted, isEven, groups, rounds, isOfficialView = false, isPublicView = false }: MatchCardProps) {
  const matchDate = match.match_date ? new Date(match.match_date) : null;
  const isPlayed = match.team1_score !== null && match.team2_score !== null;

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

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-2 sm:gap-x-3">
          {/* Team 1 */}
          <div className="flex items-center gap-2 justify-end min-w-0">
            <span className="font-medium text-sm sm:text-base text-right truncate" title={match.team1.name}>{match.team1.name}</span>
            {match.team1.logo_url && (
              <img src={match.team1.logo_url} alt={match.team1.name} className="h-8 w-8 object-contain flex-shrink-0" />
            )}
          </div>

          {/* Scores / Separator */}
          <div className="flex items-center gap-2 sm:gap-3 text-xl sm:text-2xl font-bold">
            <span>{isPlayed ? (match.team1_score ?? '-') : ''}</span>
            <div className="p-1 rounded-full bg-primary text-primary-foreground">
              <X className="h-4 w-4" /> 
            </div>
            <span>{isPlayed ? (match.team2_score ?? '-') : ''}</span>
          </div>

          {/* Team 2 */}
          <div className="flex items-center gap-2 justify-start min-w-0">
            {match.team2.logo_url && (
              <img src={match.team2.logo_url} alt={match.team2.name} className="h-8 w-8 object-contain flex-shrink-0" />
            )}
            <span className="font-medium text-sm sm:text-base text-left truncate" title={match.team2.name}>{match.team2.name}</span>
          </div>
        </div>

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
          {isPublicView ? null : (
            isOfficialView ? (
              <OfficialMatchUpdateDialog match={match} onMatchUpdated={onMatchUpdated}>
                <Button variant="outline" size="sm">Atualizar Partida</Button>
              </OfficialMatchUpdateDialog>
            ) : (
              <>
                <QuickScoreUpdateDrawer match={match} onMatchUpdated={onMatchUpdated}>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Goal className="h-4 w-4" />
                    <span className="hidden sm:inline">Placar Rápido</span>
                  </Button>
                </QuickScoreUpdateDrawer>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <EditMatchDialog match={match} groups={groups} rounds={rounds} onMatchUpdated={onMatchUpdated}>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Editar Detalhes</DropdownMenuItem>
                    </EditMatchDialog>
                    <DeleteMatchDialog match={match} onMatchDeleted={onMatchDeleted}>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">Excluir Partida</DropdownMenuItem>
                    </DeleteMatchDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}