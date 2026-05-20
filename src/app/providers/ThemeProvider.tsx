"use client";

import { useMemo, useSyncExternalStore, type ReactNode } from "react";
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import {
  ThemeModeContext,
  type ThemeContextValue,
  type ThemeMode,
} from "./themeMode.context";

const STORAGE_KEY = "escala_folgas_theme_mode";
const COOKIE_KEY = "theme-mode";
const THEME_MODE_CHANGE_EVENT = "escala-theme-mode-change";

function getStoredMode(): ThemeMode | null {
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem(STORAGE_KEY);

  return stored === "dark" ? "dark" : stored === "light" ? "light" : null;
}

function saveThemeMode(mode: ThemeMode) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, mode);
  document.cookie = `${COOKIE_KEY}=${mode}; path=/; max-age=31536000; SameSite=Lax`;
  window.dispatchEvent(new Event(THEME_MODE_CHANGE_EVENT));
}

function subscribeThemeMode(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_MODE_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_MODE_CHANGE_EVENT, onStoreChange);
  };
}

function getThemeModeSnapshot(): ThemeMode {
  return getStoredMode() ?? "light";
}

function getServerThemeModeSnapshot(): ThemeMode {
  return "light";
}

type Props = {
  children: ReactNode;
};

export function AppThemeProvider({ children }: Props) {
  const mode = useSyncExternalStore(
    subscribeThemeMode,
    getThemeModeSnapshot,
    getServerThemeModeSnapshot,
  );

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
        const next: ThemeMode = mode === "light" ? "dark" : "light";
        saveThemeMode(next);
      },
    }),
    [mode],
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
