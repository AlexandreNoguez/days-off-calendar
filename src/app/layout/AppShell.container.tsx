import { useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useMediaQuery, useTheme } from "@mui/material";

import { AppShellView } from "./AppShell.view";

type NavItem = {
  label: string;
  to: string;
};

export function AppShellContainer() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);

  const location = useLocation();

  const navItems: NavItem[] = useMemo(
    () => [
      { label: "Setup", to: "/wizard/setup" },
      { label: "Employees", to: "/wizard/employees" },
      { label: "Rules", to: "/wizard/rules" },
      { label: "Schedule", to: "/wizard/schedule" },
      { label: "Export", to: "/wizard/export" },
    ],
    [],
  );

  function handleToggleMobileDrawer() {
    setMobileOpen((prev) => !prev);
  }

  function handleCloseMobileDrawer() {
    setMobileOpen(false);
  }

  function handleNavItemClick() {
    // Close drawer when navigating on mobile.
    if (isMobile) setMobileOpen(false);
  }

  return (
    <AppShellView
      title="Escala de Folgas"
      navItems={navItems}
      currentPath={location.pathname}
      isMobile={isMobile}
      mobileOpen={mobileOpen}
      onToggleMobileDrawer={handleToggleMobileDrawer}
      onCloseMobileDrawer={handleCloseMobileDrawer}
      onNavItemClick={handleNavItemClick}
      content={<Outlet />}
    />
  );
}
