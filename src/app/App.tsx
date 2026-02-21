import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { ToastProvider } from "./providers/ToastProvider";
import { AppThemeProvider } from "./providers/ThemeProvider";

export default function App() {
  return (
    <AppThemeProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AppThemeProvider>
  );
}
