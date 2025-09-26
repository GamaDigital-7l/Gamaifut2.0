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
import { Media } from '@/types';

interface DeleteMediaDialogProps {
  media: Media;
  onMediaDeleted: () => void;
  children: React.ReactNode;
}

export function DeleteMediaDialog({ media, onMediaDeleted, children }: DeleteMediaDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    // First, delete the entry from the database
    const { error: dbError } = await supabase
      .from('media')
      .delete()
      .eq('id', media.id);

    if (dbError) {
      showError(`Erro ao excluir mídia do banco de dados: ${dbError.message}`);
      setIsDeleting(false);
      return;
    }

    // If database deletion is successful, attempt to delete the file from MinIO via Edge Function
    try {
      const edgeFunctionUrl = `https://rrwtsnecjuugqlwmpgzd.supabase.co/functions/v1/delete-media-from-minio`;
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Assuming the user is authenticated, pass the token if needed by the edge function
          // 'Authorization': `Bearer ${session?.access_token}`, 
        },
        body: JSON.stringify({ fileUrl: media.url }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Edge Function response error:', data);
        // Even if file deletion fails, we consider the media deleted from the app's perspective
        showError(`Mídia excluída do app, mas erro ao remover arquivo do armazenamento: ${data.error || 'Erro desconhecido'}`);
      } else {
        showSuccess("Mídia excluída com sucesso!");
      }
    } catch (error: any) {
      console.error('Error calling Edge Function for delete:', error);
      showError('Mídia excluída do app, mas erro ao remover arquivo do armazenamento: ' + error.message);
    } finally {
      setIsDeleting(false);
      onMediaDeleted();
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente a mídia "{media.description || media.url.split('/').pop()}" do campeonato e do armazenamento.
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