"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#17685f",
    },
    secondary: {
      main: "#7a4f16",
    },
    warning: {
      main: "#b45f06",
    },
  },
  shape: {
    borderRadius: 8,
  },
});

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
        <ToastContainer position="top-right" autoClose={2500} />
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
