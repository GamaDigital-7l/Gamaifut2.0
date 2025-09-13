import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2, Edit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateRoundDialog } from './CreateRoundDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { showSuccess, showError } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';

export type Round = {
  id: string;
  name: string;
  order_index: number;
  type: 'group_stage' | 'knockout' | 'final';
  championship_id: string;
  created_at: string;
};

interface RoundsTabProps {
  championshipId: string;
}

export function RoundsTab({ championshipId }: RoundsTabProps) {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRounds = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rounds')
      .select('*')
      .eq('championship_id', championshipId)
      .order('order_index', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching rounds:', error);
      showError('Erro ao carregar rodadas: ' + error.message);
    } else {
      setRounds(data as Round[]);
    }
    setLoading(false);
  }, [championshipId]);

  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  const handleDeleteRound = async (roundId: string, roundName: string) => {
    setIsDeleting(true);
    const { error } = await supabase
      .from('rounds')
      .delete()
      .eq('id', roundId);
    
    setIsDeleting(false);

    if (error) {
      showError(`Erro ao excluir rodada "${roundName}": ${error.message}`);
    } else {
      showSuccess(`Rodada "${roundName}" excluída com sucesso!`);
      fetchRounds();
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'group_stage': return 'default';
      case 'knockout': return 'secondary';
      case 'final': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Rodadas e Fases</CardTitle>
            <CardDescription>Organize as rodadas e fases do campeonato (ex: Fase de Grupos, Quartas de Final).</CardDescription>
          </div>
          <CreateRoundDialog championshipId={championshipId} onRoundCreated={fetchRounds} />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Carregando rodadas...</p>
        ) : rounds.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-gray-500">Nenhuma rodada ou fase cadastrada.</p>
            <p className="text-gray-500 mt-2">Crie rodadas para estruturar seu campeonato.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rounds.map((round) => (
              <Card key={round.id}>
                <CardHeader className="flex flex-row items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-medium">{round.name}</CardTitle>
                    <Badge variant={getTypeBadgeVariant(round.type)}>{round.type === 'group_stage' ? 'Fase de Grupos' : round.type === 'knockout' ? 'Mata-mata' : 'Final'}</Badge>
                    <span className="text-sm text-muted-foreground">({round.order_index})</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {/* Edit Round Dialog (to be implemented later) */}
                      <DropdownMenuItem disabled>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Isso excluirá permanentemente a rodada "{round.name}" e desvinculará todas as partidas associadas a ela.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteRound(round.id, round.name)} disabled={isDeleting}>
                              {isDeleting ? 'Excluindo...' : 'Excluir'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}