import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Plus, Trash2 } from 'lucide-react'; // Removed Minus, as score is direct input
import { Match, MatchGoal } from '@/types';

interface QuickScoreUpdateDrawerProps {
  match: Match;
  onMatchUpdated: () => void;
  children: React.ReactNode;
  isPublicView?: boolean; // New prop: true if used in public context
  publicRoundId?: string; // Required if isPublicView is true
  publicRoundToken?: string; // Required if isPublicView is true
}

interface GoalInput {
  tempId: string; // Temporary ID for UI management
  id?: string; // Actual DB ID if existing goal
  player_name: string;
  jersey_number: number | null;
}

export function QuickScoreUpdateDrawer({
  match,
  onMatchUpdated,
  children,
  isPublicView = false,
  publicRoundId,
  publicRoundToken,
}: QuickScoreUpdateDrawerProps) {
  const [open, setOpen] = useState(false);
  const [team1Score, setTeam1Score] = useState(match.team1_score ?? 0);
  const [team2Score, setTeam2Score] = useState(match.team2_score ?? 0);
  const [team1Goals, setTeam1Goals] = useState<GoalInput[]>([]);
  const [team2Goals, setTeam2Goals] = useState<GoalInput[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Effect to initialize scores and goals when match changes or drawer is opened
  useEffect(() => {
    if (open) {
      setTeam1Score(match.team1_score ?? 0);
      setTeam2Score(match.team2_score ?? 0);
      setTeam1Goals(match.goals.filter(g => g.team_id === match.team1_id).map(g => ({
        tempId: g.id, id: g.id, player_name: g.player_name, jersey_number: g.jersey_number
      })));
      setTeam2Goals(match.goals.filter(g => g.team_id === match.team2_id).map(g => ({
        tempId: g.id, id: g.id, player_name: g.player_name, jersey_number: g.jersey_number
      })));
    }
  }, [match, open]);

  const handleGoalChange = (team: 'team1' | 'team2', tempId: string, field: keyof GoalInput, value: any) => {
    const setGoals = team === 'team1' ? setTeam1Goals : setTeam2Goals;
    setGoals(prev => prev.map(goal =>
      goal.tempId === tempId ? { ...goal, [field]: value } : goal
    ));
  };

  const addGoal = (team: 'team1' | 'team2') => {
    const setGoals = team === 'team1' ? setTeam1Goals : setTeam2Goals;
    setGoals(prev => [...prev, { tempId: crypto.randomUUID(), player_name: '', jersey_number: null }]);
  };

  const removeGoal = (team: 'team1' | 'team2', tempId: string) => {
    const setGoals = team === 'team1' ? setTeam1Goals : setTeam2Goals;
    setGoals(prev => prev.filter(goal => goal.tempId !== tempId));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const goalsToSave: Omit<MatchGoal, 'id' | 'created_at' | 'user_id'>[] = [
      ...team1Goals.filter(g => g.player_name.trim() !== '').map(g => ({
        match_id: match.id,
        team_id: match.team1_id,
        player_name: g.player_name.trim(),
        jersey_number: g.jersey_number,
      })),
      ...team2Goals.filter(g => g.player_name.trim() !== '').map(g => ({
        match_id: match.id,
        team_id: match.team2_id,
        player_name: g.player_name.trim(),
        jersey_number: g.jersey_number,
      })),
    ];

    if (isPublicView) {
      if (!publicRoundId || !publicRoundToken) {
        showError("Erro: Informações de autenticação pública incompletas.");
        setIsSubmitting(false);
        return;
      }

      try {
        const edgeFunctionUrl = `https://rrwtsnecjuugqlwmpgzd.supabase.co/functions/v1/update-public-match-score`;
        const response = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            matchId: match.id,
            team1Score,
            team2Score,
            goals: goalsToSave, // Pass goals data
            roundId: publicRoundId,
            roundToken: publicRoundToken,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro desconhecido ao atualizar placar publicamente.');
        }

        showSuccess("Placar e marcadores de gols atualizados com sucesso!");
        setOpen(false);
        onMatchUpdated();
      } catch (error: any) {
        console.error('Error updating public match score:', error);
        showError('Erro ao atualizar placar: ' + error.message);
      } finally {
        setIsSubmitting(false);
      }

    } else {
      // Existing logic for authenticated users
      const { error: matchUpdateError } = await supabase
        .from('matches')
        .update({
          team1_score: team1Score,
          team2_score: team2Score,
        })
        .eq('id', match.id);

      if (matchUpdateError) {
        showError(`Erro ao atualizar placar: ${matchUpdateError.message}`);
        setIsSubmitting(false);
        return;
      }

      // Delete existing goals for this match
      const { error: deleteGoalsError } = await supabase
        .from('match_goals')
        .delete()
        .eq('match_id', match.id);

      if (deleteGoalsError) {
        showError(`Erro ao limpar marcadores de gols antigos: ${deleteGoalsError.message}`);
        setIsSubmitting(false);
        return;
      }

      // Insert new goals
      if (goalsToSave.length > 0) {
        const { error: insertGoalsError } = await supabase
          .from('match_goals')
          .insert(goalsToSave);

        if (insertGoalsError) {
          showError(`Erro ao inserir novos marcadores de gols: ${insertGoalsError.message}`);
          setIsSubmitting(false);
          return;
        }
      }

      setIsSubmitting(false);

      showSuccess("Placar e marcadores de gols atualizados com sucesso!");
      setOpen(false);
      onMatchUpdated();
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle>Placar Rápido e Gols</DrawerTitle>
            <DrawerDescription>Atualize o placar da partida e, opcionalmente, registre os marcadores de gols.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0 space-y-6">
            {/* Score Section */}
            <div className="flex items-center justify-center space-x-2">
              {/* Team 1 Score */}
              <div className="flex-1 text-center space-y-2">
                <Label htmlFor="team1-score" className="truncate text-sm">{match.team1.name}</Label> {/* Added text-sm */}
                <div className="flex items-center justify-center space-x-2">
                  <Input
                    id="team1-score"
                    type="number"
                    value={team1Score}
                    onChange={(e) => setTeam1Score(parseInt(e.target.value, 10) || 0)} {/* Made editable */}
                    className="w-16 h-16 text-center text-2xl"
                  />
                </div>
              </div>
              <span className="text-2xl font-bold">X</span>
              {/* Team 2 Score */}
              <div className="flex-1 text-center space-y-2">
                <Label htmlFor="team2-score" className="truncate text-sm">{match.team2.name}</Label> {/* Added text-sm */}
                <div className="flex items-center justify-center space-x-2">
                  <Input
                    id="team2-score"
                    type="number"
                    value={team2Score}
                    onChange={(e) => setTeam2Score(parseInt(e.target.value, 10) || 0)} {/* Made editable */}
                    className="w-16 h-16 text-center text-2xl"
                  />
                </div>
              </div>
            </div>

            {/* Goal Scorers Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Team 1 Goals */}
              <div className="space-y-3 border p-3 rounded-md">
                <h3 className="font-semibold text-center text-sm">{match.team1.name} - Gols</h3> {/* Added text-sm */}
                {team1Goals.map((goal, index) => (
                  <div key={goal.tempId} className="flex items-center gap-2">
                    <Input
                      placeholder="Nome do Jogador"
                      value={goal.player_name}
                      onChange={(e) => handleGoalChange('team1', goal.tempId, 'player_name', e.target.value)}
                      className="flex-grow h-8 text-xs" // Made smaller
                    />
                    <Input
                      type="number"
                      placeholder="Camisa"
                      value={goal.jersey_number ?? ''}
                      onChange={(e) => handleGoalChange('team1', goal.tempId, 'jersey_number', parseInt(e.target.value, 10) || null)}
                      className="w-16 h-8 text-xs" // Made smaller
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeGoal('team1', goal.tempId)} className="h-8 w-8"> {/* Made smaller */}
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => addGoal('team1')} className="w-full h-8 text-xs"> {/* Made smaller */}
                  <Plus className="mr-2 h-3 w-3" /> Adicionar Gol
                </Button>
              </div>

              {/* Team 2 Goals */}
              <div className="space-y-3 border p-3 rounded-md">
                <h3 className="font-semibold text-center text-sm">{match.team2.name} - Gols</h3> {/* Added text-sm */}
                {team2Goals.map((goal, index) => (
                  <div key={goal.tempId} className="flex items-center gap-2">
                    <Input
                      placeholder="Nome do Jogador"
                      value={goal.player_name}
                      onChange={(e) => handleGoalChange('team2', goal.tempId, 'player_name', e.target.value)}
                      className="flex-grow h-8 text-xs" // Made smaller
                    />
                    <Input
                      type="number"
                      placeholder="Camisa"
                      value={goal.jersey_number ?? ''}
                      onChange={(e) => handleGoalChange('team2', goal.tempId, 'jersey_number', parseInt(e.target.value, 10) || null)}
                      className="w-16 h-8 text-xs" // Made smaller
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeGoal('team2', goal.tempId)} className="h-8 w-8"> {/* Made smaller */}
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => addGoal('team2')} className="w-full h-8 text-xs"> {/* Made smaller */}
                  <Plus className="mr-2 h-3 w-3" /> Adicionar Gol
                </Button>
              </div>
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Placar e Gols'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}