import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/Colors';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  colors: typeof Colors.light;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('auto');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Load saved theme preference
    loadThemePreference();
  }, []);

  useEffect(() => {
    // Update isDark based on theme setting
    if (theme === 'auto') {
      setIsDark(systemColorScheme === 'dark');
    } else {
      setIsDark(theme === 'dark');
    }
  }, [theme, systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_preference');
      if (savedTheme) {
        setThemeState(savedTheme as Theme);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem('theme_preference', newTheme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('light');
    } else {
      // If auto, switch to opposite of current
      setTheme(isDark ? 'light' : 'dark');
    }
  };

  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        colors,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Helper hook for getting themed styles
export const useThemedStyles = <T extends Record<string, any>>(
  stylesFn: (colors: typeof Colors.light, isDark: boolean) => T
): T => {
  const { colors, isDark } = useTheme();
  return stylesFn(colors, isDark);
};