import { createBrowserRouter, Navigate } from "react-router-dom";

import { AppShellContainer } from "./layout/AppShell.container";

import { WizardLayoutContainer } from "../features/wizard/WizardLayout.container";
import { SetupPageContainer } from "../features/setup/SetupPage.container";
import { EmployeesPageContainer } from "../features/employees/EmployeesPage.container";
import { RulesPageContainer } from "../features/rules/RulesPage.container";
import { SchedulePageContainer } from "../features/schedule/SchedulePage.container";
import { ExportPageContainer } from "../features/export/ExportPage.container";
import { CadastrosPageContainer } from "../features/cadastros/CadastrosPage.container";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShellContainer />,
    children: [
      { index: true, element: <Navigate to="/wizard/setup" replace /> },

      {
        path: "wizard",
        element: <WizardLayoutContainer />,
        children: [
          { index: true, element: <Navigate to="/wizard/setup" replace /> },
          { path: "setup", element: <SetupPageContainer /> },
          { path: "schedule", element: <SchedulePageContainer /> },
          { path: "export", element: <ExportPageContainer /> },
        ],
      },

      { path: "cadastros", element: <CadastrosPageContainer /> },

      // Optional direct routes (same containers)
      { path: "setup", element: <SetupPageContainer /> },
      { path: "employees", element: <EmployeesPageContainer /> },
      { path: "rules", element: <RulesPageContainer /> },
      { path: "schedule", element: <SchedulePageContainer /> },
      { path: "export", element: <ExportPageContainer /> },
    ],
  },
]);
