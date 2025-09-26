import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PublicHeader } from '@/components/PublicHeader';
import { MatchCard } from '@/components/MatchCard';
import { showError } from '@/utils/toast';
import { Match, Group, Round, Team, Championship } from '@/types';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Trophy } from 'lucide-react';

const PublicRoundScoreboard = () => {
  const { championshipId, roundId, roundToken } = useParams<{ championshipId: string; roundId: string; roundToken: string }>();
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]); // All teams for MatchCard
  const [groups, setGroups] = useState<Group[]>([]); // All groups for MatchCard
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoundData = useCallback(async () => {
    if (!championshipId || !roundId || !roundToken) {
      setError('Informações da rodada incompletas.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch championship details
      const { data: champData, error: champError } = await supabase
        .from('championships')
        .select('id, name, logo_url')
        .eq('id', championshipId)
        .single();

      if (champError || !champData) {
        throw new Error('Campeonato não encontrado.');
      }
      setChampionship(champData as Championship);

      // Validate round and token
      const { data: roundData, error: roundError } = await supabase
        .from('rounds')
        .select('id, name, public_edit_token')
        .eq('id', roundId)
        .eq('public_edit_token', roundToken)
        .single();

      if (roundError || !roundData) {
        throw new Error('Rodada não encontrada ou token de edição inválido/expirado.');
      }
      setRound(roundData as Round);

      // Fetch all teams, groups, and matches for this championship/round
      const [teamsRes, groupsRes, matchesRes] = await Promise.all([
        supabase.from('teams').select('id, name, logo_url, group_id').eq('championship_id', championshipId),
        supabase.from('groups').select('id, name').eq('championship_id', championshipId),
        supabase.from('matches').select(`
          *,
          team1:teams!matches_team1_id_fkey(id, name, logo_url),
          team2:teams!matches_team2_id_fkey(id, name, logo_url),
          groups(name),
          rounds(name)
        `).eq('championship_id', championshipId).eq('round_id', roundId).order('match_date', { ascending: true }),
      ]);

      if (teamsRes.error) throw new Error(teamsRes.error.message);
      if (groupsRes.error) throw new Error(groupsRes.error.message);
      if (matchesRes.error) throw new Error(matchesRes.error.message);

      setTeams(teamsRes.data as Team[]);
      setGroups(groupsRes.data as Group[]);
      setMatches(matchesRes.data as Match[]);

    } catch (err: any) {
      console.error('Error fetching public round data:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [championshipId, roundId, roundToken]);

  useEffect(() => {
    fetchRoundData();
  }, [fetchRoundData]);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <PublicHeader />
        <main className="flex-1 p-4 md:p-10">
          <Skeleton className="h-24 w-full mb-6" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (error || !championship || !round) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || 'Não foi possível carregar a rodada.'}</p>
            <Button asChild><Link to="/">Voltar para a Página Inicial</Link></Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <PublicHeader />
      <main className="flex-1 p-4 md:gap-8 md:p-10">
        <div className="grid w-full gap-6">
          <div className="flex flex-col items-center text-center gap-4 mb-6">
            {championship.logo_url && (
              <div className="w-24 h-24 relative flex-shrink-0">
                <AspectRatio ratio={1 / 1}>
                  <img src={championship.logo_url} alt={championship.name} className="rounded-md object-contain" />
                </AspectRatio>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{championship.name}</h1>
              <h2 className="text-xl font-semibold text-muted-foreground mt-1">Rodada: {round.name}</h2>
              <CardDescription>Atualize os placares dos jogos desta rodada.</CardDescription>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Jogos da Rodada</CardTitle>
            </CardHeader>
            <CardContent>
              {matches.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                  <p className="text-gray-500">Nenhuma partida agendada para esta rodada.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {matches.map((match, index) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      onMatchUpdated={fetchRoundData} // Refresh data after update
                      onMatchDeleted={() => {}} // No delete in public view
                      isEven={index % 2 === 0}
                      groups={groups}
                      rounds={[]} // Not strictly needed here, but keeping for type consistency
                      teams={teams}
                      isPublicView={true} // Indicate public view
                      publicRoundId={round.id} // Pass round ID for public update
                      publicRoundToken={round.public_edit_token || ''} // Pass token for public update
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PublicRoundScoreboard;