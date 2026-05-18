"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { PublicUser } from "../../lib/types";
import { useAppThemeMode } from "@/src/app/providers/themeMode.context";

export type NavItem = {
  label: string;
  href: string;
  adminOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Setup", href: "/setup", adminOnly: true },
  { label: "Cadastros", href: "/cadastros", adminOnly: true },
  { label: "Escala", href: "/schedule" },
  { label: "Exportar", href: "/export", adminOnly: true },
  { label: "Administrador", href: "/admin", adminOnly: true },
];

export function useMainShell(user: PublicUser) {
  const pathname = usePathname();
  const router = useRouter();
  const themeMode = useAppThemeMode();

  const visibleItems = useMemo(
    () => NAV_ITEMS.filter((item) => !item.adminOnly || user.role === "ADMIN"),
    [user.role],
  );

  function isSelected(href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return {
    pathname,
    visibleItems,
    themeMode,
    isSelected,
    logout,
  };
}
