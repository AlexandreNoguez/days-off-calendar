import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import type { EmployeeId, RoleId } from "../../domain/types/ids";
import { useEmployeesStore } from "../../stores/employees.store";
import { usePlanStore } from "../../stores/plan.store";
import {
  employeeFormSchema,
  roleFormSchema,
  type EmployeeFormValues,
  type RoleFormValues,
} from "./employeeForm";

export function useEmployeesPage() {
  const year = usePlanStore((s) => s.year);

  const roles = useEmployeesStore((s) => s.roles);
  const employees = useEmployeesStore((s) => s.employees);

  const createRole = useEmployeesStore((s) => s.actions.createRole);
  const updateRole = useEmployeesStore((s) => s.actions.updateRole);
  const deleteRole = useEmployeesStore((s) => s.actions.deleteRole);

  const createEmployee = useEmployeesStore((s) => s.actions.createEmployee);
  const updateEmployee = useEmployeesStore((s) => s.actions.updateEmployee);
  const deleteEmployee = useEmployeesStore((s) => s.actions.deleteEmployee);

  const [editingRoleId, setEditingRoleId] = useState<RoleId | null>(null);
  const [editingEmployeeId, setEditingEmployeeId] = useState<EmployeeId | null>(
    null,
  );

  const roleForm = useForm<RoleFormValues>({ defaultValues: { name: "" } });

  const employeeForm = useForm<EmployeeFormValues>({
    defaultValues: {
      name: "",
      roleId: roles[0]?.id ?? "",
      alwaysOffSunday: false,
      notes: "",
    },
  });

  const employeesTable = useMemo(
    () =>
      employees.map((employee) => ({
        ...employee,
        roleName: roles.find((r) => r.id === employee.roleId)?.name ?? "—",
      })),
    [employees, roles],
  );

  function resetRoleForm() {
    setEditingRoleId(null);
    roleForm.reset({ name: "" });
  }

  function resetEmployeeForm() {
    setEditingEmployeeId(null);
    employeeForm.reset({
      name: "",
      roleId: roles[0]?.id ?? "",
      alwaysOffSunday: false,
      notes: "",
    });
  }

  const onSubmitRole = roleForm.handleSubmit((values) => {
    const parsed = roleFormSchema.safeParse(values);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      if (issue) roleForm.setError("name", { message: issue.message });
      return;
    }

    if (editingRoleId) updateRole(editingRoleId, { name: parsed.data.name });
    else createRole(parsed.data.name);

    resetRoleForm();
  });

  const onSubmitEmployee = employeeForm.handleSubmit((values) => {
    const parsed = employeeFormSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field && typeof field === "string") {
          employeeForm.setError(field as keyof EmployeeFormValues, {
            message: issue.message,
          });
        }
      }
      return;
    }

    const payload = {
      name: parsed.data.name,
      roleId: parsed.data.roleId as RoleId,
      alwaysOffSunday: parsed.data.alwaysOffSunday,
      notes: parsed.data.notes?.trim() ? parsed.data.notes.trim() : undefined,
      holidayCreditYear: year,
      holidayOffUsed: false,
    };

    if (editingEmployeeId) updateEmployee(editingEmployeeId, payload);
    else createEmployee(payload);

    resetEmployeeForm();
  });

  function startEditRole(roleId: RoleId) {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;

    setEditingRoleId(roleId);
    roleForm.reset({ name: role.name });
  }

  function startEditEmployee(employeeId: EmployeeId) {
    const employee = employees.find((e) => e.id === employeeId);
    if (!employee) return;

    setEditingEmployeeId(employeeId);
    employeeForm.reset({
      name: employee.name,
      roleId: employee.roleId,
      alwaysOffSunday: employee.alwaysOffSunday,
      notes: employee.notes ?? "",
    });
  }

  return {
    state: {
      roles,
      employeesTable,
      canCreateEmployee: roles.length > 0,
      isEditingRole: Boolean(editingRoleId),
      isEditingEmployee: Boolean(editingEmployeeId),
    },
    forms: {
      roleForm,
      employeeForm,
    },
    actions: {
      onSubmitRole,
      onSubmitEmployee,
      resetRoleForm,
      resetEmployeeForm,
      startEditRole,
      startEditEmployee,
      deleteRole,
      deleteEmployee,
    },
  };
}
