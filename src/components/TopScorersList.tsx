import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Goal, Shirt, Trophy } from 'lucide-react';
import { showError } from '@/utils/toast';
import { Link } from 'react-router-dom';

interface TopScorer {
  player_name: string;
  total_goals: number;
  team_id: string;
  team_name: string;
  team_logo_url: string | null;
  championship_id: string;
  championship_name: string;
}

interface TopScorersListProps {
  championshipId?: string; // Optional: filter by championship
  isPublicView?: boolean; // Optional: adjust links for public view
}

export function TopScorersList({ championshipId, isPublicView = false }: TopScorersListProps) {
  const [topScorers, setTopScorers] = useState<TopScorer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTopScorers = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('match_goals')
      .select(`
        player_name,
        team_id,
        teams(name, logo_url, championship_id),
        championships(name)
      `);

    if (championshipId) {
      query = query.eq('championship_id', championshipId);
    }

    const { data, error } = await query;

    if (error) {
      showError('Erro ao carregar artilheiros: ' + error.message);
      console.error('Error fetching top scorers:', error);
      setTopScorers([]);
    } else {
      // Aggregate goals by player_name, team_id, championship_id
      const aggregatedGoals = new Map<string, TopScorer>();

      data.forEach((goal: any) => {
        const team = goal.teams;
        const championship = goal.championships;

        if (team && championship) {
          const key = `${goal.player_name}-${team.id}-${championship.id}`;
          if (!aggregatedGoals.has(key)) {
            aggregatedGoals.set(key, {
              player_name: goal.player_name,
              total_goals: 0,
              team_id: team.id,
              team_name: team.name,
              team_logo_url: team.logo_url,
              championship_id: championship.id,
              championship_name: championship.name,
            });
          }
          aggregatedGoals.get(key)!.total_goals++;
        }
      });

      const sortedScorers = Array.from(aggregatedGoals.values()).sort((a, b) => b.total_goals - a.total_goals);
      setTopScorers(sortedScorers);
    }
    setLoading(false);
  }, [championshipId]);

  useEffect(() => {
    fetchTopScorers();
  }, [fetchTopScorers]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-2 border rounded-md">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-24 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (topScorers.length === 0) {
    return (
      <div className="text-center py-10 border-2 border-dashed rounded-lg">
        <p className="text-gray-500">Nenhum artilheiro encontrado ainda.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Pos.</TableHead>
            <TableHead>Jogador</TableHead>
            <TableHead className="text-right">Gols</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topScorers.map((scorer, index) => (
            <TableRow key={`${scorer.player_name}-${scorer.team_id}-${scorer.championship_id}`}>
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={scorer.team_logo_url || undefined} alt={scorer.team_name} />
                    <AvatarFallback>
                      <Trophy className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{scorer.player_name}</p>
                    <p className="text-sm text-muted-foreground">
                      <Link 
                        to={isPublicView ? `/public/team/${scorer.team_id}` : `/team/${scorer.team_id}`} 
                        className="hover:underline"
                      >
                        {scorer.team_name}
                      </Link>
                      {!championshipId && ( // Only show championship name if not already filtered by it
                        <span className="ml-1">({scorer.championship_name})</span>
                      )}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right font-bold text-lg flex items-center justify-end gap-1">
                <Goal className="h-4 w-4 text-primary" />
                {scorer.total_goals}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}