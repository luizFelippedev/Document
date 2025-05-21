// frontend/src/hooks/useMediaQuery.ts
"use client";

import { useState, useEffect } from "react";

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window exists (for SSR)
    if (typeof window === "undefined") {
      return;
    }

    // Create media query
    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Create event listener
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener for subsequent changes
    mediaQuery.addEventListener("change", handler);

    // Clean up
    return () => {
      mediaQuery.removeEventListener("change", handler);
    };
  }, [query]);

  return matches;
};
