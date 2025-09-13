import { useState } from 'react';
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
import { useSession } from '@/components/SessionProvider';
import { showSuccess, showError } from '@/utils/toast';

interface CreateRoundDialogProps {
  championshipId: string;
  onRoundCreated: () => void;
}

export function CreateRoundDialog({ championshipId, onRoundCreated }: CreateRoundDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [orderIndex, setOrderIndex] = useState('0');
  const [type, setType] = useState('group_stage');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !session?.user) {
      showError("O nome da rodada é obrigatório.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('rounds')
      .insert([{ 
        name, 
        championship_id: championshipId,
        user_id: session.user.id,
        order_index: parseInt(orderIndex, 10),
        type,
      }]);

    setIsSubmitting(false);

    if (error) {
      showError(`Erro ao criar rodada: ${error.message}`);
    } else {
      showSuccess("Rodada criada com sucesso!");
      setName('');
      setOrderIndex('0');
      setType('group_stage');
      setOpen(false);
      onRoundCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Adicionar Rodada</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Rodada</DialogTitle>
          <DialogDescription>
            Defina um nome, ordem e tipo para a nova rodada/fase.
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
                placeholder="Rodada 1"
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
                placeholder="0"
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
                  <SelectItem value="knockout">Mata-mata</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}