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
  tie_breaker_order: string[]; // Added for tie-breaker rules
}

const availableTieBreakers = [
  { value: 'wins', label: 'Vitórias' },
  { value: 'goal_difference', label: 'Saldo de Gols' },
  { value: 'goals_for', label: 'Gols Pró' },
  { value: 'head_to_head', label: 'Confronto Direto' }, // Note: Head-to-head is complex to implement fully in leaderboard, often requires specific match data.
  { value: 'least_red_cards', label: 'Menos Cartões Vermelhos' },
  { value: 'least_yellow_cards', label: 'Menos Cartões Amarelos' },
];

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
        tie_breaker_order: championship.tie_breaker_order || [], // Initialize with existing or empty array
      });
    }
  }, [championship]);

  const handleSettingChange = (field: keyof ChampionshipSettings, value: string | number | string[]) => {
    if (settings) {
      setSettings({ ...settings, [field]: value });
    }
  };

  const handleTieBreakerChange = (index: number, value: string) => {
    if (settings) {
      const newOrder = [...settings.tie_breaker_order];
      newOrder[index] = value;
      // Fill any gaps if a middle item is selected
      for (let i = 0; i < newOrder.length; i++) {
        if (!newOrder[i]) newOrder[i] = ''; // Ensure no undefined values
      }
      handleSettingChange('tie_breaker_order', newOrder.filter(Boolean)); // Filter out empty strings
    }
  };

  const getAvailableOptions = (currentIndex: number) => {
    if (!settings) return availableTieBreakers;
    const selectedValues = settings.tie_breaker_order.filter((_, i) => i !== currentIndex);
    return availableTieBreakers.filter(option => !selectedValues.includes(option.value));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from('championships')
      .update({
        points_for_win: settings.points_for_win,
        sport_type: settings.sport_type,
        gender: settings.gender,
        age_category: settings.age_category,
        tie_breaker_order: settings.tie_breaker_order,
      })
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
          <div className="space-y-2"><Skeleton className="h-5 w-48" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-5 w-48" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-5 w-48" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-5 w-48" /><Skeleton className="h-10 w-full" /></div>
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

            <div className="space-y-4 border-t pt-4 mt-6">
              <h3 className="text-lg font-semibold">Critérios de Desempate (Ordem de Prioridade)</h3>
              <p className="text-sm text-muted-foreground">
                Defina a ordem dos critérios para desempatar times com a mesma pontuação.
                Pontos é sempre o primeiro critério.
              </p>
              {[0, 1, 2, 3].map((index) => ( // Allow up to 4 tie-breakers
                <div key={index} className="space-y-2">
                  <Label htmlFor={`tie-breaker-${index}`}>
                    {index + 1}º Critério
                  </Label>
                  <Select
                    value={settings.tie_breaker_order[index] || ''}
                    onValueChange={(value) => handleTieBreakerChange(index, value)}
                  >
                    <SelectTrigger id={`tie-breaker-${index}`}>
                      <SelectValue placeholder={`Selecione o ${index + 1}º critério`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem> {/* Option to clear a selection */}
                      {getAvailableOptions(index).map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
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