"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import {
  ThemeModeContext,
  type ThemeContextValue,
  type ThemeMode,
} from "./themeMode.context";

const STORAGE_KEY = "escala_folgas_theme_mode";
const COOKIE_KEY = "theme-mode";

function getStoredMode(): ThemeMode | null {
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem(STORAGE_KEY);

  return stored === "dark" ? "dark" : stored === "light" ? "light" : null;
}

function saveThemeMode(mode: ThemeMode) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, mode);
  document.cookie = `${COOKIE_KEY}=${mode}; path=/; max-age=31536000; SameSite=Lax`;
}

type Props = {
  children: ReactNode;
};

export function AppThemeProvider({ children }: Props) {
  /**
   * Important:
   * The initial value must be the same on server and client.
   * Do not read localStorage here.
   */
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const storedMode = getStoredMode();

    if (storedMode) {
      setMode(storedMode);
    }
  }, []);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: "#1976d2" },
        },
      }),
    [mode],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      toggleMode: () => {
        setMode((prev) => {
          const next: ThemeMode = prev === "light" ? "dark" : "light";

          saveThemeMode(next);

          return next;
        });
      },
    }),
    [],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeModeContext.Provider>
  );
}
