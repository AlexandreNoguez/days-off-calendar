import { useMemo } from "react";
import { Navigate, useParams } from "react-router-dom";

import { useEmployeesPage } from "../employees/useEmployeesPage";
import { useRulesPage } from "../rules/useRulesPage";
import { useSeedDefaults } from "../wizard/useSeedDefaults";

import {
  CadastrosPageView,
  type CadastrosSection,
} from "./CadastrosPage.view";

const allowedSections: CadastrosSection[] = ["employees", "roles", "rules"];

export function CadastrosPageContainer() {
  const { section } = useParams<{ section?: string }>();

  const currentSection = useMemo(() => {
    if (section && allowedSections.includes(section as CadastrosSection)) {
      return section as CadastrosSection;
    }

    return null;
  }, [section]);

  const employeesPage = useEmployeesPage();
  const rulesPage = useRulesPage();
  const seedDefaults = useSeedDefaults();

  if (!currentSection) {
    return <Navigate to="/cadastros/employees" replace />;
  }

  return (
    <CadastrosPageView
      section={currentSection}
      roles={employeesPage.state.roles}
      employees={employeesPage.state.employeesTable}
      canCreateEmployee={employeesPage.state.canCreateEmployee}
      isEditingRole={employeesPage.state.isEditingRole}
      isEditingEmployee={employeesPage.state.isEditingEmployee}
      roleForm={employeesPage.forms.roleForm}
      employeeForm={employeesPage.forms.employeeForm}
      onSubmitRole={employeesPage.actions.onSubmitRole}
      onSubmitEmployee={employeesPage.actions.onSubmitEmployee}
      onCancelRoleEdit={employeesPage.actions.resetRoleForm}
      onCancelEmployeeEdit={employeesPage.actions.resetEmployeeForm}
      onEditRole={employeesPage.actions.startEditRole}
      onDeleteRole={employeesPage.actions.deleteRole}
      onEditEmployee={employeesPage.actions.startEditEmployee}
      onDeleteEmployee={employeesPage.actions.deleteEmployee}
      onRestoreEmployeesDefaults={seedDefaults.actions.seedEmployeesDefaults}
      rules={rulesPage.state.orderedRules}
      hasRules={rulesPage.state.hasRules}
      editing={rulesPage.state.editing}
      onEnsureDefaultRules={rulesPage.actions.ensureDefaultRules}
      onResetToDefaults={rulesPage.actions.resetToDefaultRules}
      onRestoreRulesDefaults={seedDefaults.actions.seedRulesDefaults}
      onToggleRule={rulesPage.actions.onToggleRule}
      onStartEditParams={rulesPage.actions.startEditParams}
      onCancelEditParams={rulesPage.actions.cancelEditParams}
      onChangeParamsDraft={rulesPage.actions.changeParamsDraft}
      onSaveParams={rulesPage.actions.saveParams}
    />
  );
}
