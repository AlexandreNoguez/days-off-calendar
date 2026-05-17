import type { Metadata } from "next";
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
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
