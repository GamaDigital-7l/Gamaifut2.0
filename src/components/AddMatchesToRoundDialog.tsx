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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, setHours, setMinutes } from "date-fns";
import { CalendarIcon, PlusCircle, MinusCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionProvider';
import { showSuccess, showError } from '@/utils/toast';
import { Team } from '@/pages/ChampionshipDetail'; // Assuming Team type is available
import { Group } from './GroupsTab'; // Assuming Group type is available

interface AddMatchesToRoundDialogProps {
  championshipId: string;
  roundId: string;
  roundName: string;
  teams: Team[];
  groups: Group[];
  onMatchesAdded: () => void;
  children: React.ReactNode;
}

interface MatchInput {
  id: string; // Unique ID for React list key
  team1Id: string | undefined;
  team2Id: string | undefined;
  matchDate: Date | undefined;
  matchTime: string;
  location: string;
  groupId: string | undefined;
}

export function AddMatchesToRoundDialog({
  championshipId,
  roundId,
  roundName,
  teams,
  groups,
  onMatchesAdded,
  children,
}: AddMatchesToRoundDialogProps) {
  const [open, setOpen] = useState(false);
  const [matchesToCreate, setMatchesToCreate] = useState<MatchInput[]>([
    { id: crypto.randomUUID(), team1Id: undefined, team2Id: undefined, matchDate: undefined, matchTime: '', location: '', groupId: undefined },
    { id: crypto.randomUUID(), team1Id: undefined, team2Id: undefined, matchDate: undefined, matchTime: '', location: '', groupId: undefined },
  ]); // Start with 2 empty match slots
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session } = useSession();

  useEffect(() => {
    // Reset form when dialog opens/closes or roundId changes
    if (!open) {
      setMatchesToCreate([
        { id: crypto.randomUUID(), team1Id: undefined, team2Id: undefined, matchDate: undefined, matchTime: '', location: '', groupId: undefined },
        { id: crypto.randomUUID(), team1Id: undefined, team2Id: undefined, matchDate: undefined, matchTime: '', location: '', groupId: undefined },
      ]);
      setIsSubmitting(false);
    }
  }, [open, roundId]);

  const handleMatchInputChange = (index: number, field: keyof MatchInput, value: any) => {
    setMatchesToCreate(prev => {
      const newMatches = [...prev];
      newMatches[index] = { ...newMatches[index], [field]: value };
      return newMatches;
    });
  };

  const addMatchSlot = () => {
    setMatchesToCreate(prev => [
      ...prev,
      { id: crypto.randomUUID(), team1Id: undefined, team2Id: undefined, matchDate: undefined, matchTime: '', location: '', groupId: undefined },
    ]);
  };

  const removeMatchSlot = (idToRemove: string) => {
    setMatchesToCreate(prev => prev.filter(match => match.id !== idToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      showError("Você precisa estar logado para realizar esta ação.");
      return;
    }

    const validMatches = matchesToCreate.filter(m => m.team1Id && m.team2Id && m.team1Id !== m.team2Id);

    if (validMatches.length === 0) {
      showError("Adicione pelo menos uma partida válida (com dois times diferentes).");
      return;
    }

    setIsSubmitting(true);

    const matchesToInsert = validMatches.map(m => {
      let finalMatchDate = m.matchDate;
      if (finalMatchDate && m.matchTime) {
        const [hours, minutes] = m.matchTime.split(':').map(Number);
        finalMatchDate = setHours(finalMatchDate, hours);
        finalMatchDate = setMinutes(finalMatchDate, minutes);
      }

      return {
        championship_id: championshipId,
        user_id: session.user.id,
        team1_id: m.team1Id,
        team2_id: m.team2Id,
        match_date: finalMatchDate?.toISOString() || null,
        location: m.location.trim() === '' ? null : m.location.trim(),
        group_id: m.groupId || null,
        round_id: roundId, // This is the key part: associate with the current round
      };
    });

    const { error } = await supabase
      .from('matches')
      .insert(matchesToInsert);

    setIsSubmitting(false);

    if (error) {
      showError(`Erro ao adicionar partidas: ${error.message}`);
    } else {
      showSuccess(`${matchesToInsert.length} partida(s) adicionada(s) à rodada "${roundName}" com sucesso!`);
      setOpen(false);
      onMatchesAdded();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Partidas à Rodada "{roundName}"</DialogTitle>
          <DialogDescription>
            Selecione os times para cada partida. Todas as partidas serão associadas a esta rodada.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {matchesToCreate.map((matchInput, index) => (
              <div key={matchInput.id} className="border p-4 rounded-md relative">
                {matchesToCreate.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    onClick={() => removeMatchSlot(matchInput.id)}
                  >
                    <MinusCircle className="h-5 w-5" />
                  </Button>
                )}
                <h4 className="text-md font-semibold mb-3">Partida {index + 1}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`team1-${matchInput.id}`}>Time 1</Label>
                    <Select
                      value={matchInput.team1Id}
                      onValueChange={(value) => handleMatchInputChange(index, 'team1Id', value)}
                    >
                      <SelectTrigger id={`team1-${matchInput.id}`}>
                        <SelectValue placeholder="Selecione o time da casa" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.filter(t => t.id !== matchInput.team2Id).map(team => (
                          <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`team2-${matchInput.id}`}>Time 2</Label>
                    <Select
                      value={matchInput.team2Id}
                      onValueChange={(value) => handleMatchInputChange(index, 'team2Id', value)}
                    >
                      <SelectTrigger id={`team2-${matchInput.id}`}>
                        <SelectValue placeholder="Selecione o time visitante" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.filter(t => t.id !== matchInput.team1Id).map(team => (
                          <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`group-${matchInput.id}`}>Grupo (Opcional)</Label>
                    <Select
                      value={matchInput.groupId}
                      onValueChange={(value) => handleMatchInputChange(index, 'groupId', value)}
                    >
                      <SelectTrigger id={`group-${matchInput.id}`}>
                        <SelectValue placeholder="Selecione o grupo" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map(group => (
                          <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`location-${matchInput.id}`}>Local (Opcional)</Label>
                    <Input
                      id={`location-${matchInput.id}`}
                      value={matchInput.location}
                      onChange={(e) => handleMatchInputChange(index, 'location', e.target.value)}
                      placeholder="Estádio Municipal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`matchDate-${matchInput.id}`}>Data (Opcional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !matchInput.matchDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {matchInput.matchDate ? format(matchInput.matchDate, "PPP") : <span>Selecione uma data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={matchInput.matchDate}
                          onSelect={(date) => handleMatchInputChange(index, 'matchDate', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`matchTime-${matchInput.id}`}>Hora (Opcional)</Label>
                    <Input
                      id={`matchTime-${matchInput.id}`}
                      type="time"
                      value={matchInput.matchTime}
                      onChange={(e) => handleMatchInputChange(index, 'matchTime', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addMatchSlot} className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar mais uma partida
            </Button>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adicionando...' : 'Salvar Partidas'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}