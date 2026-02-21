import type { UseFormReturn } from "react-hook-form";
import type { Employee, Role } from "../../domain/types/employees";
import type { EmployeeId, RoleId } from "../../domain/types/ids";
import type { EmployeeFormValues, RoleFormValues } from "./employeeForm";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

type EmployeeRow = Employee & { roleName: string };

type Props = {
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
};

export function EmployeesPageView(props: Props) {
  const {
    register: registerRole,
    formState: { errors: roleErrors },
  } = props.roleForm;

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = props.employeeForm;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5">Cadastro de pessoas</Typography>
        <Typography variant="body2" color="text.secondary">
          Cadastre cargos e colaboradores, incluindo a regra de folga fixa aos
          domingos.
        </Typography>
      </Box>

      <Box>
        <Button variant="outlined" onClick={props.onRestoreEmployeesDefaults}>
          Restaurar defaults de Employees
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Cargos
        </Typography>

        <Stack
          component="form"
          direction={{ xs: "column", md: "row" }}
          gap={1}
          onSubmit={(e) => {
            e.preventDefault();
            props.onSubmitRole();
          }}
        >
          <TextField
            label="Nome do cargo"
            fullWidth
            {...registerRole("name")}
            error={Boolean(roleErrors.name)}
            helperText={roleErrors.name?.message}
          />

          <Stack direction="row" spacing={1}>
            <Button type="submit" variant="contained">
              {props.isEditingRole ? "Salvar cargo" : "Adicionar cargo"}
            </Button>
            {props.isEditingRole && (
              <Button variant="outlined" onClick={props.onCancelRoleEdit}>
                Cancelar
              </Button>
            )}
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" mt={2}>
          {props.roles.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Nenhum cargo cadastrado.
            </Typography>
          )}

          {props.roles.map((role) => (
            <Paper key={role.id} variant="outlined" sx={{ px: 1.5, py: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2">{role.name}</Typography>
                <Button size="small" onClick={() => props.onEditRole(role.id)}>
                  Editar
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={() => props.onDeleteRole(role.id)}
                >
                  Excluir
                </Button>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Colaboradores
        </Typography>

        {!props.canCreateEmployee && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Cadastre pelo menos um cargo antes de adicionar colaboradores.
          </Alert>
        )}

        <Stack
          component="form"
          spacing={2}
          onSubmit={(e) => {
            e.preventDefault();
            props.onSubmitEmployee();
          }}
        >
          <TextField
            label="Nome"
            fullWidth
            {...register("name")}
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
            disabled={!props.canCreateEmployee}
          />

          <FormControl fullWidth error={Boolean(errors.roleId)}>
            <InputLabel id="role-select-label">Cargo</InputLabel>
            <Select
              labelId="role-select-label"
              label="Cargo"
              value={watch("roleId") || ""}
              onChange={(e) => setValue("roleId", String(e.target.value))}
              disabled={!props.canCreateEmployee}
            >
              {props.roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name}
                </MenuItem>
              ))}
            </Select>
            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
              {errors.roleId?.message}
            </Typography>
          </FormControl>

          <TextField
            label="Observações"
            fullWidth
            multiline
            minRows={2}
            {...register("notes")}
            error={Boolean(errors.notes)}
            helperText={errors.notes?.message}
            disabled={!props.canCreateEmployee}
          />

          <FormControlLabel
            label="Sempre folga no domingo"
            control={
              <Checkbox
                checked={Boolean(watch("alwaysOffSunday"))}
                onChange={(e) =>
                  setValue("alwaysOffSunday", e.target.checked, {
                    shouldDirty: true,
                  })
                }
                disabled={!props.canCreateEmployee}
              />
            }
          />

          <Stack direction="row" spacing={1}>
            <Button type="submit" variant="contained" disabled={!props.canCreateEmployee}>
              {props.isEditingEmployee ? "Salvar colaborador" : "Adicionar colaborador"}
            </Button>
            {props.isEditingEmployee && (
              <Button variant="outlined" onClick={props.onCancelEmployeeEdit}>
                Cancelar
              </Button>
            )}
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Cargo</TableCell>
              <TableCell>Domingo fixo</TableCell>
              <TableCell>Observações</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {props.employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>{employee.name}</TableCell>
                <TableCell>{employee.roleName}</TableCell>
                <TableCell>{employee.alwaysOffSunday ? "Sim" : "Não"}</TableCell>
                <TableCell>{employee.notes ?? "—"}</TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    onClick={() => props.onEditEmployee(employee.id)}
                  >
                    Editar
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => props.onDeleteEmployee(employee.id)}
                  >
                    Excluir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {props.employees.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" color="text.secondary">
                    Nenhum colaborador cadastrado.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}
