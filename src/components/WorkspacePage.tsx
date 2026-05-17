"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import { toast } from "react-toastify";
import type { Employee, Role } from "../domain/types/employees";
import type { DateISO, EmployeeId, RoleId } from "../domain/types/ids";
import type { RuleConfig } from "../domain/types/rules";
import type {
  ScheduleAssignments,
  ScheduleChangeLogEntry,
} from "../domain/types/schedule";
import type { AppStateDto, AppStatePatch } from "../lib/types";
import { createDefaultRules } from "../domain/defaults/defaultRules";
import { getDaysOfMonth, WEEKDAY_LABELS_PT } from "../shared/utils/dates";
import { generateSuggestedSchedule } from "../application/usecases/schedule/generateSuggestedSchedule";
import { validateSchedule } from "../application/usecases/rules/validateSchedule";
import { buildWorkbook } from "../application/usecases/export/buildWorkbook";
import { downloadBytes } from "../shared/utils/download";

type Section = "setup" | "cadastros" | "schedule" | "export";
type CadastroTab = "employees" | "roles" | "rules";
type CustomRuleTemplate =
  | "pair_cannot_both_off"
  | "substitution_required"
  | "role_one_off_each_sunday";

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function createLog(input: {
  type: ScheduleChangeLogEntry["type"];
  message: string;
  changedCells: number;
  employeeId?: EmployeeId;
  dateISO?: DateISO;
  prevStatus?: "WORK" | "OFF";
  nextStatus?: "WORK" | "OFF";
}): ScheduleChangeLogEntry {
  return {
    id: newId("sched_log"),
    at: Date.now(),
    ...input,
  };
}

function statusOf(
  assignments: ScheduleAssignments,
  employeeId: EmployeeId,
  dateISO: DateISO,
): "WORK" | "OFF" {
  return assignments[employeeId]?.[dateISO] ?? "WORK";
}

function roleName(roles: Role[], roleId: RoleId): string {
  return roles.find((role) => role.id === roleId)?.name ?? roleId;
}

export function WorkspacePage({ section }: { section: Section }) {
  const [loadedState, setState] = useState<AppStateDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cadastroTab, setCadastroTab] = useState<CadastroTab>("employees");
  const [past, setPast] = useState<ScheduleAssignments[]>([]);
  const [future, setFuture] = useState<ScheduleAssignments[]>([]);

  const [roleDraft, setRoleDraft] = useState("");
  const [employeeDraft, setEmployeeDraft] = useState({
    name: "",
    roleId: "",
    alwaysOffSunday: false,
    notes: "",
  });
  const [ruleDraft, setRuleDraft] = useState<{
    template: CustomRuleTemplate;
    employeeAId: string;
    employeeBId: string;
    substituteId: string;
    substitutedIds: string[];
    roleId: string;
    sundayOffCount: number;
    severity: RuleConfig["severity"];
  }>({
    template: "pair_cannot_both_off",
    employeeAId: "",
    employeeBId: "",
    substituteId: "",
    substitutedIds: [],
    roleId: "",
    sundayOffCount: 1,
    severity: "HARD",
  });

  useEffect(() => {
    let active = true;
    fetch("/api/app-state")
      .then((response) => {
        if (!response.ok) throw new Error("Falha ao carregar dados.");
        return response.json() as Promise<AppStateDto>;
      })
      .then((data) => {
        if (!active) return;
        setState(data);
        setEmployeeDraft((prev) => ({
          ...prev,
          roleId: prev.roleId || data.roles[0]?.id || "",
        }));
      })
      .catch((error) => toast.error(error.message))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const days = useMemo(() => {
    if (!loadedState) return [];
    return getDaysOfMonth(loadedState.plan.year, loadedState.plan.month);
  }, [loadedState]);

  const validation = useMemo(() => {
    if (!loadedState) {
      return { conflicts: [], isValid: true, statsPerEmployee: {} };
    }

    return validateSchedule({
      employees: loadedState.employees,
      rules: loadedState.rules,
      assignments: loadedState.schedule.assignments,
      daysOfMonth: days.map((day) => day.dateISO),
      holidays: loadedState.holidays,
    });
  }, [loadedState, days]);

  async function savePatch(patch: AppStatePatch, successMessage?: string) {
    setSaving(true);
    const response = await fetch("/api/app-state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      toast.error(data?.error ?? "Nao foi possivel salvar.");
      return null;
    }

    const next = (await response.json()) as AppStateDto;
    setState(next);
    if (successMessage) toast.success(successMessage);
    return next;
  }

  if (loading) {
    return (
      <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
        <CircularProgress />
        <Typography color="text.secondary">Carregando dados da escala...</Typography>
      </Stack>
    );
  }

  if (!loadedState) {
    return <Alert severity="error">Nao foi possivel carregar os dados.</Alert>;
  }

  const state = loadedState;

  const hardConflicts = validation.conflicts.filter((conflict) => conflict.severity === "HARD");
  const softConflicts = validation.conflicts.filter((conflict) => conflict.severity === "SOFT");

  function saveSchedule(
    nextAssignments: ScheduleAssignments,
    log: ScheduleChangeLogEntry,
    auditAction: string,
    pushHistory = true,
  ) {
    if (!state) return;
    const nextLog = [...state.schedule.changeLog, log].slice(-300);
    if (pushHistory) {
      setPast((items) => [...items, state.schedule.assignments].slice(-50));
      setFuture([]);
    }
    void savePatch({
      schedule: {
        assignments: nextAssignments,
        changeLog: nextLog,
      },
      audit: {
        action: auditAction,
        entityType: "schedule",
        metadata: { changedCells: log.changedCells },
      },
    });
  }

  function renderHeader(title: string, description: string) {
    return (
      <Stack spacing={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip label={`Periodo: ${String(state.plan.month).padStart(2, "0")}/${state.plan.year}`} />
          <Chip label={`Colaboradores: ${state.employees.length}`} />
          <Chip
            label={`HARD: ${hardConflicts.length}`}
            color={hardConflicts.length > 0 ? "error" : "success"}
          />
          <Chip
            label={`SOFT: ${softConflicts.length}`}
            color={softConflicts.length > 0 ? "warning" : "default"}
          />
          {saving && <Chip label="Salvando..." color="primary" />}
        </Stack>
      </Stack>
    );
  }

  function renderSetup() {
    const firstWeekday = days[0]?.weekday ?? 0;
    const cells = [
      ...Array.from({ length: firstWeekday }).map((_, index) => ({
        kind: "blank" as const,
        key: `blank_${index}`,
      })),
      ...days.map((day) => ({ kind: "day" as const, key: day.dateISO, day })),
    ];

    return (
      <Stack spacing={2}>
        {renderHeader("Setup", "Escolha o mes/ano e marque os feriados do periodo.")}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Mes</InputLabel>
              <Select
                label="Mes"
                value={state.plan.month}
                onChange={(event) => {
                  void savePatch({
                    plan: { year: state.plan.year, month: Number(event.target.value) },
                    audit: { action: "plan.updated", entityType: "plan" },
                  });
                }}
              >
                {MONTHS.map((month, index) => (
                  <MenuItem key={month} value={index + 1}>
                    {month}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Ano"
              type="number"
              value={state.plan.year}
              onChange={(event) => {
                const year = Number(event.target.value);
                if (year >= 2020 && year <= 2100) {
                  void savePatch({
                    plan: { year, month: state.plan.month },
                    audit: { action: "plan.updated", entityType: "plan" },
                  });
                }
              }}
              fullWidth
            />
          </Stack>
        </Paper>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
          {WEEKDAY_LABELS_PT.map((label) => (
            <Typography key={label} variant="caption" color="text.secondary" sx={{ px: 1 }}>
              {label}
            </Typography>
          ))}
          {cells.map((cell) => {
            if (cell.kind === "blank") return <Box key={cell.key} sx={{ minHeight: 64 }} />;
            const isHoliday = Boolean(state.holidays[cell.day.dateISO]);
            return (
              <Button
                key={cell.key}
                variant={isHoliday ? "contained" : "outlined"}
                color={isHoliday ? "primary" : cell.day.weekday === 0 ? "warning" : "inherit"}
                onClick={() => {
                  const nextHolidays = { ...state.holidays };
                  if (nextHolidays[cell.day.dateISO]) delete nextHolidays[cell.day.dateISO];
                  else nextHolidays[cell.day.dateISO] = true;
                  void savePatch({
                    holidays: nextHolidays,
                    audit: {
                      action: "holiday.toggled",
                      entityType: "holiday",
                      entityId: cell.day.dateISO,
                      metadata: { enabled: !isHoliday },
                    },
                  });
                }}
                sx={{ minHeight: 64, justifyContent: "flex-start", alignItems: "flex-start" }}
              >
                <Stack alignItems="flex-start">
                  <Typography variant="subtitle2">{cell.day.day}</Typography>
                  <Typography variant="caption">
                    {isHoliday ? "Feriado" : WEEKDAY_LABELS_PT[cell.day.weekday]}
                  </Typography>
                </Stack>
              </Button>
            );
          })}
        </Box>
      </Stack>
    );
  }

  function renderCadastros() {
    return (
      <Stack spacing={2}>
        {renderHeader("Cadastros", "Gerencie colaboradores, cargos e regras da escala.")}
        <Tabs value={cadastroTab} onChange={(_, value: CadastroTab) => setCadastroTab(value)}>
          <Tab value="employees" label="Colaboradores" />
          <Tab value="roles" label="Cargos" />
          <Tab value="rules" label="Regras" />
        </Tabs>
        {cadastroTab === "employees" && renderEmployees()}
        {cadastroTab === "roles" && renderRoles()}
        {cadastroTab === "rules" && renderRules()}
      </Stack>
    );
  }

  function renderRoles() {
    return (
      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              label="Nome do cargo"
              value={roleDraft}
              onChange={(event) => setRoleDraft(event.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                const name = roleDraft.trim();
                if (!name) return;
                const roles = [...state.roles, { id: newId("role") as RoleId, name }];
                setRoleDraft("");
                void savePatch({
                  roles,
                  audit: { action: "role.created", entityType: "role", metadata: { name } },
                }, "Cargo criado.");
              }}
            >
              Criar
            </Button>
          </Stack>
        </Paper>
        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Cargo</TableCell>
                <TableCell align="right">Acoes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {state.roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>{role.name}</TableCell>
                  <TableCell align="right">
                    <Button
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => {
                        const roles = state.roles.filter((item) => item.id !== role.id);
                        const employees = state.employees.filter((item) => item.roleId !== role.id);
                        void savePatch({
                          roles,
                          employees,
                          audit: {
                            action: "role.deleted",
                            entityType: "role",
                            entityId: role.id,
                          },
                        }, "Cargo removido.");
                      }}
                    >
                      Remover
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Stack>
    );
  }

  function renderEmployees() {
    return (
      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              <TextField
                label="Nome"
                value={employeeDraft.name}
                onChange={(event) =>
                  setEmployeeDraft((prev) => ({ ...prev, name: event.target.value }))
                }
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Cargo</InputLabel>
                <Select
                  label="Cargo"
                  value={employeeDraft.roleId}
                  onChange={(event) =>
                    setEmployeeDraft((prev) => ({ ...prev, roleId: event.target.value }))
                  }
                >
                  {state.roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <TextField
              label="Observacoes"
              value={employeeDraft.notes}
              onChange={(event) =>
                setEmployeeDraft((prev) => ({ ...prev, notes: event.target.value }))
              }
              fullWidth
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={employeeDraft.alwaysOffSunday}
                    onChange={(event) =>
                      setEmployeeDraft((prev) => ({
                        ...prev,
                        alwaysOffSunday: event.target.checked,
                      }))
                    }
                  />
                }
                label="Sempre folga domingo"
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                disabled={!employeeDraft.name.trim() || !employeeDraft.roleId}
                onClick={() => {
                  const employee: Employee = {
                    id: newId("emp") as EmployeeId,
                    name: employeeDraft.name.trim(),
                    roleId: employeeDraft.roleId as RoleId,
                    alwaysOffSunday: employeeDraft.alwaysOffSunday,
                    holidayCreditYear: state.plan.year,
                    holidayOffUsed: false,
                    notes: employeeDraft.notes.trim() || undefined,
                  };
                  setEmployeeDraft({
                    name: "",
                    roleId: state.roles[0]?.id ?? "",
                    alwaysOffSunday: false,
                    notes: "",
                  });
                  void savePatch({
                    employees: [...state.employees, employee],
                    audit: {
                      action: "employee.created",
                      entityType: "employee",
                      entityId: employee.id,
                      metadata: { name: employee.name },
                    },
                  }, "Colaborador criado.");
                }}
              >
                Criar colaborador
              </Button>
            </Stack>
          </Stack>
        </Paper>
        <Paper variant="outlined" sx={{ overflow: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Cargo</TableCell>
                <TableCell>Domingo fixo</TableCell>
                <TableCell align="right">Acoes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {state.employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{roleName(state.roles, employee.roleId)}</TableCell>
                  <TableCell>{employee.alwaysOffSunday ? "Sim" : "Nao"}</TableCell>
                  <TableCell align="right">
                    <Button
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => {
                        void savePatch({
                          employees: state.employees.filter((item) => item.id !== employee.id),
                          audit: {
                            action: "employee.deleted",
                            entityType: "employee",
                            entityId: employee.id,
                          },
                        }, "Colaborador removido.");
                      }}
                    >
                      Remover
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Stack>
    );
  }

  function renderRules() {
    return (
      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              Nova regra personalizada
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              <FormControl fullWidth>
                <InputLabel>Template</InputLabel>
                <Select
                  label="Template"
                  value={ruleDraft.template}
                  onChange={(event) =>
                    setRuleDraft((prev) => ({
                      ...prev,
                      template: event.target.value as CustomRuleTemplate,
                    }))
                  }
                >
                  <MenuItem value="pair_cannot_both_off">Par nao folga junto</MenuItem>
                  <MenuItem value="substitution_required">Substituicao obrigatoria</MenuItem>
                  <MenuItem value="role_one_off_each_sunday">Folgas por cargo no domingo</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Severidade</InputLabel>
                <Select
                  label="Severidade"
                  value={ruleDraft.severity}
                  onChange={(event) =>
                    setRuleDraft((prev) => ({
                      ...prev,
                      severity: event.target.value as RuleConfig["severity"],
                    }))
                  }
                >
                  <MenuItem value="HARD">HARD</MenuItem>
                  <MenuItem value="SOFT">SOFT</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            {ruleDraft.template === "pair_cannot_both_off" && (
              <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                {["employeeAId", "employeeBId"].map((field, index) => (
                  <FormControl key={field} fullWidth>
                    <InputLabel>{index === 0 ? "Colaborador A" : "Colaborador B"}</InputLabel>
                    <Select
                      label={index === 0 ? "Colaborador A" : "Colaborador B"}
                      value={ruleDraft[field as "employeeAId" | "employeeBId"]}
                      onChange={(event) =>
                        setRuleDraft((prev) => ({
                          ...prev,
                          [field]: event.target.value,
                        }))
                      }
                    >
                      {state.employees.map((employee) => (
                        <MenuItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ))}
              </Stack>
            )}

            {ruleDraft.template === "substitution_required" && (
              <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                <FormControl fullWidth>
                  <InputLabel>Substituto</InputLabel>
                  <Select
                    label="Substituto"
                    value={ruleDraft.substituteId}
                    onChange={(event) =>
                      setRuleDraft((prev) => ({ ...prev, substituteId: event.target.value }))
                    }
                  >
                    {state.employees.map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Substituidos</InputLabel>
                  <Select
                    multiple
                    label="Substituidos"
                    value={ruleDraft.substitutedIds}
                    onChange={(event) =>
                      setRuleDraft((prev) => ({
                        ...prev,
                        substitutedIds:
                          typeof event.target.value === "string"
                            ? event.target.value.split(",")
                            : event.target.value,
                      }))
                    }
                  >
                    {state.employees.map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            )}

            {ruleDraft.template === "role_one_off_each_sunday" && (
              <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                <FormControl fullWidth>
                  <InputLabel>Cargo</InputLabel>
                  <Select
                    label="Cargo"
                    value={ruleDraft.roleId}
                    onChange={(event) =>
                      setRuleDraft((prev) => ({ ...prev, roleId: event.target.value }))
                    }
                  >
                    {state.roles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Folgas por domingo"
                  type="number"
                  value={ruleDraft.sundayOffCount}
                  onChange={(event) =>
                    setRuleDraft((prev) => ({
                      ...prev,
                      sundayOffCount: Number(event.target.value),
                    }))
                  }
                  fullWidth
                />
              </Stack>
            )}

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                const rule = buildCustomRule();
                if (!rule) return;
                void savePatch({
                  rules: [...state.rules, rule],
                  audit: {
                    action: "rule.created",
                    entityType: "rule",
                    entityId: rule.id,
                    metadata: { title: rule.title },
                  },
                }, "Regra criada.");
              }}
            >
              Criar regra
            </Button>
          </Stack>
        </Paper>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button
            variant="outlined"
            onClick={() => {
              void savePatch({
                rules: createDefaultRules(),
                audit: { action: "rules.restored", entityType: "rule" },
              }, "Regras padrao restauradas.");
            }}
          >
            Restaurar regras padrao
          </Button>
        </Stack>

        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Ativa</TableCell>
                <TableCell>Regra</TableCell>
                <TableCell>Severidade</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {state.rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <Switch
                      checked={rule.enabled}
                      onChange={(event) => {
                        const rules = state.rules.map((item) =>
                          item.id === rule.id ? { ...item, enabled: event.target.checked } : item,
                        );
                        void savePatch({
                          rules,
                          audit: {
                            action: "rule.updated",
                            entityType: "rule",
                            entityId: rule.id,
                            metadata: { enabled: event.target.checked },
                          },
                        });
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {rule.title}
                    </Typography>
                    {rule.description && (
                      <Typography variant="caption" color="text.secondary">
                        {rule.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={rule.severity}
                      color={rule.severity === "HARD" ? "error" : "warning"}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Stack>
    );

    function buildCustomRule(): RuleConfig | null {
      const now = Date.now();
      if (ruleDraft.template === "pair_cannot_both_off") {
        if (!ruleDraft.employeeAId || !ruleDraft.employeeBId) {
          toast.error("Selecione os dois colaboradores.");
          return null;
        }
        if (ruleDraft.employeeAId === ruleDraft.employeeBId) {
          toast.error("Os colaboradores devem ser diferentes.");
          return null;
        }
        const a = state.employees.find((employee) => employee.id === ruleDraft.employeeAId);
        const b = state.employees.find((employee) => employee.id === ruleDraft.employeeBId);
        return {
          id: newId("rule"),
          key: `custom_pair_${now}`,
          enabled: true,
          severity: ruleDraft.severity,
          title: `${a?.name ?? "A"} e ${b?.name ?? "B"} nao podem folgar juntos`,
          description: "Regra personalizada criada no front-end.",
          params: {
            customTemplate: "pair_cannot_both_off",
            a: ruleDraft.employeeAId,
            b: ruleDraft.employeeBId,
          },
        };
      }

      if (ruleDraft.template === "substitution_required") {
        if (!ruleDraft.substituteId || ruleDraft.substitutedIds.length === 0) {
          toast.error("Selecione substituto e substituidos.");
          return null;
        }
        const substitute = state.employees.find(
          (employee) => employee.id === ruleDraft.substituteId,
        );
        return {
          id: newId("rule"),
          key: `custom_substitution_${now}`,
          enabled: true,
          severity: ruleDraft.severity,
          title: `Substituicao obrigatoria por ${substitute?.name ?? "colaborador"}`,
          description: "Regra personalizada criada no front-end.",
          params: {
            customTemplate: "substitution_required",
            substituteId: ruleDraft.substituteId,
            substitutedIds: ruleDraft.substitutedIds,
          },
        };
      }

      if (!ruleDraft.roleId || ruleDraft.sundayOffCount <= 0) {
        toast.error("Selecione cargo e quantidade de folgas.");
        return null;
      }
      const role = state.roles.find((item) => item.id === ruleDraft.roleId);
      return {
        id: newId("rule"),
        key: `custom_role_sunday_${now}`,
        enabled: true,
        severity: ruleDraft.severity,
        title: `${ruleDraft.sundayOffCount} folga(s) no domingo para ${role?.name ?? "cargo"}`,
        description: "Regra personalizada criada no front-end.",
        params: {
          customTemplate: "role_one_off_each_sunday",
          roleId: ruleDraft.roleId,
          exactlyOffCount: ruleDraft.sundayOffCount,
        },
      };
    }
  }

  function renderSchedule() {
    return (
      <Stack spacing={2}>
        {renderHeader("Editor da escala", "Monte a escala manualmente ou gere uma sugestao.")}
        {hardConflicts.length > 0 && (
          <Alert severity="error">Existem conflitos HARD pendentes na escala.</Alert>
        )}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button
            variant="contained"
            startIcon={<AutoAwesomeIcon />}
            onClick={() => {
              const nextAssignments = generateSuggestedSchedule({
                employees: state.employees,
                rules: state.rules,
                daysOfMonth: days.map((day) => day.dateISO),
              });
              const changedCells = countChangedCells(
                state.schedule.assignments,
                nextAssignments,
              );
              saveSchedule(
                nextAssignments,
                createLog({
                  type: "SET_ASSIGNMENTS",
                  changedCells,
                  message: `Sugestao aplicada em ${changedCells} celula(s).`,
                }),
                "schedule.generated",
              );
            }}
          >
            Gerar sugestao
          </Button>
          <Button
            variant="outlined"
            startIcon={<UndoIcon />}
            disabled={past.length === 0}
            onClick={() => {
              const previous = past[past.length - 1];
              if (!previous) return;
              setPast((items) => items.slice(0, -1));
              setFuture((items) => [...items, state.schedule.assignments]);
              saveSchedule(
                previous,
                createLog({
                  type: "SET_ASSIGNMENTS",
                  changedCells: countChangedCells(state.schedule.assignments, previous),
                  message: "Undo aplicado.",
                }),
                "schedule.undo",
                false,
              );
            }}
          >
            Undo
          </Button>
          <Button
            variant="outlined"
            startIcon={<RedoIcon />}
            disabled={future.length === 0}
            onClick={() => {
              const next = future[future.length - 1];
              if (!next) return;
              setFuture((items) => items.slice(0, -1));
              setPast((items) => [...items, state.schedule.assignments]);
              saveSchedule(
                next,
                createLog({
                  type: "SET_ASSIGNMENTS",
                  changedCells: countChangedCells(state.schedule.assignments, next),
                  message: "Redo aplicado.",
                }),
                "schedule.redo",
                false,
              );
            }}
          >
            Redo
          </Button>
        </Stack>

        {validation.conflicts.length > 0 && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Conflitos
            </Typography>
            <Stack spacing={1}>
              {validation.conflicts.slice(0, 12).map((conflict) => (
                <Alert
                  key={conflict.id}
                  severity={conflict.severity === "HARD" ? "error" : "warning"}
                >
                  <strong>{conflict.dateISO}</strong> - {conflict.message}
                </Alert>
              ))}
            </Stack>
          </Paper>
        )}

        <Paper variant="outlined" sx={{ overflow: "auto" }}>
          <Table size="small" sx={{ minWidth: 1100 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ position: "sticky", left: 0, bgcolor: "background.paper" }}>
                  Colaborador
                </TableCell>
                {days.map((day) => (
                  <TableCell key={day.dateISO} align="center">
                    <Typography variant="caption" color="text.secondary">
                      {WEEKDAY_LABELS_PT[day.weekday]}
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {day.day}
                    </Typography>
                  </TableCell>
                ))}
                <TableCell align="center">Folgas</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {state.employees.map((employee) => {
                const offCount = days.reduce(
                  (acc, day) =>
                    acc +
                    (statusOf(state.schedule.assignments, employee.id, day.dateISO) === "OFF"
                      ? 1
                      : 0),
                  0,
                );
                return (
                  <TableRow key={employee.id}>
                    <TableCell
                      sx={{ position: "sticky", left: 0, bgcolor: "background.paper" }}
                    >
                      <Typography variant="body2" fontWeight={700}>
                        {employee.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {roleName(state.roles, employee.roleId)}
                      </Typography>
                    </TableCell>
                    {days.map((day) => {
                      const currentStatus = statusOf(
                        state.schedule.assignments,
                        employee.id,
                        day.dateISO,
                      );
                      const isOff = currentStatus === "OFF";
                      return (
                        <TableCell key={`${employee.id}_${day.dateISO}`} align="center">
                          <Button
                            size="small"
                            variant={isOff ? "contained" : "outlined"}
                            color={isOff ? "warning" : "primary"}
                            sx={{ width: 92, minWidth: 92 }}
                            onClick={() => {
                              const nextStatus: "WORK" | "OFF" = isOff ? "WORK" : "OFF";
                              const employeeAssignments = {
                                ...(state.schedule.assignments[employee.id] ?? {}),
                                [day.dateISO]: nextStatus,
                              };
                              const nextAssignments = {
                                ...state.schedule.assignments,
                                [employee.id]: employeeAssignments,
                              };
                              saveSchedule(
                                nextAssignments,
                                createLog({
                                  type: "SET_STATUS",
                                  employeeId: employee.id,
                                  dateISO: day.dateISO,
                                  prevStatus: currentStatus,
                                  nextStatus,
                                  changedCells: 1,
                                  message: `${employee.name} ${day.dateISO}: ${currentStatus} -> ${nextStatus}`,
                                }),
                                "schedule.cell.updated",
                              );
                            }}
                          >
                            {isOff ? "Folga" : "Trabalho"}
                          </Button>
                        </TableCell>
                      );
                    })}
                    <TableCell align="center">
                      <Chip label={offCount} size="small" color={offCount > 0 ? "warning" : "default"} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Historico de alteracoes
          </Typography>
          <Stack spacing={1}>
            {[...state.schedule.changeLog].reverse().slice(0, 20).map((entry) => (
              <Box key={entry.id}>
                <Typography variant="caption" color="text.secondary">
                  {new Date(entry.at).toLocaleString("pt-BR")}
                </Typography>
                <Typography variant="body2">{entry.message}</Typography>
              </Box>
            ))}
          </Stack>
        </Paper>
      </Stack>
    );
  }

  function renderExport() {
    return (
      <Stack spacing={2}>
        {renderHeader("Exportar", "Gere a planilha XLSX do periodo atual.")}
        {hardConflicts.length > 0 && (
          <Alert severity="warning">A exportacao esta disponivel, mas ha conflitos HARD.</Alert>
        )}
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          disabled={state.employees.length === 0}
          onClick={() => {
            const exportEmployees = state.employees.map((employee) => ({
              ...employee,
              roleId: roleName(state.roles, employee.roleId) as RoleId,
            }));
            const bytes = buildWorkbook({
              year: state.plan.year,
              month: state.plan.month,
              employees: exportEmployees,
              daysOfMonth: days.map((day) => day.dateISO),
              assignments: state.schedule.assignments,
              validation,
            });
            downloadBytes({
              filename: `escala-folgas-${state.plan.year}-${String(state.plan.month).padStart(2, "0")}.xlsx`,
              bytes,
              mimeType:
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            void savePatch({
              audit: {
                action: "schedule.exported",
                entityType: "schedule",
                metadata: {
                  hardConflicts: hardConflicts.length,
                  softConflicts: softConflicts.length,
                },
              },
            });
          }}
        >
          Exportar XLSX
        </Button>
      </Stack>
    );
  }

  const content = {
    setup: renderSetup,
    cadastros: renderCadastros,
    schedule: renderSchedule,
    export: renderExport,
  }[section];

  return content();
}

function countChangedCells(
  current: ScheduleAssignments,
  next: ScheduleAssignments,
): number {
  let count = 0;
  const employeeIds = new Set([...Object.keys(current), ...Object.keys(next)]);
  employeeIds.forEach((employeeId) => {
    const currentByDate = current[employeeId as EmployeeId] ?? {};
    const nextByDate = next[employeeId as EmployeeId] ?? {};
    const dates = new Set([...Object.keys(currentByDate), ...Object.keys(nextByDate)]);
    dates.forEach((date) => {
      const currentStatus = currentByDate[date as DateISO] ?? "WORK";
      const nextStatus = nextByDate[date as DateISO] ?? "WORK";
      if (currentStatus !== nextStatus) count += 1;
    });
  });
  return count;
}
