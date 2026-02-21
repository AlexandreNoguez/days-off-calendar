import { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMediaQuery, useTheme } from "@mui/material";
import { toast } from "react-toastify";

import { AppShellView } from "./AppShell.view";
import { useAppStore } from "../../stores/app.store";
import { usePlanStore } from "../../stores/plan.store";
import { useCalendarStore } from "../../stores/calendar.store";
import { useEmployeesStore } from "../../stores/employees.store";
import { useRulesStore } from "../../stores/rules.store";
import { useScheduleStore } from "../../stores/schedule.store";
import { useValidationStore } from "../../stores/validation.store";
import { useAppThemeMode } from "../providers/themeMode.context";

type NavItem = {
  label: string;
  to: string;
};

export function AppShellContainer() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { mode, toggleMode } = useAppThemeMode();

  const clearLocalStorageOnly = useAppStore((s) => s.actions.clearLocalStorageOnly);
  const resetPlan = usePlanStore((s) => s.actions.resetPlan);
  const resetCalendar = useCalendarStore((s) => s.actions.resetCalendar);
  const resetEmployees = useEmployeesStore((s) => s.actions.resetEmployees);
  const setRules = useRulesStore((s) => s.actions.setRules);
  const resetSchedule = useScheduleStore((s) => s.actions.resetSchedule);
  const resetValidation = useValidationStore((s) => s.actions.resetValidation);

  const navItems: NavItem[] = useMemo(
    () => [
      { label: "Setup", to: "/wizard/setup" },
      { label: "Cadastros", to: "/cadastros" },
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
    if (isMobile) setMobileOpen(false);
  }

  function handleResetAll() {
    clearLocalStorageOnly();
    resetPlan();
    resetCalendar();
    resetEmployees();
    setRules([]);
    resetSchedule();
    resetValidation();

    navigate("/wizard/setup");

    if (isMobile) setMobileOpen(false);
    toast.success("Dados limpos. Planejamento reiniciado.");
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
      onResetAll={handleResetAll}
      themeMode={mode}
      onToggleThemeMode={toggleMode}
      content={<Outlet />}
    />
  );
}
