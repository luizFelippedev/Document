// src/hooks/useTheme.ts
"use client";

import { useCallback, useEffect } from "react";
import { ThemeMode } from "@/types/common";
import { useLocalStorage } from "./useLocalStorage";
import { useMediaQuery } from "./useMediaQuery";

interface UseThemeReturn {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const useTheme = (): UseThemeReturn => {
  // Use local storage to store theme preference
  const [theme, setThemeValue] = useLocalStorage<ThemeMode>("theme", "system");

  // Check system preference
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  // Calculate if we should use dark mode
  const isDarkMode =
    theme === "dark" || (theme === "system" && prefersDarkMode);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    setThemeValue((prev) => (prev === "dark" ? "light" : "dark"));
  }, [setThemeValue]);

  // Set theme
  const setTheme = useCallback(
    (value: ThemeMode) => {
      setThemeValue(value);
    },
    [setThemeValue],
  );

  // Update document classes when theme changes
  useEffect(() => {
    const root = window.document.documentElement;

    if (isDarkMode) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [isDarkMode]);

  return {
    theme,
    setTheme,
    isDarkMode,
    toggleTheme,
  };
};
