import { useState } from "react";
import type { DateISO, EmployeeId } from "../../domain/types/ids";
import type { ValidationResult } from "../../domain/types/validation";

import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
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
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

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

type ChangeLogRow = {
  id: string;
  atLabel: string;
  message: string;
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
  changeLogRows: ChangeLogRow[];

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
  const [conflictsSide, setConflictsSide] = useState<"right" | "left">("right");
  const [highlightedCellKey, setHighlightedCellKey] = useState<string | null>(null);
  const [activeConflictId, setActiveConflictId] = useState<string | null>(null);

  const hardConflicts = props.validation.conflicts.filter((c) => c.severity === "HARD");
  const softConflicts = props.validation.conflicts.filter((c) => c.severity === "SOFT");
  const employeeNameById = Object.fromEntries(
    props.employeeRows.map((employee) => [employee.id, employee.name]),
  );

  function focusConflict(conflict: ValidationResult["conflicts"][number]) {
    const employeeId = conflict.employeeIds[0];
    if (!employeeId) return;

    const cellId = `schedule-cell-${employeeId}-${conflict.dateISO}`;
    const rowId = `schedule-row-${employeeId}`;
    const target =
      document.getElementById(cellId) ?? document.getElementById(rowId);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    setHighlightedCellKey(`${employeeId}_${conflict.dateISO}`);
    setActiveConflictId(conflict.id);

    window.setTimeout(() => {
      setHighlightedCellKey((prev) =>
        prev === `${employeeId}_${conflict.dateISO}` ? null : prev,
      );
      setActiveConflictId((prev) => (prev === conflict.id ? null : prev));
    }, 2200);
  }

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
          Cadastre colaboradores no passo Employees para começar a montar a escala.
        </Alert>
      )}

      {props.hasEmployees && (
        <Alert severity="info">
          Você pode gerar uma sugestão automática baseada nas regras ativas e ajustar
          manualmente os casos restantes.
        </Alert>
      )}

      {hardConflicts.length > 0 && (
        <Alert severity="error">
          Existem conflitos HARD que precisam ser corrigidos antes da exportação.
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
        <Button variant="outlined" onClick={props.onUndo} disabled={!props.canUndo}>
          Undo
        </Button>
        <Button variant="outlined" onClick={props.onRedo} disabled={!props.canRedo}>
          Redo
        </Button>
        <Button
          variant="outlined"
          onClick={props.onMarkAllAsWork}
          disabled={!props.hasEmployees}
        >
          Marcar tudo como Trabalho
        </Button>
        <Button variant="outlined" color="error" onClick={props.onResetSchedule}>
          Limpar escala
        </Button>
      </Stack>

      {props.validation.conflicts.length > 0 && (
        <Box
          sx={{
            position: { xs: "static", md: "fixed" },
            top: { md: 82 },
            right: { md: conflictsSide === "right" ? 16 : "auto" },
            left: { md: conflictsSide === "left" ? 16 : "auto" },
            width: { xs: "100%", md: 420 },
            maxWidth: { xs: "100%", md: "calc(100vw - 24px)" },
            zIndex: { md: 2000 },
            transition: "all 220ms ease",
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              boxShadow: { md: 6 },
              maxHeight: { md: "70vh" },
              overflowY: "auto",
              bgcolor: "background.paper",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle1">Conflitos detectados em tempo real</Typography>
              <Tooltip title="Alternar painel entre esquerda e direita">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() =>
                    setConflictsSide((prev) => (prev === "right" ? "left" : "right"))
                  }
                  aria-label="Alternar posição do painel de conflitos"
                >
                  <SwapHorizIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>

            <Stack spacing={1}>
              {props.validation.conflicts.slice(0, 12).map((conflict) => (
                <Alert
                  key={conflict.id}
                  severity={conflict.severity === "HARD" ? "error" : "warning"}
                >
                  <Stack spacing={0.75}>
                    <Typography variant="body2">
                      <strong>{conflict.dateISO}</strong> — {conflict.message}
                    </Typography>
                    {conflict.employeeIds.length > 0 && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          Colaborador:{" "}
                          {employeeNameById[conflict.employeeIds[0]] ?? conflict.employeeIds[0]}
                          {conflict.employeeIds.length > 1
                            ? ` (+${conflict.employeeIds.length - 1})`
                            : ""}
                        </Typography>
                        <Button
                          size="small"
                          variant={activeConflictId === conflict.id ? "contained" : "text"}
                          onClick={() => focusConflict(conflict)}
                        >
                          Ir ao erro
                        </Button>
                      </Stack>
                    )}
                  </Stack>
                </Alert>
              ))}

              {props.validation.conflicts.length > 12 && (
                <Typography variant="caption" color="text.secondary">
                  Mostrando 12 de {props.validation.conflicts.length} conflitos.
                </Typography>
              )}
            </Stack>
          </Paper>
        </Box>
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
              <TableCell align="center">Total Folga</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {props.employeeRows.map((employee) => (
              <TableRow key={employee.id} id={`schedule-row-${employee.id}`} hover>
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
                      id={`schedule-cell-${employee.id}-${day.dateISO}`}
                      align="center"
                    >
                      <Tooltip title="Clique para alternar Folga/Trabalho">
                        <Button
                          size="small"
                          variant={isOff ? "contained" : "outlined"}
                          color={isOff ? "warning" : "primary"}
                          onClick={() => props.onToggleOff(employee.id, day.dateISO)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            props.onSetStatus(employee.id, day.dateISO, "WORK");
                          }}
                          sx={{
                            width: 92,
                            minWidth: 92,
                            maxWidth: 92,
                            height: 32,
                            px: 0.75,
                            ...(highlightedCellKey === `${employee.id}_${day.dateISO}` && {
                              boxShadow: (theme) => `0 0 0 2px ${theme.palette.warning.main}`,
                              animation: "schedulePulse 0.7s ease-in-out 3",
                              "@keyframes schedulePulse": {
                                "0%": { transform: "scale(1)" },
                                "50%": { transform: "scale(1.06)" },
                                "100%": { transform: "scale(1)" },
                              },
                            }),
                          }}
                        >
                          {isOff ? "Folga" : "Trabalho"}
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

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Histórico de alterações
        </Typography>

        {props.changeLogRows.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Ainda não há alterações registradas.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {props.changeLogRows.slice(0, 20).map((entry) => (
              <Box key={entry.id}>
                <Typography variant="caption" color="text.secondary">
                  {entry.atLabel}
                </Typography>
                <Typography variant="body2">{entry.message}</Typography>
              </Box>
            ))}

            {props.changeLogRows.length > 20 && (
              <Typography variant="caption" color="text.secondary">
                Mostrando 20 de {props.changeLogRows.length} alterações.
              </Typography>
            )}
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}
