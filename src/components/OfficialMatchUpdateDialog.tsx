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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

interface Match {
  id: string;
  team1_score: number | null;
  team2_score: number | null;
  team1_yellow_cards: number | null;
  team2_yellow_cards: number | null;
  team1_red_cards: number | null;
  team2_red_cards: number | null;
  team1_fouls: number | null;
  team2_fouls: number | null;
  notes: string | null;
  team1: { name: string };
  team2: { name: string };
}

interface OfficialMatchUpdateDialogProps {
  match: Match;
  onMatchUpdated: () => void;
  children: React.ReactNode;
}

export function OfficialMatchUpdateDialog({ match, onMatchUpdated, children }: OfficialMatchUpdateDialogProps) {
  const [open, setOpen] = useState(false);
  const [team1Score, setTeam1Score] = useState(match.team1_score?.toString() ?? '');
  const [team2Score, setTeam2Score] = useState(match.team2_score?.toString() ?? '');
  const [team1YellowCards, setTeam1YellowCards] = useState(match.team1_yellow_cards?.toString() ?? '0');
  const [team2YellowCards, setTeam2YellowCards] = useState(match.team2_yellow_cards?.toString() ?? '0');
  const [team1RedCards, setTeam1RedCards] = useState(match.team1_red_cards?.toString() ?? '0');
  const [team2RedCards, setTeam2RedCards] = useState(match.team2_red_cards?.toString() ?? '0');
  const [team1Fouls, setTeam1Fouls] = useState(match.team1_fouls?.toString() ?? '0');
  const [team2Fouls, setTeam2Fouls] = useState(match.team2_fouls?.toString() ?? '0');
  const [notes, setNotes] = useState(match.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTeam1Score(match.team1_score?.toString() ?? '');
    setTeam2Score(match.team2_score?.toString() ?? '');
    setTeam1YellowCards(match.team1_yellow_cards?.toString() ?? '0');
    setTeam2YellowCards(match.team2_yellow_cards?.toString() ?? '0');
    setTeam1RedCards(match.team1_red_cards?.toString() ?? '0');
    setTeam2RedCards(match.team2_red_cards?.toString() ?? '0');
    setTeam1Fouls(match.team1_fouls?.toString() ?? '0');
    setTeam2Fouls(match.team2_fouls?.toString() ?? '0');
    setNotes(match.notes || '');
  }, [match]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const score1 = team1Score === '' ? null : parseInt(team1Score, 10);
    const score2 = team2Score === '' ? null : parseInt(team2Score, 10);
    const yellow1 = parseInt(team1YellowCards, 10);
    const yellow2 = parseInt(team2YellowCards, 10);
    const red1 = parseInt(team1RedCards, 10);
    const red2 = parseInt(team2RedCards, 10);
    const fouls1 = parseInt(team1Fouls, 10);
    const fouls2 = parseInt(team2Fouls, 10);

    if ((score1 !== null && isNaN(score1)) || (score2 !== null && isNaN(score2)) ||
        isNaN(yellow1) || isNaN(yellow2) || isNaN(red1) || isNaN(red2) ||
        isNaN(fouls1) || isNaN(fouls2)) {
        showError("Todos os campos numéricos devem ser números válidos.");
        setIsSubmitting(false);
        return;
    }

    const { error } = await supabase
      .from('matches')
      .update({ 
        team1_score: score1, 
        team2_score: score2,
        team1_yellow_cards: yellow1,
        team2_yellow_cards: yellow2,
        team1_red_cards: red1,
        team2_red_cards: red2,
        team1_fouls: fouls1,
        team2_fouls: fouls2,
        notes: notes.trim() === '' ? null : notes.trim(),
      })
      .eq('id', match.id);

    setIsSubmitting(false);

    if (error) {
      showError(`Erro ao atualizar partida: ${error.message}`);
    } else {
      showSuccess("Partida atualizada com sucesso!");
      setOpen(false);
      onMatchUpdated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Atualizar Partida</DialogTitle>
          <DialogDescription>
            {`Registre os detalhes da partida entre ${match.team1.name} e ${match.team2.name}.`}
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

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team1_yellow_cards" className="text-right">
                {match.team1.name} (Amarelos)
              </Label>
              <Input
                id="team1_yellow_cards"
                type="number"
                value={team1YellowCards}
                onChange={(e) => setTeam1YellowCards(e.target.value)}
                className="col-span-3"
                min="0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team2_yellow_cards" className="text-right">
                {match.team2.name} (Amarelos)
              </Label>
              <Input
                id="team2_yellow_cards"
                type="number"
                value={team2YellowCards}
                onChange={(e) => setTeam2YellowCards(e.target.value)}
                className="col-span-3"
                min="0"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team1_red_cards" className="text-right">
                {match.team1.name} (Vermelhos)
              </Label>
              <Input
                id="team1_red_cards"
                type="number"
                value={team1RedCards}
                onChange={(e) => setTeam1RedCards(e.target.value)}
                className="col-span-3"
                min="0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team2_red_cards" className="text-right">
                {match.team2.name} (Vermelhos)
              </Label>
              <Input
                id="team2_red_cards"
                type="number"
                value={team2RedCards}
                onChange={(e) => setTeam2RedCards(e.target.value)}
                className="col-span-3"
                min="0"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team1_fouls" className="text-right">
                {match.team1.name} (Faltas)
              </Label>
              <Input
                id="team1_fouls"
                type="number"
                value={team1Fouls}
                onChange={(e) => setTeam1Fouls(e.target.value)}
                className="col-span-3"
                min="0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team2_fouls" className="text-right">
                {match.team2.name} (Faltas)
              </Label>
              <Input
                id="team2_fouls"
                type="number"
                value={team2Fouls}
                onChange={(e) => setTeam2Fouls(e.target.value)}
                className="col-span-3"
                min="0"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notas
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="col-span-3"
                placeholder="Observações sobre a partida..."
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