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
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionProvider';
import { showSuccess, showError } from '@/utils/toast';

interface Team {
  id: string;
  name: string;
}

interface GenerateMatchesDialogProps {
  championshipId: string;
  teams: Team[];
  onMatchesGenerated: () => void;
}

export function GenerateMatchesDialog({ championshipId, teams, onMatchesGenerated }: GenerateMatchesDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { session } = useSession();

  const generateSchedule = () => {
    const schedule: { team1_id: string; team2_id: string }[] = [];
    let localTeams = [...teams];

    if (localTeams.length < 2) return [];

    // If odd number of teams, add a dummy "bye" team
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
          // Alternate home/away for fairness
          if (round % 2 === 0) {
            schedule.push({ team1_id: team1, team2_id: team2 });
          } else {
            schedule.push({ team1_id: team2, team2_id: team1 });
          }
        }
      }

      // Rotate teams, keeping the first one fixed
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

    // 1. Delete existing matches for this championship
    const { error: deleteError } = await supabase
      .from('matches')
      .delete()
      .eq('championship_id', championshipId);

    if (deleteError) {
      showError(`Erro ao limpar partidas existentes: ${deleteError.message}`);
      setIsGenerating(false);
      return;
    }

    // 2. Generate new schedule
    const newMatches = generateSchedule().map(match => ({
      ...match,
      championship_id: championshipId,
      user_id: session.user.id,
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

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={teams.length < 2}>Gerar Tabela</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Gerar Tabela de Jogos?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação irá <span className="font-bold text-red-600">excluir todas as partidas existentes</span> e gerar uma nova tabela de jogos no formato "todos contra todos" (turno único). Deseja continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? 'Gerando...' : 'Gerar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}