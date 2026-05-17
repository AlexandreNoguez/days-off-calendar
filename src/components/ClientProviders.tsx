"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { AppThemeProvider } from "@/src/app/providers/ThemeProvider";
import { ToastProvider } from "@/src/app/providers/ToastProvider";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <AppThemeProvider>
        <ToastProvider>
          <CssBaseline />
          {children}
        </ToastProvider>
      </AppThemeProvider>
    </AppRouterCacheProvider>
  );
}
