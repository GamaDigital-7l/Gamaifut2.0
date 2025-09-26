import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { TopScorersList } from '@/components/TopScorersList';
import { showError } from '@/utils/toast';
import { Championship } from '@/types';

const TopScorers = () => {
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [selectedChampionshipId, setSelectedChampionshipId] = useState<string | undefined>(undefined);
  const [loadingChampionships, setLoadingChampionships] = useState(true);

  const fetchChampionships = useCallback(async () => {
    setLoadingChampionships(true);
    const { data, error } = await supabase
      .from('championships')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      showError('Erro ao carregar campeonatos para filtro: ' + error.message);
      console.error('Error fetching championships for filter:', error);
      setChampionships([]);
    } else {
      setChampionships(data as Championship[]);
    }
    setLoadingChampionships(false);
  }, []);

  useEffect(() => {
    fetchChampionships();
  }, [fetchChampionships]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Artilheiros</h1>
      <p className="text-muted-foreground">Visualize os principais marcadores de gols de todos os campeonatos ou filtre por um específico.</p>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Artilheiros</CardTitle>
          <CardDescription>Jogadores com mais gols marcados.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="championship-filter" className="sr-only">Filtrar por Campeonato</Label>
            {loadingChampionships ? (
              <Skeleton className="h-10 w-full max-w-[300px]" />
            ) : (
              <Select
                value={selectedChampionshipId}
                onValueChange={(value) => setSelectedChampionshipId(value === 'all' ? undefined : value)}
              >
                <SelectTrigger id="championship-filter" className="w-full max-w-[300px]">
                  <SelectValue placeholder="Todos os Campeonatos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Campeonatos</SelectItem>
                  {championships.map(champ => (
                    <SelectItem key={champ.id} value={champ.id}>{champ.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <TopScorersList championshipId={selectedChampionshipId} />
        </CardContent>
      </Card>
    </div>
  );
};

export default TopScorers;