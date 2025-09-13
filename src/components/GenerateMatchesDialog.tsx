import { useState } from 'react';
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionProvider';
import { showSuccess, showError } from '@/utils/toast';
import { Group } from './GroupsTab'; // Import Group type
import { Round } from '@/components/RoundsTab'; // Import Round type

interface Team {
  id: string;
  name: string;
}

interface GenerateMatchesDialogProps {
  championshipId: string;
  teams: Team[];
  groups: Group[]; // Pass groups
  rounds: Round[]; // Pass rounds
  onMatchesGenerated: () => void;
}

export function GenerateMatchesDialog({ championshipId, teams, groups, rounds, onMatchesGenerated }: GenerateMatchesDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);
  const [selectedRoundId, setSelectedRoundId] = useState<string | undefined>(undefined);
  const { session } = useSession();

  const generateSchedule = (teamsToSchedule: Team[]): { team1_id: string; team2_id: string }[] => {
    const schedule: { team1_id: string; team2_id: string }[] = [];
    let localTeams = [...teamsToSchedule];

    if (localTeams.length < 2) return [];

    if (localTeams.length % 2 !== 0) {
      localTeams.push({ id: 'bye', name: 'Bye' });
    }

    const numTeams = localTeams.length;
    const numRounds = numTeams - 1;
    const half = numTeams / 2;
    
    const teamIds = localTeams.map(t => t.id);

    for (let round = 0; round < numRounds; round++) {
      for (let i = 0; i < half; i++) {
        const team1 = teamIds[i];
        const team2 = teamIds[numTeams - 1 - i];

        if (team1 !== 'bye' && team2 !== 'bye') {
          if (round % 2 === 0) {
            schedule.push({ team1_id: team1, team2_id: team2 });
          } else {
            schedule.push({ team1_id: team2, team2_id: team1 });
          }
        }
      }

      const lastTeam = teamIds.pop();
      if (lastTeam) {
        teamIds.splice(1, 0, lastTeam);
      }
    }
    return schedule;
  };

  const handleGenerate = async () => {
    if (!session?.user) {
      showError("Você precisa estar logado para realizar esta ação.");
      return;
    }
    setIsGenerating(true);

    let teamsToSchedule = teams;
    if (selectedGroupId) {
      // For now, we'll assume all teams are in the selected group.
      // In a more advanced version, teams would be explicitly assigned to groups.
      // For simplicity, if a group is selected, we'll generate matches for ALL teams,
      // but assign them to that group. This needs refinement for actual group-based team assignment.
    }

    // 1. Delete existing matches for this championship (or specific group/round if implemented)
    let deleteQuery = supabase.from('matches').delete().eq('championship_id', championshipId);
    if (selectedGroupId) {
      deleteQuery = deleteQuery.eq('group_id', selectedGroupId);
    }
    if (selectedRoundId) {
      deleteQuery = deleteQuery.eq('round_id', selectedRoundId);
    }

    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      showError(`Erro ao limpar partidas existentes: ${deleteError.message}`);
      setIsGenerating(false);
      return;
    }

    // 2. Generate new schedule
    const newMatches = generateSchedule(teamsToSchedule).map(match => ({
      ...match,
      championship_id: championshipId,
      user_id: session.user.id,
      group_id: selectedGroupId || null,
      round_id: selectedRoundId || null,
    }));

    if (newMatches.length === 0) {
        showSuccess("Nenhuma partida a ser gerada.");
        onMatchesGenerated();
        setIsGenerating(false);
        return;
    }

    // 3. Insert new matches
    const { error: insertError } = await supabase
      .from('matches')
      .insert(newMatches);

    setIsGenerating(false);

    if (insertError) {
      showError(`Erro ao gerar nova tabela: ${insertError.message}`);
    } else {
      showSuccess("Tabela de jogos gerada com sucesso!");
      onMatchesGenerated();
    }
  };

  const canGenerate = teams.length >= 2;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={!canGenerate}>Gerar Tabela</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Gerar Tabela de Jogos?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação irá <span className="font-bold text-red-600">excluir todas as partidas existentes</span> (ou as partidas do grupo/rodada selecionado) e gerar uma nova tabela de jogos no formato "todos contra todos" (turno único). Deseja continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="group-select" className="text-right">
              Grupo
            </Label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Para qual grupo? (Opcional)" />
              </SelectTrigger>
              <SelectContent>
                {groups.map(group => (
                  <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="round-select" className="text-right">
              Rodada
            </Label>
            <Select value={selectedRoundId} onValueChange={setSelectedRoundId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Para qual rodada? (Opcional)" />
              </SelectTrigger>
              <SelectContent>
                {rounds.map(round => (
                  <SelectItem key={round.id} value={round.id}>{round.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleGenerate} disabled={isGenerating || !canGenerate}>
            {isGenerating ? 'Gerando...' : 'Gerar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}