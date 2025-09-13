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

interface Team {
  id: string;
  name: string;
}

interface EditTeamDialogProps {
  team: Team;
  onTeamUpdated: () => void;
  children: React.ReactNode;
}

export function EditTeamDialog({ team, onTeamUpdated, children }: EditTeamDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(team.name);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setName(team.name);
  }, [team]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showError("O nome do time é obrigatório.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('teams')
      .update({ name })
      .eq('id', team.id);

    setIsSubmitting(false);

    if (error) {
      showError(`Erro ao atualizar time: ${error.message}`);
    } else {
      showSuccess("Time atualizado com sucesso!");
      setOpen(false);
      onTeamUpdated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Time</DialogTitle>
          <DialogDescription>
            Altere o nome do time e clique em salvar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
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