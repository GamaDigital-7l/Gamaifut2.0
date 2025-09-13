import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useParams } from 'react-router-dom';

interface ChampionshipTheme {
  logo_url: string | null;
  theme_primary: string | null;
  theme_secondary: string | null;
  theme_accent: string | null;
  theme_bg: string | null;
  theme_text: string | null;
  theme_mode: string | null;
}

interface ThemeContextType {
  currentTheme: ChampionshipTheme | null;
  applyThemeToDocument: (theme: ChampionshipTheme | null) => void;
  fetchAndApplyChampionshipTheme: (championshipId: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<ChampionshipTheme | null>(null);
  const { id: championshipIdFromParams } = useParams<{ id: string }>();

  const applyThemeToDocument = useCallback((theme: ChampionshipTheme | null) => {
    const root = document.documentElement;
    if (theme) {
      root.style.setProperty('--championship-primary', theme.theme_primary || '');
      root.style.setProperty('--championship-secondary', theme.theme_secondary || '');
      root.style.setProperty('--championship-accent', theme.theme_accent || '');
      root.style.setProperty('--championship-bg', theme.theme_bg || '');
      root.style.setProperty('--championship-text', theme.theme_text || '');
      
      if (theme.theme_mode === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } else {
      // Clear custom properties if no theme is active
      root.style.removeProperty('--championship-primary');
      root.style.removeProperty('--championship-secondary');
      root.style.removeProperty('--championship-accent');
      root.style.removeProperty('--championship-bg');
      root.style.removeProperty('--championship-text');
      root.classList.remove('dark'); // Ensure dark mode is off if no theme
    }
  }, []);

  const fetchAndApplyChampionshipTheme = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('championships')
      .select('logo_url, theme_primary, theme_secondary, theme_accent, theme_bg, theme_text, theme_mode')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching championship theme for context:', error);
      setCurrentTheme(null);
      applyThemeToDocument(null);
    } else if (data) {
      setCurrentTheme(data);
      applyThemeToDocument(data);
    }
  }, [applyThemeToDocument]);

  useEffect(() => {
    if (championshipIdFromParams) {
      fetchAndApplyChampionshipTheme(championshipIdFromParams);
    } else {
      // If not on a championship page, clear any applied theme
      setCurrentTheme(null);
      applyThemeToDocument(null);
    }
  }, [championshipIdFromParams, fetchAndApplyChampionshipTheme, applyThemeToDocument]);

  return (
    <ThemeContext.Provider value={{ currentTheme, applyThemeToDocument, fetchAndApplyChampionshipTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useChampionshipTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useChampionshipTheme must be used within a ThemeProvider');
  }
  return context;
};