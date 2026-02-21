import { z } from "zod";

export const roleFormSchema = z.object({
  name: z.string().trim().min(2, "Informe um cargo com pelo menos 2 letras."),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;

export const employeeFormSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome com pelo menos 2 letras."),
  roleId: z.string().min(1, "Selecione um cargo."),
  alwaysOffSunday: z.boolean().default(false),
  notes: z.string().trim().max(300, "Máximo de 300 caracteres.").optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;
