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
import { Leaderboard } from '@/components/Leaderboard'; // Reusing existing Leaderboard

interface SimulatedMatch extends Match {
  simulated_team1_score: number | null;
  simulated_team2_score: number | null;
}

const SimulateResults = () => {
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [selectedChampionshipId, setSelectedChampionshipId] = useState<string | undefined>(undefined);
  const [loadingChampionships, setLoadingChampionships] = useState(true);
  const [loadingChampionshipData, setLoadingChampionshipData] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [originalMatches, setOriginalMatches] = useState<Match[]>([]);
  const [simulatedMatches, setSimulatedMatches] = useState<SimulatedMatch[]>([]);
  const [championshipDetails, setChampionshipDetails] = useState<Championship | null>(null);

  const fetchChampionships = useCallback(async () => {
    setLoadingChampionships(true);
    const { data, error } = await supabase
      .from('championships')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      showError('Erro ao carregar campeonatos: ' + error.message);
      setChampionships([]);
    } else {
      setChampionships(data as Championship[]);
    }
    setLoadingChampionships(false);
  }, []);

  const fetchChampionshipData = useCallback(async (champId: string) => {
    setLoadingChampionshipData(true);
    try {
      const [champRes, teamsRes, groupsRes, roundsRes, matchesRes] = await Promise.all([
        supabase.from('championships').select('id, name, description, city, state, logo_url, user_id, points_for_win, sport_type, gender, age_category, tie_breaker_order').eq('id', champId).single(),
        supabase.from('teams').select('id, name, logo_url, championship_id, user_id, group_id, groups(name)').eq('championship_id', champId),
        supabase.from('groups').select('id, name, championship_id, created_at').eq('championship_id', champId),
        supabase.from('rounds').select('id, name, order_index, type, championship_id, created_at, public_edit_token').eq('championship_id', champId),
        supabase.from('matches').select(`id, team1_id, team2_id, team1_score, team2_score, match_date, location, group_id, round_id, team1:teams!matches_team1_id_fkey(id, name, logo_url), team2:teams!matches_team2_id_fkey(id, name, logo_url), groups(name), rounds(name), goals:match_goals(id, match_id, team_id, player_name, jersey_number)`).eq('championship_id', champId).order('match_date', { ascending: true }),
      ]);

      if (champRes.error) throw new Error(champRes.error.message);
      if (teamsRes.error) throw new Error(teamsRes.error.message);
      if (groupsRes.error) throw new Error(groupsRes.error.message);
      if (roundsRes.error) throw new Error(roundsRes.error.message);
      if (matchesRes.error) throw new Error(matchesRes.error.message);

      setChampionshipDetails(champRes.data as Championship);
      setTeams(teamsRes.data as Team[]);
      setGroups(groupsRes.data as Group[]);
      setRounds(roundsRes.data as Round[]);
      setOriginalMatches(matchesRes.data as Match[]);
      setSimulatedMatches(matchesRes.data.map(match => ({
        ...match,
        simulated_team1_score: match.team1_score,
        simulated_team2_score: match.team2_score,
      })) as SimulatedMatch[]);

    } catch (err: any) {
      showError('Erro ao carregar dados do campeonato: ' + err.message);
      console.error('Error fetching championship data for simulation:', err);
      setChampionshipDetails(null);
      setTeams([]);
      setGroups([]);
      setRounds([]);
      setOriginalMatches([]);
      setSimulatedMatches([]);
    } finally {
      setLoadingChampionshipData(false);
    }
  }, []);

  useEffect(() => {
    fetchChampionships();
  }, [fetchChampionships]);

  useEffect(() => {
    if (selectedChampionshipId) {
      fetchChampionshipData(selectedChampionshipId);
    } else {
      setChampionshipDetails(null);
      setTeams([]);
      setGroups([]);
      setRounds([]);
      setOriginalMatches([]);
      setSimulatedMatches([]);
    }
  }, [selectedChampionshipId, fetchChampionshipData]);

  const handleScoreChange = useCallback((matchId: string, team: 'team1' | 'team2', score: number | null) => {
    setSimulatedMatches(prevMatches =>
      prevMatches.map(m =>
        m.id === matchId
          ? { ...m, [`simulated_${team}_score`]: score }
          : m
      )
    );
  }, []);

  const simulatedLeaderboardMatches = useMemo(() => {
    return simulatedMatches.map(match => ({
      ...match,
      team1_score: match.simulated_team1_score,
      team2_score: match.simulated_team2_score,
    }));
  }, [simulatedMatches]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Simular Resultados</h1>
      <p className="text-muted-foreground">
        Selecione um campeonato e simule os resultados das partidas para ver como a classificação seria afetada.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Selecionar Campeonato</CardTitle>
          <CardDescription>Escolha um campeonato para iniciar a simulação.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingChampionships ? (
            <Skeleton className="h-10 w-full max-w-[300px]" />
          ) : (
            <Select
              value={selectedChampionshipId}
              onValueChange={setSelectedChampionshipId}
            >
              <SelectTrigger className="w-full max-w-[300px]">
                <SelectValue placeholder="Selecione um Campeonato" />
              </SelectTrigger>
              <SelectContent>
                {championships.map(champ => (
                  <SelectItem key={champ.id} value={champ.id}>{champ.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {selectedChampionshipId && (
        loadingChampionshipData ? (
          <Card>
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
            <CardContent><Skeleton className="h-40 w-full" /></CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Simulated Matches Input */}
            <Card>
              <CardHeader>
                <CardTitle>Partidas para Simular</CardDescription>
                <CardDescription>Altere os placares para ver o impacto na classificação.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {simulatedMatches.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <p className="text-gray-500">Nenhuma partida encontrada para este campeonato.</p>
                  </div>
                ) : (
                  simulatedMatches.map((match, index) => (
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
                {championshipDetails && (
                  <Leaderboard
                    teams={teams}
                    matches={simulatedLeaderboardMatches}
                    isPublicView={true} // Treat as public view for display purposes
                    pointsForWin={championshipDetails.points_for_win}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        )
      )}
    </div>
  );
};

export default SimulateResults;