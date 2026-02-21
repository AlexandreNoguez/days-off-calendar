import { useState } from "react";

import { useEmployeesPage } from "../employees/useEmployeesPage";
import { useRulesPage } from "../rules/useRulesPage";
import { useSeedDefaults } from "../wizard/useSeedDefaults";

import {
  CadastrosPageView,
  type CadastrosTab,
} from "./CadastrosPage.view";

export function CadastrosPageContainer() {
  const [tab, setTab] = useState<CadastrosTab>("employees");

  const employeesPage = useEmployeesPage();
  const rulesPage = useRulesPage();
  const seedDefaults = useSeedDefaults();

  return (
    <CadastrosPageView
      tab={tab}
      onTabChange={setTab}
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
      formEditing={rulesPage.state.formEditing}
      formReadyRulesCount={rulesPage.state.formReadyRulesCount}
      formRegistry={rulesPage.state.ruleFormRegistry}
      isCreateDialogOpen={rulesPage.state.isCreateDialogOpen}
      createStep={rulesPage.state.createStep}
      createError={rulesPage.state.createError}
      createRuleDraft={rulesPage.state.createRuleDraft}
      onEnsureDefaultRules={rulesPage.actions.ensureDefaultRules}
      onResetToDefaults={rulesPage.actions.resetToDefaultRules}
      onRestoreRulesDefaults={seedDefaults.actions.seedRulesDefaults}
      onToggleRule={rulesPage.actions.onToggleRule}
      onStartEditParams={rulesPage.actions.startEditParams}
      onCancelEditParams={rulesPage.actions.cancelEditParams}
      onChangeParamsDraft={rulesPage.actions.changeParamsDraft}
      onSaveParams={rulesPage.actions.saveParams}
      onStartFormEdit={rulesPage.actions.startFormEdit}
      onCancelFormEdit={rulesPage.actions.cancelFormEdit}
      onUpdateFormField={rulesPage.actions.updateFormField}
      onSaveFormEdit={rulesPage.actions.saveFormEdit}
      onOpenCreateRuleDialog={rulesPage.actions.openCreateRuleDialog}
      onCloseCreateRuleDialog={rulesPage.actions.closeCreateRuleDialog}
      onChangeCreateStep={rulesPage.actions.changeCreateStep}
      onUpdateCreateRuleDraft={rulesPage.actions.updateCreateRuleDraft}
      onCreateCustomRule={rulesPage.actions.createCustomRule}
    />
  );
}
