import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MatchCard } from '@/components/MatchCard';
import { showError, showSuccess } from '@/utils/toast';
import { Match, Group, Round, Team, Championship } from '@/types';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Trophy, Link as LinkIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Combined fetch function for all championship data needed for this view
const fetchChampionshipDataForOfficial = async (championshipId: string) => {
  const [champRes, teamsRes, groupsRes, roundsRes, matchesRes] = await Promise.all([
    supabase.from('championships').select('id, name, logo_url').eq('id', championshipId).single(), // Optimized select
    supabase.from('teams').select('id, name, logo_url, group_id').eq('championship_id', championshipId), // Optimized select
    supabase.from('groups').select('id, name').eq('championship_id', championshipId), // Optimized select
    supabase.from('rounds').select('id, name, order_index, type, public_edit_token').eq('championship_id', championshipId).order('order_index', { ascending: true }), // Optimized select
    supabase.from('matches').select(`
      id, team1_id, team2_id, team1_score, team2_score, match_date, location, group_id, round_id, team1_yellow_cards, team2_yellow_cards, team1_red_cards, team2_red_cards, team1_fouls, team2_fouls, notes,
      team1:teams!matches_team1_id_fkey(id, name, logo_url),
      team2:teams!matches_team2_id_fkey(id, name, logo_url),
      groups(name),
      rounds(name),
      goals:match_goals(id, match_id, team_id, player_name, jersey_number)
    `).eq('championship_id', championshipId).order('match_date', { ascending: true }), // Optimized select for matches and goals
  ]);

  if (champRes.error) throw new Error(champRes.error.message);
  if (teamsRes.error) throw new Error(teamsRes.error.message);
  if (groupsRes.error) throw new Error(groupsRes.error.message);
  if (roundsRes.error) throw new Error(roundsRes.error.message);
  if (matchesRes.error) throw new Error(matchesRes.error.message);

  return {
    championship: champRes.data as Championship,
    teams: teamsRes.data as Team[],
    groups: groupsRes.data as Group[],
    rounds: roundsRes.data as Round[],
    matches: matchesRes.data as Match[], // Corrected type assertion
  };
};

const OfficialChampionshipMatches = () => {
  const { id: championshipId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['officialChampionshipData', championshipId],
    queryFn: () => fetchChampionshipDataForOfficial(championshipId!),
    enabled: !!championshipId,
  });

  console.log('OfficialChampionshipMatches: Render. isLoading:', isLoading, 'Error:', error); // NEW LOG

  const { championship, teams, groups, rounds, matches } = data || {};
  const [selectedRoundFilter, setSelectedRoundFilter] = useState<string>('all');

  // Reset filter when championship changes
  useEffect(() => {
    setSelectedRoundFilter('all');
  }, [championshipId]);

  const filteredMatches = selectedRoundFilter === 'all'
    ? matches || []
    : (matches || []).filter(match => match.round_id === selectedRoundFilter);

  const handleDataChange = () => {
    queryClient.invalidateQueries({ queryKey: ['officialChampionshipData', championshipId] });
  };

  const handleCopyPublicLink = () => {
    const selectedRound = rounds?.find(r => r.id === selectedRoundFilter);
    if (!selectedRound || !selectedRound.public_edit_token) {
      showError('Selecione uma rodada válida para gerar o link público.');
      return;
    }
    const publicLink = `${window.location.origin}/public/round/${championshipId}/${selectedRound.id}/${selectedRound.public_edit_token}`;
    navigator.clipboard.writeText(publicLink)
      .then(() => showSuccess('Link público de edição copiado para a área de transferência!'))
      .catch(() => showError('Erro ao copiar o link.'));
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 lg:p-6">
        <div className="flex flex-col items-center text-center gap-4 mb-6">
          <Skeleton className="h-24 w-24 rounded-md" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !championship) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error?.message || 'Campeonato não encontrado ou erro ao carregar.'}</p>
        <Button asChild><Link to="/official-dashboard">Voltar para o Painel do Mesário</Link></Button>
      </div>
    );
  }

  const canGeneratePublicLink = selectedRoundFilter !== 'all' && rounds?.find(r => r.id === selectedRoundFilter)?.public_edit_token;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center gap-4 mb-6">
        {championship.logo_url && (
          <div className="w-24 h-24 relative flex-shrink-0">
            <AspectRatio ratio={1 / 1}>
              <img src={championship.logo_url} alt={championship.name} className="rounded-md object-contain" loading="lazy" />
            </AspectRatio>
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{championship.name}</h1>
          <p className="text-muted-foreground mt-1">Gerenciamento de Partidas</p>
        </div>
        <Button asChild variant="link" className="p-0 h-auto mt-1">
          <Link to={`/official-dashboard`}>Voltar para o Painel do Mesário</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Jogos</CardTitle>
              <CardDescription>Visualize e atualize os placares das partidas.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {rounds && rounds.length > 0 && (
                <div className="flex-1">
                  <Label htmlFor="round-filter" className="sr-only">Filtrar por Rodada</Label>
                  <Select value={selectedRoundFilter} onValueChange={setSelectedRoundFilter}>
                    <SelectTrigger id="round-filter" className="w-full">
                      <SelectValue placeholder="Filtrar por Rodada" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Rodadas</SelectItem>
                      {rounds.map((round: Round) => (
                        <SelectItem key={round.id} value={round.id}>{round.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button 
                onClick={handleCopyPublicLink} 
                disabled={!canGeneratePublicLink}
                className="w-full sm:w-auto flex-shrink-0" // Ensure full width on mobile, auto on larger screens
              >
                <LinkIcon className="mr-2 h-4 w-4" /> Gerar Link Público
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMatches.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <p className="text-gray-500">Nenhuma partida agendada para a rodada selecionada.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMatches.map((match: Match, index: number) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onMatchUpdated={handleDataChange}
                  onMatchDeleted={handleDataChange}
                  isEven={index % 2 === 0}
                  groups={groups || []}
                  rounds={rounds || []}
                  teams={teams || []}
                  isPublicView={false} // Mesário está logado, não é vista pública de edição
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OfficialChampionshipMatches;