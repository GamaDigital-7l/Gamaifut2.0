import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

interface Match {
  id: string;
  team1_score: number | null;
  team2_score: number | null;
  team1: { name: string };
  team2: { name: string };
}

interface EditMatchDialogProps {
  match: Match;
  onMatchUpdated: () => void;
  children: React.ReactNode;
}

export function EditMatchDialog({ match, onMatchUpdated, children }: EditMatchDialogProps) {
  const [open, setOpen] = useState(false);
  const [team1Score, setTeam1Score] = useState(match.team1_score?.toString() ?? '');
  const [team2Score, setTeam2Score] = useState(match.team2_score?.toString() ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTeam1Score(match.team1_score?.toString() ?? '');
    setTeam2Score(match.team2_score?.toString() ?? '');
  }, [match]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const score1 = team1Score === '' ? null : parseInt(team1Score, 10);
    const score2 = team2Score === '' ? null : parseInt(team2Score, 10);

    if (isNaN(score1 as number) || isNaN(score2 as number)) {
        showError("Os placares devem ser números válidos.");
        setIsSubmitting(false);
        return;
    }

    const { error } = await supabase
      .from('matches')
      .update({ team1_score: score1, team2_score: score2 })
      .eq('id', match.id);

    setIsSubmitting(false);

    if (error) {
      showError(`Erro ao atualizar placar: ${error.message}`);
    } else {
      showSuccess("Placar atualizado com sucesso!");
      setOpen(false);
      onMatchUpdated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Placar</DialogTitle>
          <DialogDescription>
            {`Atualize o placar da partida entre ${match.team1.name} e ${match.team2.name}.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team1_score" className="text-right">
                {match.team1.name}
              </Label>
              <Input
                id="team1_score"
                type="number"
                value={team1Score}
                onChange={(e) => setTeam1Score(e.target.value)}
                className="col-span-3"
                placeholder="Placar Time 1"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team2_score" className="text-right">
                {match.team2.name}
              </Label>
              <Input
                id="team2_score"
                type="number"
                value={team2Score}
                onChange={(e) => setTeam2Score(e.target.value)}
                className="col-span-3"
                placeholder="Placar Time 2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}