import { useState } from 'react';
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
import { Sponsor } from './SponsorsTab';

interface DeleteSponsorDialogProps {
  sponsor: Sponsor;
  onSponsorDeleted: () => void;
  children: React.ReactNode;
}

export function DeleteSponsorDialog({ sponsor, onSponsorDeleted, children }: DeleteSponsorDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const { error } = await supabase
      .from('sponsors')
      .delete()
      .eq('id', sponsor.id);
    
    setIsDeleting(false);

    if (error) {
      showError(`Erro ao excluir patrocinador: ${error.message}`);
    } else {
      showSuccess("Patrocinador excluído com sucesso!");
      onSponsorDeleted();
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente o patrocinador "{sponsor.name}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}