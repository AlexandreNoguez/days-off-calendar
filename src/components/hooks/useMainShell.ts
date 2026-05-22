"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { PublicUser, UserRole } from "../../lib/types";
import { useAppThemeMode } from "@/src/app/providers/themeMode.context";

export type NavItem = {
  label: string;
  href: string;
  allowedRoles?: UserRole[];
};

const NAV_ITEMS: NavItem[] = [
  { label: "Setup", href: "/setup", allowedRoles: ["ADMIN"] },
  { label: "Cadastros", href: "/cadastros", allowedRoles: ["ADMIN"] },
  { label: "Escala", href: "/schedule", allowedRoles: ["ADMIN", "USER"] },
  { label: "Equilibrio", href: "/fairness", allowedRoles: ["ADMIN"] },
  { label: "Exportar", href: "/export", allowedRoles: ["ADMIN"] },
  { label: "Nutri", href: "/nutri", allowedRoles: ["NUTRI"] },
  { label: "Administrador", href: "/admin", allowedRoles: ["ADMIN"] },
];

export function useMainShell(user: PublicUser) {
  const pathname = usePathname();
  const router = useRouter();
  const themeMode = useAppThemeMode();

  const visibleItems = useMemo(
    () =>
      NAV_ITEMS.filter(
        (item) => !item.allowedRoles || item.allowedRoles.includes(user.role),
      ),
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
