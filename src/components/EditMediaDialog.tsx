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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Media, Team, Round } from '@/types';

interface EditMediaDialogProps {
  media: Media;
  teams: Team[];
  rounds: Round[];
  onMediaUpdated: () => void;
  children: React.ReactNode;
}

export function EditMediaDialog({ media, teams, rounds, onMediaUpdated, children }: EditMediaDialogProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState(media.description || '');
  const [tags, setTags] = useState(media.tags?.join(', ') || '');
  const [isHighlight, setIsHighlight] = useState(media.is_highlight);
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>(media.team_id || undefined);
  const [selectedRoundId, setSelectedRoundId] = useState<string | undefined>(media.round_id || undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setDescription(media.description || '');
      setTags(media.tags?.join(', ') || '');
      setIsHighlight(media.is_highlight);
      setSelectedTeamId(media.team_id || undefined);
      setSelectedRoundId(media.round_id || undefined);
    }
  }, [media, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error: dbError } = await supabase
      .from('media')
      .update({
        description: description.trim() === '' ? null : description.trim(),
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        is_highlight: isHighlight,
        team_id: selectedTeamId || null,
        round_id: selectedRoundId || null,
      })
      .eq('id', media.id);

    setIsSubmitting(false);

    if (dbError) {
      showError(`Erro ao atualizar mídia: ${dbError.message}`);
    } else {
      showSuccess("Mídia atualizada com sucesso!");
      setOpen(false);
      onMediaUpdated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Mídia</DialogTitle>
          <DialogDescription>
            Atualize os detalhes da mídia.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Uma breve descrição da mídia..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (Separadas por vírgula, ex: gol, defesa, timeA)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="futebol, gol, timeA, final"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isHighlight"
                checked={isHighlight}
                onCheckedChange={setIsHighlight}
              />
              <Label htmlFor="isHighlight">Marcar como Destaque</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="team">Associar a um Time (Opcional)</Label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger id="team">
                  <SelectValue placeholder="Selecione um time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Nenhum</SelectItem> {/* Option to clear association */}
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="round">Associar a uma Rodada (Opcional)</Label>
              <Select value={selectedRoundId} onValueChange={setSelectedRoundId}>
                <SelectTrigger id="round">
                  <SelectValue placeholder="Selecione uma rodada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Nenhum</SelectItem> {/* Option to clear association */}
                  {rounds.map(round => (
                    <SelectItem key={round.id} value={round.id}>{round.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}