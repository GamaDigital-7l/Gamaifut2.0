import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export type Round = {
  id: string;
  name: string;
  order_index: number;
  type: 'group_stage' | 'round_of_16' | 'quarter_finals' | 'semi_finals' | 'final';
  championship_id: string;
  created_at: string;
};

interface PublicRoundsTabProps {
  championshipId: string;
}

export function PublicRoundsTab({ championshipId }: PublicRoundsTabProps) {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRounds = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rounds')
      .select('id, name, order_index, type, championship_id, created_at, public_edit_token') // Optimized select
      .eq('championship_id', championshipId)
      .order('order_index', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching rounds:', error);
    } else {
      setRounds(data as Round[]);
    }
    setLoading(false);
  }, [championshipId]);

  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  const getTypeDisplayName = (type: Round['type']) => {
    switch (type) {
      case 'group_stage': return 'Fase de Grupos';
      case 'round_of_16': return 'Oitavas de Final';
      case 'quarter_finals': return 'Quartas de Final';
      case 'semi_finals': return 'Semi Final';
      case 'final': return 'Final';
      default: return type;
    }
  };

  const getTypeBadgeVariant = (type: Round['type']) => {
    switch (type) {
      case 'group_stage': return 'default';
      case 'round_of_16':
      case 'quarter_finals':
      case 'semi_finals': return 'secondary';
      case 'final': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rodadas e Fases</CardTitle>
        <CardDescription>Estrutura das rodadas e fases do campeonato.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : rounds.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-gray-500">Nenhuma rodada ou fase cadastrada para este campeonato.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rounds.map((round) => (
              <Card key={round.id}>
                <CardHeader className="flex flex-row items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-medium">{round.name}</CardTitle>
                    <Badge variant={getTypeBadgeVariant(round.type)}>{getTypeDisplayName(round.type)}</Badge>
                    <span className="text-sm text-muted-foreground">({round.order_index})</span>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}