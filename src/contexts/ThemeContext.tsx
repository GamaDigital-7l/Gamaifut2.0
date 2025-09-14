import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useParams } from 'react-router-dom';
import { hexToHsl } from '@/lib/utils'; // Import the new utility

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
  // Removed toggleGlobalThemeMode and globalThemeMode as theme is now fixed to dark
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<ChampionshipTheme | null>(null);
  // Removed globalThemeMode state as theme is now fixed to dark
  const { id: championshipIdFromParams } = useParams<{ id: string }>();

  const applyThemeToDocument = useCallback((theme: ChampionshipTheme | null) => {
    const root = document.documentElement;
    // Always ensure dark class is present
    root.classList.add('dark'); 

    if (theme) {
      // Convert hex to HSL for custom properties
      root.style.setProperty('--championship-primary', hexToHsl(theme.theme_primary || '') || 'var(--primary)');
      root.style.setProperty('--championship-secondary', hexToHsl(theme.theme_secondary || '') || 'var(--secondary)');
      root.style.setProperty('--championship-accent', hexToHsl(theme.theme_accent || '') || 'var(--accent)');
      root.style.setProperty('--championship-bg', hexToHsl(theme.theme_bg || '') || 'var(--background)');
      root.style.setProperty('--championship-text', hexToHsl(theme.theme_text || '') || 'var(--foreground)');
      
      // Championship-specific theme_mode is now ignored, always dark
    } else {
      // Clear custom properties if no theme is active
      root.style.removeProperty('--championship-primary');
      root.style.removeProperty('--championship-secondary');
      root.style.removeProperty('--championship-accent');
      root.style.removeProperty('--championship-bg');
      root.style.removeProperty('--championship-text');
      
      // Always keep dark mode active
    }
  }, []); // Removed globalThemeMode from dependencies as it's no longer dynamic

  const fetchAndApplyChampionshipTheme = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('championships')
      .select('logo_url, theme_primary, theme_secondary, theme_accent, theme_bg, theme_text, theme_mode')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching championship theme for context:', error);
      setCurrentTheme(null);
      applyThemeToDocument(null); // Apply default dark theme if championship theme fails
    } else if (data) {
      setCurrentTheme(data);
      applyThemeToDocument(data);
    }
  }, [applyThemeToDocument]);

  // Removed toggleGlobalThemeMode

  // Effect to ensure dark mode is always applied
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Effect to fetch and apply championship theme or revert to default dark theme
  useEffect(() => {
    if (championshipIdFromParams) {
      fetchAndApplyChampionshipTheme(championshipIdFromParams);
    } else {
      setCurrentTheme(null);
      applyThemeToDocument(null); // This will now correctly revert to default dark theme
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