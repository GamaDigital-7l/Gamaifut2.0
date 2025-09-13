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
import { Switch } from "@/components/ui/switch";
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionProvider';
import { showSuccess, showError } from '@/utils/toast';
import { Sponsor } from './SponsorsTab';

interface CreateSponsorDialogProps {
  championshipId: string;
  existingSponsors: Sponsor[];
  onSponsorCreated: () => void;
}

export function CreateSponsorDialog({ championshipId, existingSponsors, onSponsorCreated }: CreateSponsorDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [level, setLevel] = useState<'ouro' | 'prata' | 'bronze' | undefined>(undefined);
  const [logoFile, setLogoFile] = useState<File | null>(null); // State for the selected file
  const [targetUrl, setTargetUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session } = useSession();

  const QUOTAS = {
    ouro: 1,
    prata: 2,
    bronze: 2,
  };

  const checkQuota = (selectedLevel: 'ouro' | 'prata' | 'bronze') => {
    const count = existingSponsors.filter(s => s.level === selectedLevel).length;
    return count < QUOTAS[selectedLevel];
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    } else {
      setLogoFile(null);
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !session?.user) return null;

    const fileExt = logoFile.name.split('.').pop();
    const fileName = `${championshipId}-${name.replace(/\s/g, '-')}-${Math.random()}.${fileExt}`;
    const filePath = `${session.user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('sponsor-logos')
      .upload(filePath, logoFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      showError('Erro ao fazer upload do logo do patrocinador: ' + uploadError.message);
      return null;
    }

    const { data } = supabase.storage
      .from('sponsor-logos')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !level || !session?.user) {
      showError("Nome e Nível são obrigatórios.");
      return;
    }

    if (!checkQuota(level)) {
      showError(`Limite de patrocinadores do nível "${level}" atingido.`);
      return;
    }

    setIsSubmitting(true);
    let logo_url = null;

    if (logoFile) {
      const uploadedUrl = await uploadLogo();
      if (uploadedUrl) {
        logo_url = uploadedUrl;
      } else {
        setIsSubmitting(false);
        return; // Stop if upload failed
      }
    }

    const { error } = await supabase
      .from('sponsors')
      .insert([{
        championship_id: championshipId,
        user_id: session.user.id,
        name,
        level,
        logo_url,
        target_url: targetUrl,
        is_active: isActive,
      }]);

    setIsSubmitting(false);

    if (error) {
      showError(`Erro ao criar patrocinador: ${error.message}`);
    } else {
      showSuccess("Patrocinador criado com sucesso!");
      setName('');
      setLevel(undefined);
      setLogoFile(null);
      setTargetUrl('');
      setIsActive(true);
      setOpen(false);
      onSponsorCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Adicionar Patrocinador</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Patrocinador</DialogTitle>
          <DialogDescription>
            Preencha as informações do patrocinador.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="level" className="text-right">Nível</Label>
              <Select value={level} onValueChange={(value) => setLevel(value as any)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ouro" disabled={!checkQuota('ouro')}>Ouro ({existingSponsors.filter(s => s.level === 'ouro').length}/{QUOTAS.ouro})</SelectItem>
                  <SelectItem value="prata" disabled={!checkQuota('prata')}>Prata ({existingSponsors.filter(s => s.level === 'prata').length}/{QUOTAS.prata})</SelectItem>
                  <SelectItem value="bronze" disabled={!checkQuota('bronze')}>Bronze ({existingSponsors.filter(s => s.level === 'bronze').length}/{QUOTAS.bronze})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="logoUpload" className="text-right">Logo (PNG/SVG/JPG)</Label>
              <Input id="logoUpload" type="file" accept="image/png, image/svg+xml, image/jpeg" onChange={handleLogoFileChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="targetUrl" className="text-right">URL de Destino</Label>
              <Input id="targetUrl" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} className="col-span-3" placeholder="https://site.com" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">Ativo</Label>
              <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
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