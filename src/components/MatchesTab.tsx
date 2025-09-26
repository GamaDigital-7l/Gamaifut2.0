import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MatchCard } from '@/components/MatchCard';
import { CreateMatchDialog } from '@/components/CreateMatchDialog';
import { GenerateMatchesDialog } from '@/components/GenerateMatchesDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Team, Group, Round, Match } from '@/types';

interface MatchesTabProps {
  championshipId: string;
  teams: Team[];
  groups: Group[];
  rounds: Round[];
  matches: Match[];
  isLoading: boolean;
  onDataChange: () => void; // Callback to notify parent of data changes
}

export function MatchesTab({ championshipId, teams, groups, rounds, matches, isLoading, onDataChange }: MatchesTabProps) {
  // No longer fetching data internally, relying on props
  // const queryClient = useQueryClient();
  // const { data, isLoading } = useQuery({
  //   queryKey: ['matchesTab', championshipId],
  //   queryFn: () => fetchData(championshipId),
  // });

  // const { teams = [], groups = [], rounds = [], matches = [] } = data || {};

  const [selectedRoundFilter, setSelectedRoundFilter] = useState<string>('all');

  const filteredMatches = selectedRoundFilter === 'all'
    ? matches
    : matches.filter((match: Match) => match.round_id === selectedRoundFilter);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center mb-2">
          <div>
            <CardTitle>Jogos</CardTitle>
            <CardDescription>Agende e atualize os resultados.</CardDescription>
          </div>
          <div className="flex gap-2">
            <GenerateMatchesDialog championshipId={championshipId} teams={teams} groups={groups} rounds={rounds} onMatchesGenerated={onDataChange} />
            <CreateMatchDialog championshipId={championshipId} teams={teams} groups={groups} rounds={rounds} onMatchCreated={onDataChange} />
          </div>
        </div>
        {rounds.length > 0 && (
          <div className="flex items-center gap-2">
            <Label htmlFor="round-filter" className="text-right sr-only">Filtrar por Rodada</Label>
            <Select value={selectedRoundFilter} onValueChange={setSelectedRoundFilter}>
              <SelectTrigger id="round-filter" className="w-[180px]"><SelectValue placeholder="Filtrar por Rodada" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Rodadas</SelectItem>
                {rounds.map((round: Round) => (<SelectItem key={round.id} value={round.id}>{round.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed rounded-lg"><p className="text-gray-500">Nenhuma partida agendada.</p></div>
        ) : (
          <div className="space-y-2">{filteredMatches.map((match: Match, index: number) => (<MatchCard key={match.id} match={match} onMatchUpdated={onDataChange} onMatchDeleted={onDataChange} isEven={index % 2 === 0} groups={groups} rounds={rounds} teams={teams} isPublicView={false} />))}</div>
        )}
      </CardContent>
    </Card>
  );
}