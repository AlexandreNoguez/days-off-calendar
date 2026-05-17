import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import "../src/index.css";
import { ClientProviders } from "@/src/components/ClientProviders";

export const metadata: Metadata = {
  title: "Escala de Folgas",
  description: "Planejamento de escala de folgas com regras e auditoria.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <AppRouterCacheProvider>
          <ClientProviders>{children}</ClientProviders>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
