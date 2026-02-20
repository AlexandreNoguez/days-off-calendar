import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Employee, Role } from "../domain/types/employees";
import type { EmployeeId, RoleId } from "../domain/types/ids";
import { STORAGE_KEYS } from "./persistence";

type EmployeesState = {
  roles: Role[];
  employees: Employee[];
  schemaVersion: number;

  actions: {
    createRole: (name: string) => RoleId;
    updateRole: (roleId: RoleId, patch: Partial<Role>) => void;
    deleteRole: (roleId: RoleId) => void;

    createEmployee: (payload: Omit<Employee, "id">) => EmployeeId;
    updateEmployee: (id: EmployeeId, patch: Partial<Employee>) => void;
    deleteEmployee: (id: EmployeeId) => void;

    resetEmployees: () => void;

    // seeds
    setRoles: (roles: Role[]) => void;
    setEmployees: (employees: Employee[]) => void;
    seedDefaults: (input: { roles: Role[]; employees: Employee[] }) => void;
  };
};

function id(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export const useEmployeesStore = create<EmployeesState>()(
  persist(
    (set, get) => ({
      roles: [],
      employees: [],
      schemaVersion: 1,

      actions: {
        createRole: (name) => {
          const newRole: Role = { id: id("role"), name };
          set({ roles: [...get().roles, newRole] });
          return newRole.id;
        },

        updateRole: (roleId, patch) => {
          set({
            roles: get().roles.map((r) =>
              r.id === roleId ? { ...r, ...patch } : r,
            ),
          });
        },

        deleteRole: (roleId) => {
          set({
            roles: get().roles.filter((r) => r.id !== roleId),
            employees: get().employees.filter((e) => e.roleId !== roleId),
          });
        },

        createEmployee: (payload) => {
          const newEmployee: Employee = { id: id("emp"), ...payload };
          set({ employees: [...get().employees, newEmployee] });
          return newEmployee.id;
        },

        updateEmployee: (idEmployee, patch) => {
          set({
            employees: get().employees.map((e) =>
              e.id === idEmployee ? { ...e, ...patch } : e,
            ),
          });
        },

        deleteEmployee: (idEmployee) => {
          set({
            employees: get().employees.filter((e) => e.id !== idEmployee),
          });
        },

        resetEmployees: () => set({ roles: [], employees: [] }),

        // seeds
        setRoles: (roles) => set({ roles }),

        setEmployees: (employees) => set({ employees }),

        seedDefaults: (input: { roles: Role[]; employees: Employee[] }) => {
          set({ roles: input.roles, employees: input.employees });
        },
      },
    }),
    {
      name: STORAGE_KEYS.employees,
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        roles: state.roles,
        employees: state.employees,
      }),
    },
  ),
);
