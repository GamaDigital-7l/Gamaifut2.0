import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Leaderboard } from '@/components/Leaderboard';
import { SponsorDisplay } from '@/components/SponsorDisplay';
import { MatchCard } from '@/components/MatchCard';
import { format } from 'date-fns';
import { useChampionshipTheme } from '@/contexts/ThemeContext';
import { Skeleton } from '@/components/ui/skeleton';

// Re-using types from ChampionshipDetail for consistency
type Championship = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  logo_url: string | null;
  theme_primary: string | null;
  theme_secondary: string | null;
  theme_accent: string | null;
  theme_bg: string | null;
  theme_text: string | null;
  theme_mode: string | null;
};

type Team = {
  id: string;
  name: string;
  logo_url: string | null;
  group_id: string | null;
};

type Match = {
  id: string;
  team1_id: string;
  team2_id: string;
  team1_score: number | null;
  team2_score: number | null;
  match_date: string | null;
  location: string | null;
  group_id: string | null;
  round_id: string | null;
  assigned_official_id: string | null;
  team1_yellow_cards: number | null;
  team2_yellow_cards: number | null;
  team1_red_cards: number | null;
  team2_red_cards: number | null;
  team1_fouls: number | null;
  team2_fouls: number | null;
  notes: string | null;
  team1: { name: string; logo_url: string | null; };
  team2: { name: string; logo_url: string | null; };
  groups: { name: string } | null;
  rounds: { name: string } | null;
};

type Group = {
  id: string;
  name: string;
};

type Round = {
  id: string;
  name: string;
  order_index: number;
  type: string;
};

const PublicChampionshipView = () => {
  const { id } = useParams<{ id: string }>();
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { applyThemeToDocument } = useChampionshipTheme(); // Use applyThemeToDocument from context

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    // Fetch championship details
    const { data: champData, error: champError } = await supabase
      .from('championships')
      .select('*, theme_primary, theme_secondary, theme_accent, theme_bg, theme_text, theme_mode')
      .eq('id', id)
      .single();

    if (champError) {
      console.error('Error fetching championship:', champError);
      setError('Campeonato não encontrado ou erro ao carregar.');
      setLoading(false);
      applyThemeToDocument(null); // Revert to global theme if championship theme fails
      return;
    }
    setChampionship(champData as Championship);
    applyThemeToDocument(champData as Championship); // Apply fetched theme

    // Fetch teams
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .eq('championship_id', id)
      .order('created_at', { ascending: true });

    if (teamsError) {
      console.error('Error fetching teams:', teamsError);
      setError('Erro ao carregar os times.');
    } else {
      setTeams(teamsData as Team[]);
    }

    // Fetch groups
    const { data: groupsData, error: groupsError } = await supabase
      .from('groups')
      .select('*')
      .eq('championship_id', id)
      .order('name', { ascending: true });

    if (groupsError) {
      console.error('Error fetching groups:', groupsError);
      setError('Erro ao carregar os grupos.');
    } else {
      setGroups(groupsData as Group[]);
    }

    // Fetch rounds
    const { data: roundsData, error: roundsError } = await supabase
      .from('rounds')
      .select('*')
      .eq('championship_id', id)
      .order('order_index', { ascending: true })
      .order('name', { ascending: true });

    if (roundsError) {
      console.error('Error fetching rounds:', roundsError);
      setError('Erro ao carregar as rodadas.');
    } else {
      setRounds(roundsData as Round[]);
    }

    // Fetch matches
    const { data: matchesData, error: matchesError } = await supabase
      .from('matches')
      .select(`
        id,
        team1_id,
        team2_id,
        team1_score,
        team2_score,
        match_date,
        location,
        group_id,
        round_id,
        assigned_official_id,
        team1_yellow_cards,
        team2_yellow_cards,
        team1_red_cards,
        team2_red_cards,
        team1_fouls,
        team2_fouls,
        notes,
        team1:teams!matches_team1_id_fkey(name, logo_url),
        team2:teams!matches_team2_id_fkey(name, logo_url),
        groups(name),
        rounds(name)
      `)
      .eq('championship_id', id)
      .order('match_date', { ascending: true });

    if (matchesError) {
      console.error('Error fetching matches:', matchesError);
      setError('Erro ao carregar as partidas.');
    } else {
      setMatches(matchesData as Match[]);
    }

    setLoading(false);
  }, [id, applyThemeToDocument]);

  useEffect(() => {
    fetchData();
    // Cleanup theme when component unmounts or ID changes
    return () => {
      applyThemeToDocument(null); // Revert to global theme
    };
  }, [fetchData, applyThemeToDocument]);

  if (loading) {
    return (
      <div className="space-y-4 p-4 lg:p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-10 w-3/4" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 border-2 border-dashed rounded-lg text-red-500">
        <p>{error}</p>
        <Button asChild className="mt-4">
          <Link to="/">Voltar para a Página Inicial</Link>
        </Button>
      </div>
    );
  }

  if (!championship) {
    return (
      <div className="text-center py-10 border-2 border-dashed rounded-lg">
        <p className="text-gray-500">Campeonato não encontrado.</p>
        <Button asChild className="mt-4">
          <Link to="/">Voltar para a Página Inicial</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            {championship.logo_url && (
              <div className="w-20 h-20 relative">
                <AspectRatio ratio={1 / 1}>
                  <img src={championship.logo_url} alt={championship.name} className="rounded-md object-contain" />
                </AspectRatio>
              </div>
            )}
            <div>
              <CardTitle className="text-3xl font-bold">{championship.name}</CardTitle>
              <CardDescription className="mt-1 text-lg">{championship.description || 'Sem descrição.'}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Início: {format(new Date(championship.created_at), 'dd/MM/yyyy')}
          </p>
        </CardContent>
      </Card>

      {groups.length > 0 ? (
        <div className="space-y-4">
          {groups.map(group => (
            <Card key={group.id}>
              <CardHeader>
                <CardTitle>Classificação - {group.name}</CardTitle>
                <CardDescription>Times do grupo {group.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <Leaderboard 
                  teams={teams.filter(team => team.group_id === group.id)} 
                  matches={matches.filter(match => match.group_id === group.id)} 
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Classificação Geral</CardTitle>
            <CardDescription>Todos os times do campeonato.</CardDescription>
          </CardHeader>
          <CardContent>
            <Leaderboard teams={teams} matches={matches} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Partidas</CardTitle>
          <CardDescription>Próximas partidas e resultados.</CardDescription>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <p className="text-gray-500">Nenhuma partida agendada.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {matches.map((match, index) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onMatchUpdated={() => {}} // No update functionality in public view
                  onMatchDeleted={() => {}} // No delete functionality in public view
                  isEven={index % 2 === 0}
                  groups={groups}
                  rounds={rounds}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SponsorDisplay championshipId={championship.id} />
    </div>
  );
};

export default PublicChampionshipView;