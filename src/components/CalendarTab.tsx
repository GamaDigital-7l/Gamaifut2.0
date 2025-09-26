import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Importar useMemo
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MatchCard } from './MatchCard';
import { Match, Group, Round, Team } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

interface CalendarTabProps {
  championshipId: string;
  matches: Match[];
  groups: Group[];
  rounds: Round[];
  teams: Team[];
  isLoading: boolean;
  onDataChange: () => void;
}

export function CalendarTab({ championshipId, matches, groups, rounds, teams, isLoading, onDataChange }: CalendarTabProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const matchesOnSelectedDate = useMemo(() => {
    if (!selectedDate) {
      return [];
    }
    return matches.filter(match => 
      match.match_date && isSameDay(new Date(match.match_date), selectedDate)
    ).sort((a, b) => {
      const dateA = a.match_date ? new Date(a.match_date).getTime() : 0;
      const dateB = b.match_date ? new Date(b.match_date).getTime() : 0;
      return dateA - dateB;
    });
  }, [selectedDate, matches]); // Recalculate only when selectedDate or matches change

  const modifiers = useMemo(() => ({
    hasMatches: matches.map(match => match.match_date ? new Date(match.match_date) : null).filter(Boolean) as Date[],
  }), [matches]); // Recalculate only when matches change

  const modifiersClassNames = {
    hasMatches: "bg-primary text-primary-foreground rounded-full",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendário de Jogos</CardTitle>
        <CardDescription>Visualize e gerencie as partidas por data.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col lg:flex-row gap-6">
        <div className="flex-shrink-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={ptBR}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            className="rounded-md border"
          />
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-semibold mb-4">
            Partidas em {selectedDate ? format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR }) : 'Nenhuma data selecionada'}
          </h3>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : matchesOnSelectedDate.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <p className="text-gray-500">Nenhuma partida agendada para esta data.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {matchesOnSelectedDate.map((match, index) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onMatchUpdated={onDataChange}
                  onMatchDeleted={onDataChange}
                  isEven={index % 2 === 0}
                  groups={groups}
                  rounds={rounds}
                  teams={teams}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}