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

interface Team {
  id: string;
  name: string;
}

interface CreateMatchDialogProps {
  championshipId: string;
  teams: Team[];
  onMatchCreated: () => void;
}

export function CreateMatchDialog({ championshipId, teams, onMatchCreated }: CreateMatchDialogProps) {
  const [open, setOpen] = useState(false);
  const [team1Id, setTeam1Id] = useState<string | undefined>(undefined);
  const [team2Id, setTeam2Id] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team1Id || !team2Id || !session?.user) {
      showError("Você precisa selecionar os dois times.");
      return;
    }
    if (team1Id === team2Id) {
      showError("Os times devem ser diferentes.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('matches')
      .insert([{ 
        championship_id: championshipId,
        user_id: session.user.id,
        team1_id: team1Id,
        team2_id: team2Id,
      }]);

    setIsSubmitting(false);

    if (error) {
      showError(`Erro ao criar partida: ${error.message}`);
    } else {
      showSuccess("Partida criada com sucesso!");
      setTeam1Id(undefined);
      setTeam2Id(undefined);
      setOpen(false);
      onMatchCreated();
    }
  };

  const availableTeamsForTeam2 = teams.filter(t => t.id !== team1Id);
  const availableTeamsForTeam1 = teams.filter(t => t.id !== team2Id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={teams.length < 2}>Agendar Partida</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agendar Nova Partida</DialogTitle>
          <DialogDescription>
            Selecione os dois times que irão se enfrentar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team1" className="text-right">
                Time 1
              </Label>
              <Select value={team1Id} onValueChange={setTeam1Id}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o time da casa" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeamsForTeam1.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team2" className="text-right">
                Time 2
              </Label>
               <Select value={team2Id} onValueChange={setTeam2Id}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o time visitante" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeamsForTeam2.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Agendando...' : 'Agendar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}