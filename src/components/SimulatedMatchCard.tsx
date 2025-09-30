import React, { memo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { X, CalendarIcon, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Match } from '@/types';

interface SimulatedMatch extends Match {
  simulated_team1_score: number | null;
  simulated_team2_score: number | null;
}

interface SimulatedMatchCardProps {
  match: SimulatedMatch;
  onScoreChange: (matchId: string, team: 'team1' | 'team2', score: number | null) => void;
  isEven: boolean;
}

export const SimulatedMatchCard = memo(function SimulatedMatchCard({ match, onScoreChange, isEven }: SimulatedMatchCardProps) {
  const matchDate = match.match_date ? new Date(match.match_date) : null;

  const handleTeam1ScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      onScoreChange(match.id, 'team1', null);
    } else {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue)) { // Only update if it's a valid number
        onScoreChange(match.id, 'team1', numValue);
      }
    }
  };

  const handleTeam2ScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      onScoreChange(match.id, 'team2', null);
    } else {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue)) { // Only update if it's a valid number
        onScoreChange(match.id, 'team2', numValue);
      }
    }
  };

  return (
    <Card className={cn(
      "w-full",
      isEven ? "bg-card" : "bg-muted/50 dark:bg-muted/20"
    )}>
      <CardContent className="p-3">
        <div className="flex flex-wrap justify-between items-center text-xs text-muted-foreground mb-2 gap-y-1">
          <div className="flex items-center gap-1">
            {match.location && (
              <>
                <MapPin className="h-3 w-3" />
                <span>{match.location}</span>
              </>
            )}
            {match.groups?.name && (
              <span className="ml-1 px-1.5 py-0.5 bg-gray-100 rounded-full text-[0.6rem] dark:bg-gray-800">
                {match.groups.name}
              </span>
            )}
            {match.rounds?.name && (
              <span className="ml-1 px-1.5 py-0.5 bg-gray-100 rounded-full text-[0.6rem] dark:bg-gray-800">
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

        <div className="grid grid-cols-3 items-center text-center gap-1">
          <div className="flex flex-col items-center justify-center gap-0.5">
            {match.team1.logo_url && (
              <img src={match.team1.logo_url} alt={match.team1.name} className="h-8 w-8 object-contain" loading="lazy" />
            )}
            <span className="font-medium text-[0.65rem] leading-tight truncate w-full" title={match.team1.name}>{match.team1.name}</span>
          </div>

          <div className="flex items-center justify-center text-sm font-bold gap-1">
            <Input
              type="text" // Alterado para 'text'
              inputMode="numeric" // Sugere teclado numérico em mobile
              pattern="[0-9]*" // Permite apenas dígitos
              value={match.simulated_team1_score !== null ? String(match.simulated_team1_score) : ''}
              onChange={handleTeam1ScoreChange}
              className="w-10 h-8 text-center text-sm"
              placeholder="0"
            />
            <div className="p-0 rounded-full bg-primary text-primary-foreground">
              <X className="h-2.5 w-2.5" />
            </div>
            <Input
              type="text" // Alterado para 'text'
              inputMode="numeric" // Sugere teclado numérico em mobile
              pattern="[0-9]*" // Permite apenas dígitos
              value={match.simulated_team2_score !== null ? String(match.simulated_team2_score) : ''}
              onChange={handleTeam2ScoreChange}
              className="w-10 h-8 text-center text-sm"
              placeholder="0"
            />
          </div>

          <div className="flex flex-col items-center justify-center gap-0.5">
            {match.team2.logo_url && (
              <img src={match.team2.logo_url} alt={match.team2.name} className="h-8 w-8 object-contain" loading="lazy" />
            )}
            <span className="font-medium text-[0.65rem] leading-tight truncate w-full" title={match.team2.name}>{match.team2.name}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});