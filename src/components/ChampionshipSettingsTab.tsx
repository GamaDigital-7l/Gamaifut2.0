import { useState, useEffect, FormEvent, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showSuccess, showError } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Championship } from '@/types'; // Import Championship type

interface ChampionshipSettingsTabProps {
  championshipId: string;
  championship: Championship; // Pass championship data as prop
  isLoading: boolean;
  onDataChange: () => void; // Callback to notify parent of data changes
}

interface ChampionshipSettings {
  points_for_win: number;
  sport_type: string;
  gender: string;
  age_category: string;
}

export function ChampionshipSettingsTab({ championshipId, championship, isLoading, onDataChange }: ChampionshipSettingsTabProps) {
  const [settings, setSettings] = useState<ChampionshipSettings | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (championship) {
      setSettings({
        points_for_win: championship.points_for_win,
        sport_type: championship.sport_type,
        gender: championship.gender,
        age_category: championship.age_category,
      });
    }
  }, [championship]);

  const handleSettingChange = (field: keyof ChampionshipSettings, value: string | number) => {
    if (settings) {
      setSettings({ ...settings, [field]: value });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from('championships')
      .update(settings)
      .eq('id', championshipId);

    setIsSubmitting(false);

    if (error) {
      showError('Erro ao salvar configurações: ' + error.message);
    } else {
      showSuccess('Configurações salvas com sucesso!');
      onDataChange(); // Notify parent of change
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-10 w-full" /></div>
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações e Regras</CardTitle>
        <CardDescription>Defina as regras e detalhes do seu campeonato.</CardDescription>
      </CardHeader>
      <CardContent>
        {settings && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="points_for_win">Pontos por Vitória</Label>
              <Select
                value={settings.points_for_win.toString()}
                onValueChange={(value) => handleSettingChange('points_for_win', parseInt(value, 10))}
              >
                <SelectTrigger id="points_for_win"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 pontos</SelectItem>
                  <SelectItem value="2">2 pontos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sport_type">Modalidade</Label>
              <Select
                value={settings.sport_type}
                onValueChange={(value) => handleSettingChange('sport_type', value)}
              >
                <SelectTrigger id="sport_type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="futebol_de_campo">Futebol de Campo</SelectItem>
                  <SelectItem value="fut7">Fut7</SelectItem>
                  <SelectItem value="futsal">Futsal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gênero</Label>
              <Select
                value={settings.gender}
                onValueChange={(value) => handleSettingChange('gender', value)}
              >
                <SelectTrigger id="gender"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                  <SelectItem value="misto">Misto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="age_category">Categoria</Label>
              <Select
                value={settings.age_category}
                onValueChange={(value) => handleSettingChange('age_category', value)}
              >
                <SelectTrigger id="age_category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="infantil">Infantil</SelectItem>
                  <SelectItem value="jovem">Jovem</SelectItem>
                  <SelectItem value="adulto">Adulto (Sênior)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}