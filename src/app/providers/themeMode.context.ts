import { createContext, useContext } from "react";

export type ThemeMode = "light" | "dark";

export type ThemeContextValue = {
  mode: ThemeMode;
  toggleMode: () => void;
};

export const ThemeModeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);

export function useAppThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error("useAppThemeMode must be used within AppThemeProvider");
  return ctx;
}
