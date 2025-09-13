import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

interface Match {
  id: string;
  team1: { name: string };
  team2: { name: string };
}

interface DeleteMatchDialogProps {
  match: Match;
  onMatchDeleted: () => void;
  children: React.ReactNode;
}

export function DeleteMatchDialog({ match, onMatchDeleted, children }: DeleteMatchDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', match.id);
    
    setIsDeleting(false);

    if (error) {
      showError(`Erro ao excluir partida: ${error.message}`);
    } else {
      showSuccess("Partida excluída com sucesso!");
      onMatchDeleted();
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            {`Esta ação não pode ser desfeita. Isso excluirá permanentemente a partida entre ${match.team1.name} e ${match.team2.name}.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}