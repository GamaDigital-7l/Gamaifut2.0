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

type Team = { id: string; name: string; logo_url: string | null; group_id: string | null; };
type Group = { id: string; name: string; };
type Round = { id: string; name: string; order_index: number; type: string; };
type Match = {
  id: string; team1_id: string; team2_id: string; team1_score: number | null; team2_score: number | null;
  match_date: string | null; location: string | null; group_id: string | null; round_id: string | null;
  assigned_official_id: string | null; team1_yellow_cards: number | null; team2_yellow_cards: number | null;
  team1_red_cards: number | null; team2_red_cards: number | null; team1_fouls: number | null;
  team2_fouls: number | null; notes: string | null; team1: Team; team2: Team;
  groups: { name: string } | null; rounds: { name: string } | null;
};

const fetchData = async (championshipId: string) => {
  const [teamsRes, groupsRes, roundsRes, matchesRes] = await Promise.all([
    supabase.from('teams').select('*').eq('championship_id', championshipId),
    supabase.from('groups').select('*').eq('championship_id', championshipId),
    supabase.from('rounds').select('*').eq('championship_id', championshipId).order('order_index', { ascending: true }),
    supabase.from('matches').select(`*, team1:teams!matches_team1_id_fkey(*), team2:teams!matches_team2_id_fkey(*), groups(name), rounds(name)`).eq('championship_id', championshipId).order('match_date', { ascending: true })
  ]);
  if (teamsRes.error || groupsRes.error || roundsRes.error || matchesRes.error) {
    console.error(teamsRes.error, groupsRes.error, roundsRes.error, matchesRes.error);
    throw new Error('Failed to fetch data for matches tab');
  }
  return {
    teams: teamsRes.data as Team[],
    groups: groupsRes.data as Group[],
    rounds: roundsRes.data as Round[],
    matches: matchesRes.data as Match[],
  };
};

interface MatchesTabProps {
  championshipId: string;
}

export function MatchesTab({ championshipId }: MatchesTabProps) {
  const queryClient = useQueryClient();
  const [selectedRoundFilter, setSelectedRoundFilter] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['matchesTab', championshipId],
    queryFn: () => fetchData(championshipId),
  });

  const { teams = [], groups = [], rounds = [], matches = [] } = data || {};

  const invalidateAndRefetch = () => {
    queryClient.invalidateQueries({ queryKey: ['matchesTab', championshipId] });
    queryClient.invalidateQueries({ queryKey: ['leaderboard', championshipId] });
  };

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
            <GenerateMatchesDialog championshipId={championshipId} teams={teams} groups={groups} rounds={rounds} onMatchesGenerated={invalidateAndRefetch} />
            <CreateMatchDialog championshipId={championshipId} teams={teams} groups={groups} rounds={rounds} onMatchCreated={invalidateAndRefetch} />
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
          <div className="space-y-2">{filteredMatches.map((match: Match, index: number) => (<MatchCard key={match.id} match={match} onMatchUpdated={invalidateAndRefetch} onMatchDeleted={invalidateAndRefetch} isEven={index % 2 === 0} groups={groups} rounds={rounds} isPublicView={false} />))}</div>
        )}
      </CardContent>
    </Card>
  );
}