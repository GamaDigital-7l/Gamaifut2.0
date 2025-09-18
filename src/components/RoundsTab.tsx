import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2, Edit, PlusCircle } from 'lucide-react'; // Import PlusCircle
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateRoundDialog } from './CreateRoundDialog';
import { EditRoundDialog } from './EditRoundDialog';
import { AddMatchesToRoundDialog } from './AddMatchesToRoundDialog'; // Import AddMatchesToRoundDialog
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
import { Team, Group, Round } from '@/types';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

interface RoundsTabProps {
  championshipId: string;
  teams: Team[]; // Pass teams to AddMatchesToRoundDialog
  groups: Group[]; // Pass groups to AddMatchesToRoundDialog
  onMatchesAdded: () => void; // Callback for when matches are added
}

export function RoundsTab({ championshipId, teams, groups, onMatchesAdded }: RoundsTabProps) {
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
      onMatchesAdded(); // Also trigger a refresh of matches in ChampionshipDetail
    }
  };

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
          <div className="space-y-2">
            {[...Array(3)].map((_, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </CardHeader>
              </Card>
            ))}
          </div>
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
                    <Badge variant={getTypeBadgeVariant(round.type)}>{getTypeDisplayName(round.type)}</Badge>
                    <span className="text-sm text-muted-foreground">({round.order_index})</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <AddMatchesToRoundDialog
                        championshipId={championshipId}
                        roundId={round.id}
                        roundName={round.name}
                        teams={teams}
                        groups={groups}
                        onMatchesAdded={onMatchesAdded}
                      >
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Partidas
                        </DropdownMenuItem>
                      </AddMatchesToRoundDialog>
                      <EditRoundDialog round={round} onRoundUpdated={fetchRounds}>
                         <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                         </DropdownMenuItem>
                      </EditRoundDialog>
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