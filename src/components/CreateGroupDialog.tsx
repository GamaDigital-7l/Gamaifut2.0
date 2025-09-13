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
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionProvider';
import { showSuccess, showError } from '@/utils/toast';

interface CreateGroupDialogProps {
  championshipId: string;
  onGroupCreated: () => void;
}

export function CreateGroupDialog({ championshipId, onGroupCreated }: CreateGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !session?.user) {
      showError("O nome do grupo é obrigatório.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('groups')
      .insert([{ 
        name, 
        championship_id: championshipId,
        user_id: session.user.id 
      }]);

    setIsSubmitting(false);

    if (error) {
      showError(`Erro ao criar grupo: ${error.message}`);
    } else {
      showSuccess("Grupo criado com sucesso!");
      setName('');
      setOpen(false);
      onGroupCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Adicionar Grupo</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Grupo</DialogTitle>
          <DialogDescription>
            Defina um nome para o novo grupo (ex: Grupo A, Grupo B).
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
                placeholder="Grupo A"
                required
              />
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