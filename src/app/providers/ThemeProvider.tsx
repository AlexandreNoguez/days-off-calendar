import { useMemo, useState, type ReactNode } from "react";
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";
import {
  ThemeModeContext,
  type ThemeContextValue,
  type ThemeMode,
} from "./themeMode.context";

const STORAGE_KEY = "escala_folgas_theme_mode";

function getInitialMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "dark" ? "dark" : "light";
}

type Props = {
  children: ReactNode;
};

export function AppThemeProvider({ children }: Props) {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode);

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
          if (typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, next);
          }
          return next;
        });
      },
    }),
    [mode],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeModeContext.Provider>
  );
}
