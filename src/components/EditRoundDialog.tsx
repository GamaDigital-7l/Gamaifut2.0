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
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Round } from './RoundsTab';

interface EditRoundDialogProps {
  round: Round;
  onRoundUpdated: () => void;
  children: React.ReactNode;
}

export function EditRoundDialog({ round, onRoundUpdated, children }: EditRoundDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(round.name);
  const [orderIndex, setOrderIndex] = useState(round.order_index.toString());
  const [type, setType] = useState(round.type);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setName(round.name);
    setOrderIndex(round.order_index.toString());
    setType(round.type);
  }, [round]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showError("O nome da rodada é obrigatório.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('rounds')
      .update({ 
        name, 
        order_index: parseInt(orderIndex, 10),
        type,
      })
      .eq('id', round.id);

    setIsSubmitting(false);

    if (error) {
      showError(`Erro ao atualizar rodada: ${error.message}`);
    } else {
      showSuccess("Rodada atualizada com sucesso!");
      setOpen(false);
      onRoundUpdated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Rodada</DialogTitle>
          <DialogDescription>
            Altere as informações da rodada/fase.
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
              <Label htmlFor="orderIndex" className="text-right">
                Ordem
              </Label>
              <Input
                id="orderIndex"
                type="number"
                value={orderIndex}
                onChange={(e) => setOrderIndex(e.target.value)}
                className="col-span-3"
                min="0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Tipo
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="group_stage">Fase de Grupos</SelectItem>
                  <SelectItem value="round_of_16">Oitavas de Final</SelectItem>
                  <SelectItem value="quarter_finals">Quartas de Final</SelectItem>
                  <SelectItem value="semi_finals">Semi Final</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
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