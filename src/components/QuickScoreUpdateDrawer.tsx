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
import { Plus, Minus } from 'lucide-react';

interface Match {
  id: string;
  team1_score: number | null;
  team2_score: number | null;
  team1: { name: string };
  team2: { name: string };
}

interface QuickScoreUpdateDrawerProps {
  match: Match;
  onMatchUpdated: () => void;
  children: React.ReactNode;
  isPublicView?: boolean; // New prop: true if used in public context
  publicRoundId?: string; // Required if isPublicView is true
  publicRoundToken?: string; // Required if isPublicView is true
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTeam1Score(match.team1_score ?? 0);
    setTeam2Score(match.team2_score ?? 0);
  }, [match, open]); // Reset scores when match changes or drawer is opened

  const handleScoreChange = (team: 'team1' | 'team2', amount: number) => {
    if (team === 'team1') {
      setTeam1Score(prev => Math.max(0, prev + amount));
    } else {
      setTeam2Score(prev => Math.max(0, prev + amount));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

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
            roundId: publicRoundId,
            roundToken: publicRoundToken,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro desconhecido ao atualizar placar publicamente.');
        }

        showSuccess("Placar atualizado com sucesso!");
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
      const { error } = await supabase
        .from('matches')
        .update({
          team1_score: team1Score,
          team2_score: team2Score,
        })
        .eq('id', match.id);

      setIsSubmitting(false);

      if (error) {
        showError(`Erro ao atualizar placar: ${error.message}`);
      } else {
        showSuccess("Placar atualizado com sucesso!");
        setOpen(false);
        onMatchUpdated();
      }
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Placar Rápido</DrawerTitle>
            <DrawerDescription>Atualize o placar da partida.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <div className="flex items-center justify-center space-x-2">
              {/* Team 1 Score */}
              <div className="flex-1 text-center space-y-2">
                <Label htmlFor="team1-score" className="truncate">{match.team1.name}</Label>
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-full"
                    onClick={() => handleScoreChange('team1', -1)}
                    disabled={team1Score <= 0}
                  >
                    <Minus className="h-4 w-4" />
                    <span className="sr-only">Diminuir</span>
                  </Button>
                  <Input
                    id="team1-score"
                    type="number"
                    value={team1Score}
                    onChange={(e) => setTeam1Score(parseInt(e.target.value, 10) || 0)}
                    className="w-16 h-16 text-center text-2xl"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-full"
                    onClick={() => handleScoreChange('team1', 1)}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Aumentar</span>
                  </Button>
                </div>
              </div>
              <span className="text-2xl font-bold">X</span>
              {/* Team 2 Score */}
              <div className="flex-1 text-center space-y-2">
                <Label htmlFor="team2-score" className="truncate">{match.team2.name}</Label>
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-full"
                    onClick={() => handleScoreChange('team2', -1)}
                    disabled={team2Score <= 0}
                  >
                    <Minus className="h-4 w-4" />
                    <span className="sr-only">Diminuir</span>
                  </Button>
                  <Input
                    id="team2-score"
                    type="number"
                    value={team2Score}
                    onChange={(e) => setTeam2Score(parseInt(e.target.value, 10) || 0)}
                    className="w-16 h-16 text-center text-2xl"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-full"
                    onClick={() => handleScoreChange('team2', 1)}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Aumentar</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Placar'}
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