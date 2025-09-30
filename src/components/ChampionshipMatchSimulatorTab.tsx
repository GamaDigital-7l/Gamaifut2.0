import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Championship, Team, Match, Group, Round } from '@/types';
import { showError } from '@/utils/toast';
import { SimulatedMatchCard } from '@/components/SimulatedMatchCard';
import { Leaderboard } from '@/components/Leaderboard';

interface SimulatedMatch extends Match {
  simulated_team1_score: number | null;
  simulated_team2_score: number | null;
}

interface ChampionshipMatchSimulatorTabProps {
  championship: Championship;
  teams: Team[];
  groups: Group[];
  rounds: Round[];
  matches: Match[];
  isLoading: boolean;
}

export function ChampionshipMatchSimulatorTab({
  championship,
  teams,
  groups,
  rounds,
  matches,
  isLoading,
}: ChampionshipMatchSimulatorTabProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | 'all'>('all');
  const [simulatedMatches, setSimulatedMatches] = useState<SimulatedMatch[]>([]);

  // Initialize simulated matches with only unplayed matches from props
  useEffect(() => {
    const unplayedMatches = matches.filter(m => m.team1_score === null && m.team2_score === null);
    setSimulatedMatches(unplayedMatches.map(match => ({
      ...match,
      simulated_team1_score: null, // Start with null for unplayed matches
      simulated_team2_score: null, // Start with null for unplayed matches
    })));
  }, [matches]); // Re-initialize if the original matches prop changes

  const handleScoreChange = useCallback((matchId: string, team: 'team1' | 'team2', score: number | null) => {
    setSimulatedMatches(prevMatches =>
      prevMatches.map(m =>
        m.id === matchId
          ? { ...m, [`simulated_${team}_score`]: score }
          : m
      )
    );
  }, []);

  const filteredSimulatedMatches = useMemo(() => {
    return simulatedMatches.filter(match =>
      selectedGroupId === 'all' || match.group_id === selectedGroupId
    );
  }, [simulatedMatches, selectedGroupId]);

  const teamsForLeaderboard = useMemo(() => {
    return selectedGroupId === 'all'
      ? teams
      : teams.filter(team => team.group_id === selectedGroupId);
  }, [teams, selectedGroupId]);

  const matchesForLeaderboard = useMemo(() => {
    // Combine original played matches with simulated unplayed matches
    const playedOriginalMatches = matches.filter(m => m.team1_score !== null && m.team2_score !== null);
    const combinedMatches = [
      ...playedOriginalMatches,
      ...filteredSimulatedMatches.map(match => ({
        ...match,
        team1_score: match.simulated_team1_score,
        team2_score: match.simulated_team2_score,
      })),
    ];
    return combinedMatches.filter(match =>
      selectedGroupId === 'all' || match.group_id === selectedGroupId
    );
  }, [matches, filteredSimulatedMatches, selectedGroupId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-40 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Simular Resultados</CardTitle>
          <CardDescription>
            Altere os placares das partidas não jogadas para ver o impacto na classificação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="group-filter" className="sr-only">Filtrar por Grupo</Label>
            <Select
              value={selectedGroupId}
              onValueChange={setSelectedGroupId}
            >
              <SelectTrigger id="group-filter" className="w-full max-w-[300px]">
                <SelectValue placeholder="Todos os Grupos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Grupos</SelectItem>
                {groups.map(group => (
                  <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Simulated Matches Input */}
            <Card>
              <CardHeader>
                <CardTitle>Partidas para Simular</CardTitle>
                <CardDescription>Altere os placares para ver o impacto na classificação.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {filteredSimulatedMatches.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <p className="text-gray-500">Nenhuma partida não jogada encontrada para este grupo/campeonato.</p>
                  </div>
                ) : (
                  filteredSimulatedMatches.map((match, index) => (
                    <SimulatedMatchCard
                      key={match.id}
                      match={match}
                      onScoreChange={handleScoreChange}
                      isEven={index % 2 === 0}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Simulated Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle>Classificação Simulada</CardTitle>
                <CardDescription>Resultados da simulação.</CardDescription>
              </CardHeader>
              <CardContent>
                <Leaderboard
                  teams={teamsForLeaderboard}
                  matches={matchesForLeaderboard}
                  isPublicView={false} // This is an admin/owner view
                  pointsForWin={championship.points_for_win}
                />
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}