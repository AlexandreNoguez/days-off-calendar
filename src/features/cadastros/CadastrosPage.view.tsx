import { Box, Typography } from "@mui/material";
import type { UseFormReturn } from "react-hook-form";

import { EmployeesPageView } from "../employees/EmployeesPage.view";
import type { Employee, Role } from "../../domain/types/employees";
import type { EmployeeId, RoleId, RuleId } from "../../domain/types/ids";
import type { EmployeeFormValues, RoleFormValues } from "../employees/employeeForm";

import { RulesPageView } from "../rules/RulesPage.view";
import type { RuleConfig } from "../../domain/types/rules";

type EmployeeRow = Employee & { roleName: string };

type JsonEditState = {
  text: string;
  error?: string;
};

export type CadastrosSection = "employees" | "roles" | "rules";

type Props = {
  section: CadastrosSection;

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
  onEnsureDefaultRules: () => void;
  onResetToDefaults: () => void;
  onRestoreRulesDefaults: () => void;
  onToggleRule: (ruleId: RuleId, enabled: boolean) => void;
  onStartEditParams: (ruleId: RuleId) => void;
  onCancelEditParams: (ruleId: RuleId) => void;
  onChangeParamsDraft: (ruleId: RuleId, text: string) => void;
  onSaveParams: (ruleId: RuleId) => void;
};

export function CadastrosPageView(props: Props) {
  if (props.section === "employees") {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Employee registrations
        </Typography>

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
      </Box>
    );
  }

  if (props.section === "roles") {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Role registrations
        </Typography>

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
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Rules registrations
      </Typography>

      <RulesPageView
        rules={props.rules}
        hasRules={props.hasRules}
        editing={props.editing}
        onEnsureDefaultRules={props.onEnsureDefaultRules}
        onResetToDefaults={props.onResetToDefaults}
        onRestoreRulesDefaults={props.onRestoreRulesDefaults}
        onToggleRule={props.onToggleRule}
        onStartEditParams={props.onStartEditParams}
        onCancelEditParams={props.onCancelEditParams}
        onChangeParamsDraft={props.onChangeParamsDraft}
        onSaveParams={props.onSaveParams}
      />
    </Box>
  );
}
