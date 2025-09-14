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

interface Championship {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  state: string | null;
}

interface EditChampionshipDialogProps {
  championship: Championship;
  onChampionshipUpdated: () => void;
  children: React.ReactNode;
}

export function EditChampionshipDialog({ championship, onChampionshipUpdated, children }: EditChampionshipDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(championship.name);
  const [description, setDescription] = useState(championship.description || '');
  const [city, setCity] = useState(championship.city || '');
  const [state, setState] = useState(championship.state || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setName(championship.name);
    setDescription(championship.description || '');
    setCity(championship.city || '');
    setState(championship.state || '');
  }, [championship]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showError("O nome do campeonato é obrigatório.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('championships')
      .update({ name, description, city, state })
      .eq('id', championship.id);

    setIsSubmitting(false);

    if (error) {
      showError(`Erro ao atualizar campeonato: ${error.message}`);
    } else {
      showSuccess("Campeonato atualizado com sucesso!");
      setOpen(false);
      onChampionshipUpdated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Campeonato</DialogTitle>
          <DialogDescription>
            Altere as informações do seu campeonato.
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                placeholder="Descrição opcional do campeonato"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="city" className="text-right">
                Cidade
              </Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="col-span-3"
                placeholder="São Paulo"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="state" className="text-right">
                Estado
              </Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="col-span-3"
                placeholder="SP"
              />
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