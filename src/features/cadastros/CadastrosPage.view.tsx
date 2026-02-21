import { Box, Typography, Tab, Tabs } from "@mui/material";
import type { UseFormReturn } from "react-hook-form";

import { EmployeesPageView } from "../employees/EmployeesPage.view";
import type { Employee, Role } from "../../domain/types/employees";
import type { EmployeeId, RoleId, RuleId } from "../../domain/types/ids";
import type {
  EmployeeFormValues,
  RoleFormValues,
} from "../employees/employeeForm";

import { RulesPageView } from "../rules/RulesPage.view";
import type { RuleConfig } from "../../domain/types/rules";
import type { RuleFormSchema } from "../rules/ruleFormRegistry";

type EmployeeRow = Employee & { roleName: string };

type JsonEditState = {
  text: string;
  error?: string;
};

export type CadastrosTab = "employees" | "roles" | "rules";

type Props = {
  tab: CadastrosTab;
  onTabChange: (tab: CadastrosTab) => void;

  roles: Role[];
  employees: EmployeeRow[];
  canCreateEmployee: boolean;
  isEditingRole: boolean;
  isEditingEmployee: boolean;
  roleForm: UseFormReturn<RoleFormValues>;
  employeeForm: UseFormReturn<EmployeeFormValues>;
  onSubmitRole: () => void;
  onSubmitEmployee: () => void;
  onCancelRoleEdit: () => void;
  onCancelEmployeeEdit: () => void;
  onEditRole: (roleId: RoleId) => void;
  onDeleteRole: (roleId: RoleId) => void;
  onEditEmployee: (employeeId: EmployeeId) => void;
  onDeleteEmployee: (employeeId: EmployeeId) => void;
  onRestoreEmployeesDefaults: () => void;

  rules: RuleConfig[];
  hasRules: boolean;
  editing: Record<RuleId, JsonEditState>;
  formEditing: Record<RuleId, { params: Record<string, unknown> }>;
  formReadyRulesCount: number;
  formRegistry: Partial<Record<RuleConfig["key"], RuleFormSchema>>;
  onEnsureDefaultRules: () => void;
  onResetToDefaults: () => void;
  onRestoreRulesDefaults: () => void;
  onToggleRule: (ruleId: RuleId, enabled: boolean) => void;
  onStartEditParams: (ruleId: RuleId) => void;
  onCancelEditParams: (ruleId: RuleId) => void;
  onChangeParamsDraft: (ruleId: RuleId, text: string) => void;
  onSaveParams: (ruleId: RuleId) => void;
  onStartFormEdit: (ruleId: RuleId) => void;
  onCancelFormEdit: (ruleId: RuleId) => void;
  onUpdateFormField: (ruleId: RuleId, field: string, value: unknown) => void;
  onSaveFormEdit: (ruleId: RuleId) => void;
};
export function CadastrosPageView(props: Props) {
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Cadastros
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Manage employees, roles, and rules in a single page with tabs.
      </Typography>

      <Tabs
        value={props.tab}
        onChange={(_, value: CadastrosTab) => props.onTabChange(value)}
        variant="scrollable"
        allowScrollButtonsMobile
        aria-label="cadastros tabs"
        sx={{ mb: 2 }}
      >
        <Tab value="employees" label="Colaboradores" />
        <Tab value="roles" label="Cargos" />
        <Tab value="rules" label="Rules" />
      </Tabs>

      {props.tab === "employees" && (
        <EmployeesPageView
          roles={props.roles}
          employees={props.employees}
          canCreateEmployee={props.canCreateEmployee}
          isEditingRole={false}
          isEditingEmployee={props.isEditingEmployee}
          roleForm={props.roleForm}
          employeeForm={props.employeeForm}
          onSubmitRole={props.onSubmitRole}
          onSubmitEmployee={props.onSubmitEmployee}
          onCancelRoleEdit={props.onCancelRoleEdit}
          onCancelEmployeeEdit={props.onCancelEmployeeEdit}
          onEditRole={props.onEditRole}
          onDeleteRole={props.onDeleteRole}
          onEditEmployee={props.onEditEmployee}
          onDeleteEmployee={props.onDeleteEmployee}
          onRestoreEmployeesDefaults={props.onRestoreEmployeesDefaults}
          visibleSections={["employees"]}
        />
      )}

      {props.tab === "roles" && (
        <EmployeesPageView
          roles={props.roles}
          employees={props.employees}
          canCreateEmployee={props.canCreateEmployee}
          isEditingRole={props.isEditingRole}
          isEditingEmployee={false}
          roleForm={props.roleForm}
          employeeForm={props.employeeForm}
          onSubmitRole={props.onSubmitRole}
          onSubmitEmployee={props.onSubmitEmployee}
          onCancelRoleEdit={props.onCancelRoleEdit}
          onCancelEmployeeEdit={props.onCancelEmployeeEdit}
          onEditRole={props.onEditRole}
          onDeleteRole={props.onDeleteRole}
          onEditEmployee={props.onEditEmployee}
          onDeleteEmployee={props.onDeleteEmployee}
          onRestoreEmployeesDefaults={props.onRestoreEmployeesDefaults}
          visibleSections={["roles"]}
        />
      )}

      {props.tab === "rules" && (
        <RulesPageView
          rules={props.rules}
          hasRules={props.hasRules}
          editing={props.editing}
          formEditing={props.formEditing}
          formReadyRulesCount={props.formReadyRulesCount}
          formRegistry={props.formRegistry}
          roles={props.roles}
          employees={props.employees}
          onEnsureDefaultRules={props.onEnsureDefaultRules}
          onResetToDefaults={props.onResetToDefaults}
          onRestoreRulesDefaults={props.onRestoreRulesDefaults}
          onToggleRule={props.onToggleRule}
          onStartEditParams={props.onStartEditParams}
          onCancelEditParams={props.onCancelEditParams}
          onChangeParamsDraft={props.onChangeParamsDraft}
          onSaveParams={props.onSaveParams}
          onStartFormEdit={props.onStartFormEdit}
          onCancelFormEdit={props.onCancelFormEdit}
          onUpdateFormField={props.onUpdateFormField}
          onSaveFormEdit={props.onSaveFormEdit}
        />
      )}
    </Box>
  );
}
