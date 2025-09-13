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
  toggleGlobalThemeMode: () => void; // Add toggle function
  globalThemeMode: 'light' | 'dark'; // Add global theme mode state
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<ChampionshipTheme | null>(null);
  const [globalThemeMode, setGlobalThemeMode] = useState<'light' | 'dark'>(() => {
    // Initialize from localStorage or system preference
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedTheme = window.localStorage.getItem('globalThemeMode');
      return storedTheme === 'dark' ? 'dark' : 'light';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const { id: championshipIdFromParams } = useParams<{ id: string }>();

  const applyThemeToDocument = useCallback((theme: ChampionshipTheme | null) => {
    const root = document.documentElement;
    if (theme) {
      // Convert hex to HSL for custom properties
      root.style.setProperty('--championship-primary', hexToHsl(theme.theme_primary || '') || 'var(--primary)');
      root.style.setProperty('--championship-secondary', hexToHsl(theme.theme_secondary || '') || 'var(--secondary)');
      root.style.setProperty('--championship-accent', hexToHsl(theme.theme_accent || '') || 'var(--accent)');
      root.style.setProperty('--championship-bg', hexToHsl(theme.theme_bg || '') || 'var(--background)');
      root.style.setProperty('--championship-text', hexToHsl(theme.theme_text || '') || 'var(--foreground)');
      
      // Apply championship-specific dark/light mode
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
      
      // Revert to global theme mode
      if (globalThemeMode === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [globalThemeMode]);

  const fetchAndApplyChampionshipTheme = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('championships')
      .select('logo_url, theme_primary, theme_secondary, theme_accent, theme_bg, theme_text, theme_mode')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching championship theme for context:', error);
      setCurrentTheme(null);
      applyThemeToDocument(null); // Apply global theme if championship theme fails
    } else if (data) {
      setCurrentTheme(data);
      applyThemeToDocument(data);
    }
  }, [applyThemeToDocument]);

  const toggleGlobalThemeMode = useCallback(() => {
    setGlobalThemeMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      window.localStorage.setItem('globalThemeMode', newMode);
      return newMode;
    });
  }, []);

  // Effect to apply global theme mode when championshipIdFromParams is not present
  useEffect(() => {
    const root = document.documentElement;
    if (!championshipIdFromParams) {
      if (globalThemeMode === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [globalThemeMode, championshipIdFromParams]);

  // Effect to fetch and apply championship theme or revert to global theme
  useEffect(() => {
    if (championshipIdFromParams) {
      fetchAndApplyChampionshipTheme(championshipIdFromParams);
    } else {
      setCurrentTheme(null);
      applyThemeToDocument(null); // This will now correctly revert to globalThemeMode
    }
  }, [championshipIdFromParams, fetchAndApplyChampionshipTheme, applyThemeToDocument]);

  return (
    <ThemeContext.Provider value={{ currentTheme, applyThemeToDocument, fetchAndApplyChampionshipTheme, toggleGlobalThemeMode, globalThemeMode }}>
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