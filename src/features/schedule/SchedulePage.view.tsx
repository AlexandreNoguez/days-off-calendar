import type { DateISO, EmployeeId } from "../../domain/types/ids";
import type { ValidationResult } from "../../domain/types/validation";

import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";

type DayColumn = {
  dateISO: DateISO;
  day: number;
  weekday: number;
  weekdayLabel: string;
};

type EmployeeRow = {
  id: EmployeeId;
  name: string;
  roleName: string;
  offCount: number;
};

type Props = {
  year: number;
  month: number;
  hasEmployees: boolean;
  hasRules: boolean;
  dayColumns: DayColumn[];
  employeeRows: EmployeeRow[];
  canUndo: boolean;
  canRedo: boolean;
  validation: ValidationResult;

  getCellStatus: (employeeId: EmployeeId, dateISO: DateISO) => "WORK" | "OFF";
  onSetStatus: (
    employeeId: EmployeeId,
    dateISO: DateISO,
    status: "WORK" | "OFF",
  ) => void;
  onToggleOff: (employeeId: EmployeeId, dateISO: DateISO) => void;
  onMarkAllAsWork: () => void;
  onGenerateSuggestion: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onResetSchedule: () => void;
};

function monthLabel(month: number): string {
  return String(month).padStart(2, "0");
}

export function SchedulePageView(props: Props) {
  const hardConflicts = props.validation.conflicts.filter(
    (c) => c.severity === "HARD",
  );
  const softConflicts = props.validation.conflicts.filter(
    (c) => c.severity === "SOFT",
  );

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h5">Editor da escala</Typography>
        <Typography variant="body2" color="text.secondary">
          Monte as folgas por colaborador e dia, com ações rápidas e histórico.
        </Typography>
      </Box>

      <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
        <Chip label={`Período: ${monthLabel(props.month)}/${props.year}`} />
        <Chip label={`Colaboradores: ${props.employeeRows.length}`} />
        <Chip
          label={`Conflitos HARD: ${hardConflicts.length}`}
          color={hardConflicts.length > 0 ? "error" : "success"}
        />
        <Chip
          label={`Conflitos SOFT: ${softConflicts.length}`}
          color={softConflicts.length > 0 ? "warning" : "default"}
        />
      </Stack>

      {!props.hasEmployees && (
        <Alert severity="info">
          Cadastre colaboradores no passo Employees para começar a montar a
          escala.
        </Alert>
      )}

      {props.hasEmployees && (
        <Alert severity="info">
          Você pode gerar uma sugestão automática baseada nas regras ativas e
          ajustar manualmente os casos restantes.
        </Alert>
      )}

      {hardConflicts.length > 0 && (
        <Alert severity="error">
          Existem conflitos HARD que precisam ser corrigidos antes da
          exportação.
        </Alert>
      )}

      <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
        <Button
          variant="contained"
          onClick={props.onGenerateSuggestion}
          disabled={!props.hasEmployees || !props.hasRules}
        >
          Gerar sugestão automática
        </Button>
        <Button
          variant="outlined"
          onClick={props.onUndo}
          disabled={!props.canUndo}
        >
          Undo
        </Button>
        <Button
          variant="outlined"
          onClick={props.onRedo}
          disabled={!props.canRedo}
        >
          Redo
        </Button>
        <Button
          variant="outlined"
          onClick={props.onMarkAllAsWork}
          disabled={!props.hasEmployees}
        >
          Marcar tudo como WORK
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={props.onResetSchedule}
        >
          Limpar escala
        </Button>
      </Stack>

      {props.validation.conflicts.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Conflitos detectados em tempo real
          </Typography>

          <Stack spacing={1}>
            {props.validation.conflicts.slice(0, 12).map((conflict) => (
              <Alert
                key={conflict.id}
                severity={conflict.severity === "HARD" ? "error" : "warning"}
              >
                <strong>{conflict.dateISO}</strong> — {conflict.message}
              </Alert>
            ))}

            {props.validation.conflicts.length > 12 && (
              <Typography variant="caption" color="text.secondary">
                Mostrando 12 de {props.validation.conflicts.length} conflitos.
              </Typography>
            )}
          </Stack>
        </Paper>
      )}

      <Paper variant="outlined" sx={{ overflow: "auto" }}>
        <Table size="small" sx={{ minWidth: 1100 }}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  position: "sticky",
                  left: 0,
                  bgcolor: "background.paper",
                  zIndex: 2,
                }}
              >
                Colaborador
              </TableCell>
              {props.dayColumns.map((day) => (
                <TableCell key={day.dateISO} align="center">
                  <Stack spacing={0.25} alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      {day.weekdayLabel}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {day.day}
                    </Typography>
                  </Stack>
                </TableCell>
              ))}
              <TableCell align="center">Total OFF</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {props.employeeRows.map((employee) => (
              <TableRow key={employee.id} hover>
                <TableCell
                  sx={{
                    position: "sticky",
                    left: 0,
                    bgcolor: "background.paper",
                    zIndex: 1,
                  }}
                >
                  <Stack>
                    <Typography variant="body2" fontWeight={600}>
                      {employee.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {employee.roleName}
                    </Typography>
                  </Stack>
                </TableCell>

                {props.dayColumns.map((day) => {
                  const status = props.getCellStatus(employee.id, day.dateISO);
                  const isOff = status === "OFF";

                  return (
                    <TableCell
                      key={`${employee.id}_${day.dateISO}`}
                      align="center"
                    >
                      <Tooltip title="Clique para alternar OFF/WORK">
                        <Button
                          size="small"
                          variant={isOff ? "contained" : "outlined"}
                          color={isOff ? "warning" : "primary"}
                          onClick={() =>
                            props.onToggleOff(employee.id, day.dateISO)
                          }
                          onContextMenu={(e) => {
                            e.preventDefault();
                            props.onSetStatus(employee.id, day.dateISO, "WORK");
                          }}
                          sx={{ minWidth: 52 }}
                        >
                          {status}
                        </Button>
                      </Tooltip>
                    </TableCell>
                  );
                })}

                <TableCell align="center">
                  <Chip
                    size="small"
                    label={employee.offCount}
                    color={employee.offCount > 0 ? "warning" : "default"}
                  />
                </TableCell>
              </TableRow>
            ))}

            {props.employeeRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={props.dayColumns.length + 2}>
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
