import { EmployeesPageView } from "./EmployeesPage.view";
import { useEmployeesPage } from "./useEmployeesPage";

export function EmployeesPageContainer() {
  const employeesPage = useEmployeesPage();

  return (
    <EmployeesPageView
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
    />
  );
}
