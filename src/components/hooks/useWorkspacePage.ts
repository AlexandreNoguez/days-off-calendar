"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import type { Employee, Role } from "../../domain/types/employees";
import type { DateISO, EmployeeId, RoleId } from "../../domain/types/ids";
import type { RuleConfig } from "../../domain/types/rules";
import type {
  ScheduleAssignments,
  ScheduleChangeLogEntry,
} from "../../domain/types/schedule";
import type { ValidationResult } from "../../domain/types/validation";
import type {
  AppStateDto,
  AppStatePatch,
  SchedulePublication,
} from "../../lib/types";
import { createDefaultRules } from "../../domain/defaults/defaultRules";
import { buildWorkbook } from "../../application/usecases/export/buildWorkbook";
import { validateSchedule } from "../../application/usecases/rules/validateSchedule";
import { bulkSetAssignments } from "../../application/usecases/schedule/bulkSetAssignments";
import { generateSuggestedScheduleWithReport } from "../../application/usecases/schedule/generateSuggestedSchedule";
import { getDaysOfMonth, WEEKDAY_LABELS_PT } from "../../shared/utils/dates";
import { downloadBytes } from "../../shared/utils/download";

export type WorkspaceSection = "setup" | "cadastros" | "schedule" | "export";
export type CadastroTab = "employees" | "roles" | "rules";
export type CustomRuleTemplate =
  | "pair_cannot_both_off"
  | "substitution_required"
  | "role_one_off_each_sunday";

type EmployeeDraft = {
  name: string;
  roleId: string;
  alwaysOffSunday: boolean;
  notes: string;
};

type RuleDraft = {
  template: CustomRuleTemplate;
  employeeAId: string;
  employeeBId: string;
  substituteId: string;
  substitutedIds: string[];
  roleId: string;
  sundayOffCount: number;
  severity: RuleConfig["severity"];
};

type SetupCell =
  | {
      kind: "blank";
      key: string;
    }
  | {
      kind: "day";
      key: string;
      dateISO: DateISO;
      dayNumber: number;
      weekday: number;
      weekdayLabel: string;
      isHoliday: boolean;
    };

type ScheduleDayCell = {
  dateISO: DateISO;
  dayNumber: number;
  weekdayLabel: string;
  isOff: boolean;
  status: "WORK" | "OFF";
};

type ScheduleRow = {
  employee: Employee;
  roleName: string;
  offCount: number;
  days: ScheduleDayCell[];
};

type ChangeLogRow = {
  id: string;
  atLabel: string;
  message: string;
};

export const MONTHS = [
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

const emptyValidation: ValidationResult = {
  conflicts: [],
  isValid: true,
  statsPerEmployee: {},
};

const PUBLICATION_STATUS_LABELS: Record<SchedulePublication["status"], string> = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicada",
  CLOSED: "Fechada",
};

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

function defaultRuleDraft(): RuleDraft {
  return {
    template: "pair_cannot_both_off",
    employeeAId: "",
    employeeBId: "",
    substituteId: "",
    substitutedIds: [],
    roleId: "",
    sundayOffCount: 1,
    severity: "HARD",
  };
}

function canCreateRule(draft: RuleDraft): boolean {
  if (draft.template === "pair_cannot_both_off") {
    return Boolean(
      draft.employeeAId &&
        draft.employeeBId &&
        draft.employeeAId !== draft.employeeBId,
    );
  }

  if (draft.template === "substitution_required") {
    return Boolean(draft.substituteId && draft.substitutedIds.length > 0);
  }

  return Boolean(draft.roleId && draft.sundayOffCount > 0);
}

function publicationDescription(publication: SchedulePublication): string {
  if (publication.status === "PUBLISHED" && publication.publishedAt) {
    return `Publicada em ${new Date(publication.publishedAt).toLocaleString("pt-BR")}`;
  }

  if (publication.status === "CLOSED" && publication.closedAt) {
    return `Fechada em ${new Date(publication.closedAt).toLocaleString("pt-BR")}`;
  }

  if (publication.publishedAt) {
    return `Ultima publicacao em ${new Date(publication.publishedAt).toLocaleString("pt-BR")}`;
  }

  return "Ainda nao publicada";
}

export function useWorkspacePage() {
  const [loadedState, setLoadedState] = useState<AppStateDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cadastroTab, setCadastroTab] = useState<CadastroTab>("employees");
  const [past, setPast] = useState<ScheduleAssignments[]>([]);
  const [future, setFuture] = useState<ScheduleAssignments[]>([]);
  const [roleDraft, setRoleDraft] = useState("");
  const [employeeDraft, setEmployeeDraft] = useState<EmployeeDraft>({
    name: "",
    roleId: "",
    alwaysOffSunday: false,
    notes: "",
  });
  const [ruleDraft, setRuleDraft] = useState<RuleDraft>(defaultRuleDraft);
  const canManage = loadedState?.user.role === "ADMIN";
  const publication = loadedState?.schedule.publication ?? ({ status: "DRAFT" } as const);
  const scheduleLocked = publication.status !== "DRAFT" || !canManage;

  useEffect(() => {
    let active = true;
    fetch("/api/app-state")
      .then((response) => {
        if (!response.ok) throw new Error("Falha ao carregar dados.");
        return response.json() as Promise<AppStateDto>;
      })
      .then((data) => {
        if (!active) return;
        setLoadedState(data);
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

  const dayISOs = useMemo(() => days.map((day) => day.dateISO), [days]);

  const validation = useMemo(() => {
    if (!loadedState) return emptyValidation;

    return validateSchedule({
      employees: loadedState.employees,
      rules: loadedState.rules,
      assignments: loadedState.schedule.assignments,
      daysOfMonth: dayISOs,
      holidays: loadedState.holidays,
    });
  }, [loadedState, dayISOs]);

  const hardConflicts = useMemo(
    () => validation.conflicts.filter((conflict) => conflict.severity === "HARD"),
    [validation.conflicts],
  );

  const softConflicts = useMemo(
    () => validation.conflicts.filter((conflict) => conflict.severity === "SOFT"),
    [validation.conflicts],
  );

  const header = useMemo(
    () => ({
      periodLabel: loadedState
        ? `${String(loadedState.plan.month).padStart(2, "0")}/${loadedState.plan.year}`
        : "--/----",
      employeeCount: loadedState?.employees.length ?? 0,
      hardConflictCount: hardConflicts.length,
      softConflictCount: softConflicts.length,
    }),
    [hardConflicts.length, loadedState, softConflicts.length],
  );

  const setupCells = useMemo<SetupCell[]>(() => {
    if (!loadedState) return [];
    const firstWeekday = days[0]?.weekday ?? 0;
    const blanks = Array.from({ length: firstWeekday }).map((_, index) => ({
      kind: "blank" as const,
      key: `blank_${index}`,
    }));
    const cells = days.map((day) => ({
      kind: "day" as const,
      key: day.dateISO,
      dateISO: day.dateISO,
      dayNumber: day.day,
      weekday: day.weekday,
      weekdayLabel: WEEKDAY_LABELS_PT[day.weekday],
      isHoliday: Boolean(loadedState.holidays[day.dateISO]),
    }));

    return [...blanks, ...cells];
  }, [days, loadedState]);

  const scheduleDays = useMemo(
    () =>
      days.map((day) => ({
        dateISO: day.dateISO,
        dayNumber: day.day,
        weekdayLabel: WEEKDAY_LABELS_PT[day.weekday],
      })),
    [days],
  );

  const scheduleRows = useMemo<ScheduleRow[]>(() => {
    if (!loadedState) return [];

    return loadedState.employees.map((employee) => {
      const employeeDays = days.map((day) => {
        const status = statusOf(
          loadedState.schedule.assignments,
          employee.id,
          day.dateISO,
        );
        return {
          dateISO: day.dateISO,
          dayNumber: day.day,
          weekdayLabel: WEEKDAY_LABELS_PT[day.weekday],
          status,
          isOff: status === "OFF",
        };
      });

      return {
        employee,
        roleName: roleName(loadedState.roles, employee.roleId),
        offCount: employeeDays.filter((day) => day.isOff).length,
        days: employeeDays,
      };
    });
  }, [days, loadedState]);

  const changeLogRows = useMemo<ChangeLogRow[]>(() => {
    if (!loadedState) return [];
    return [...loadedState.schedule.changeLog]
      .reverse()
      .slice(0, 20)
      .map((entry) => ({
        id: entry.id,
        atLabel: new Date(entry.at).toLocaleString("pt-BR"),
        message: entry.message,
      }));
  }, [loadedState]);

  async function savePatch(patch: AppStatePatch, successMessage?: string) {
    if (!canManage) {
      toast.warning("Apenas administradores podem alterar os dados da escala.");
      return null;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/app-state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        toast.error(data?.error ?? "Nao foi possivel salvar.");
        return null;
      }

      const next = (await response.json()) as AppStateDto;
      setLoadedState(next);
      if (successMessage) toast.success(successMessage);
      return next;
    } catch {
      toast.error("Nao foi possivel salvar.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  function updateEmployeeDraft(patch: Partial<EmployeeDraft>) {
    setEmployeeDraft((prev) => ({ ...prev, ...patch }));
  }

  function updateRuleDraft(patch: Partial<RuleDraft>) {
    setRuleDraft((prev) => ({ ...prev, ...patch }));
  }

  function updateRuleSubstitutedIds(value: string | string[]) {
    updateRuleDraft({
      substitutedIds: typeof value === "string" ? value.split(",") : value,
    });
  }

  function changeMonth(month: number) {
    if (!loadedState) return;
    void savePatch({
      plan: { year: loadedState.plan.year, month },
      audit: { action: "plan.updated", entityType: "plan" },
    });
  }

  function changeYear(year: number) {
    if (!loadedState || year < 2020 || year > 2100) return;
    void savePatch({
      plan: { year, month: loadedState.plan.month },
      audit: { action: "plan.updated", entityType: "plan" },
    });
  }

  function toggleHoliday(dateISO: DateISO) {
    if (!loadedState) return;
    const nextHolidays = { ...loadedState.holidays };
    const enabled = !nextHolidays[dateISO];

    if (enabled) nextHolidays[dateISO] = true;
    else delete nextHolidays[dateISO];

    void savePatch({
      holidays: nextHolidays,
      audit: {
        action: "holiday.toggled",
        entityType: "holiday",
        entityId: dateISO,
        metadata: { enabled },
      },
    });
  }

  function createRole() {
    if (!loadedState) return;
    const name = roleDraft.trim();
    if (!name) return;

    setRoleDraft("");
    void savePatch(
      {
        roles: [...loadedState.roles, { id: newId("role") as RoleId, name }],
        audit: { action: "role.created", entityType: "role", metadata: { name } },
      },
      "Cargo criado.",
    );
  }

  function deleteRole(roleId: RoleId) {
    if (!loadedState) return;

    void savePatch(
      {
        roles: loadedState.roles.filter((item) => item.id !== roleId),
        employees: loadedState.employees.filter((item) => item.roleId !== roleId),
        audit: {
          action: "role.deleted",
          entityType: "role",
          entityId: roleId,
        },
      },
      "Cargo removido.",
    );
  }

  function createEmployee() {
    if (!loadedState || !employeeDraft.name.trim() || !employeeDraft.roleId) return;

    const employee: Employee = {
      id: newId("emp") as EmployeeId,
      name: employeeDraft.name.trim(),
      roleId: employeeDraft.roleId as RoleId,
      alwaysOffSunday: employeeDraft.alwaysOffSunday,
      holidayCreditYear: loadedState.plan.year,
      holidayOffUsed: false,
      notes: employeeDraft.notes.trim() || undefined,
    };

    setEmployeeDraft({
      name: "",
      roleId: loadedState.roles[0]?.id ?? "",
      alwaysOffSunday: false,
      notes: "",
    });

    void savePatch(
      {
        employees: [...loadedState.employees, employee],
        audit: {
          action: "employee.created",
          entityType: "employee",
          entityId: employee.id,
          metadata: { name: employee.name },
        },
      },
      "Colaborador criado.",
    );
  }

  function deleteEmployee(employeeId: EmployeeId) {
    if (!loadedState) return;

    void savePatch(
      {
        employees: loadedState.employees.filter((item) => item.id !== employeeId),
        audit: {
          action: "employee.deleted",
          entityType: "employee",
          entityId: employeeId,
        },
      },
      "Colaborador removido.",
    );
  }

  function restoreDefaultRules() {
    void savePatch(
      {
        rules: createDefaultRules(),
        audit: { action: "rules.restored", entityType: "rule" },
      },
      "Regras padrao restauradas.",
    );
  }

  function toggleRule(ruleId: RuleConfig["id"], enabled: boolean) {
    if (!loadedState) return;

    void savePatch({
      rules: loadedState.rules.map((item) =>
        item.id === ruleId ? { ...item, enabled } : item,
      ),
      audit: {
        action: "rule.updated",
        entityType: "rule",
        entityId: ruleId,
        metadata: { enabled },
      },
    });
  }

  function buildCustomRule(): RuleConfig | null {
    if (!loadedState) return null;
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

      const a = loadedState.employees.find(
        (employee) => employee.id === ruleDraft.employeeAId,
      );
      const b = loadedState.employees.find(
        (employee) => employee.id === ruleDraft.employeeBId,
      );

      return {
        id: newId("rule") as RuleConfig["id"],
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

      const substitute = loadedState.employees.find(
        (employee) => employee.id === ruleDraft.substituteId,
      );

      return {
        id: newId("rule") as RuleConfig["id"],
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

    const role = loadedState.roles.find((item) => item.id === ruleDraft.roleId);
    return {
      id: newId("rule") as RuleConfig["id"],
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

  function createCustomRule() {
    if (!loadedState) return;
    const rule = buildCustomRule();
    if (!rule) return;

    void savePatch(
      {
        rules: [...loadedState.rules, rule],
        audit: {
          action: "rule.created",
          entityType: "rule",
          entityId: rule.id,
          metadata: { title: rule.title },
        },
      },
      "Regra criada.",
    );
  }

  function saveSchedule(
    nextAssignments: ScheduleAssignments,
    log: ScheduleChangeLogEntry,
    auditAction: string,
    pushHistory = true,
  ) {
    if (!loadedState) return;
    if (loadedState.schedule.publication.status !== "DRAFT") {
      toast.warning("Reabra a escala para editar o periodo.");
      return;
    }

    const nextLog = [...loadedState.schedule.changeLog, log].slice(-300);

    if (pushHistory) {
      setPast((items) => [...items, loadedState.schedule.assignments].slice(-50));
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

  function publishSchedule() {
    if (!loadedState) return;

    if (hardConflicts.length > 0) {
      toast.error("Corrija os conflitos HARD antes de publicar a escala.");
      return;
    }

    const now = new Date().toISOString();
    const nextPublication: SchedulePublication = {
      status: "PUBLISHED",
      publishedAt: now,
      publishedByUserId: loadedState.user.id,
      publishedByUsername: loadedState.user.username,
    };

    void savePatch(
      {
        schedule: { publication: nextPublication },
        audit: {
          action: "schedule.published",
          entityType: "schedule",
          metadata: {
            period: `${loadedState.plan.year}-${String(loadedState.plan.month).padStart(2, "0")}`,
            hardConflicts: hardConflicts.length,
            softConflicts: softConflicts.length,
          },
        },
      },
      "Escala publicada.",
    );
  }

  function reopenSchedule() {
    if (!loadedState || loadedState.schedule.publication.status === "DRAFT") return;

    const current = loadedState.schedule.publication;
    const nextPublication: SchedulePublication = {
      status: "DRAFT",
      publishedAt: current.publishedAt,
      publishedByUserId: current.publishedByUserId,
      publishedByUsername: current.publishedByUsername,
    };

    void savePatch(
      {
        schedule: { publication: nextPublication },
        audit: {
          action: "schedule.reopened",
          entityType: "schedule",
          metadata: {
            previousStatus: current.status,
            period: `${loadedState.plan.year}-${String(loadedState.plan.month).padStart(2, "0")}`,
          },
        },
      },
      "Escala reaberta para edicao.",
    );
  }

  function closeSchedule() {
    if (!loadedState || loadedState.schedule.publication.status !== "PUBLISHED") return;

    const now = new Date().toISOString();
    const nextPublication: SchedulePublication = {
      ...loadedState.schedule.publication,
      status: "CLOSED",
      closedAt: now,
      closedByUserId: loadedState.user.id,
      closedByUsername: loadedState.user.username,
    };

    void savePatch(
      {
        schedule: { publication: nextPublication },
        audit: {
          action: "schedule.closed",
          entityType: "schedule",
          metadata: {
            period: `${loadedState.plan.year}-${String(loadedState.plan.month).padStart(2, "0")}`,
          },
        },
      },
      "Escala fechada.",
    );
  }

  function generateSuggestion() {
    if (!loadedState) return;

    const suggestion = generateSuggestedScheduleWithReport({
      employees: loadedState.employees,
      rules: loadedState.rules,
      daysOfMonth: dayISOs,
      holidays: loadedState.holidays,
    });
    const nextAssignments = suggestion.assignments;
    const changedCells = countChangedCells(
      loadedState.schedule.assignments,
      nextAssignments,
    );

    saveSchedule(
      nextAssignments,
      createLog({
        type: "SET_ASSIGNMENTS",
        changedCells,
        message:
          suggestion.repairPasses > 0
            ? `Sugestao aplicada em ${changedCells} celula(s), com ${suggestion.repairPasses} retentativa(s) automatica(s).`
            : `Sugestao aplicada em ${changedCells} celula(s).`,
      }),
      "schedule.generated",
    );
  }

  function markAllAsWork() {
    if (!loadedState) return;

    const result = bulkSetAssignments({
      assignments: loadedState.schedule.assignments,
      employeeIds: loadedState.employees.map((employee) => employee.id),
      dateISOs: dayISOs,
      status: "WORK",
    });

    if (result.changedCells === 0) {
      toast.info("Todas as celulas ja estao marcadas como trabalho.");
      return;
    }

    saveSchedule(
      result.assignments,
      createLog({
        type: "BULK_SET",
        changedCells: result.changedCells,
        nextStatus: "WORK",
        message: `Alteracao em lote: ${result.changedCells} celula(s) para Trabalho.`,
      }),
      "schedule.bulk.updated",
    );
  }

  function resetSchedule() {
    if (!loadedState) return;
    if (loadedState.schedule.publication.status !== "DRAFT") {
      toast.warning("Reabra a escala para limpar o periodo.");
      return;
    }

    const changedCells = countChangedCells(loadedState.schedule.assignments, {});
    if (changedCells === 0 && loadedState.schedule.changeLog.length === 0) {
      toast.info("A escala do periodo ja esta limpa.");
      return;
    }

    const confirmed = window.confirm(
      "Limpar a escala deste periodo? Esta acao remove as marcacoes e o historico local da escala.",
    );
    if (!confirmed) return;

    setPast((items) => [...items, loadedState.schedule.assignments].slice(-50));
    setFuture([]);

    void savePatch(
      {
        schedule: {
          assignments: {},
          changeLog: [],
        },
        audit: {
          action: "data.reset",
          entityType: "schedule",
          metadata: {
            scope: "current_period_schedule",
            period: `${loadedState.plan.year}-${String(loadedState.plan.month).padStart(2, "0")}`,
            changedCells,
          },
        },
      },
      "Escala limpa.",
    );
  }

  function undo() {
    if (!loadedState) return;
    const previous = past[past.length - 1];
    if (!previous) return;

    setPast((items) => items.slice(0, -1));
    setFuture((items) => [...items, loadedState.schedule.assignments]);
    saveSchedule(
      previous,
      createLog({
        type: "SET_ASSIGNMENTS",
        changedCells: countChangedCells(loadedState.schedule.assignments, previous),
        message: "Undo aplicado.",
      }),
      "schedule.undo",
      false,
    );
  }

  function redo() {
    if (!loadedState) return;
    const next = future[future.length - 1];
    if (!next) return;

    setFuture((items) => items.slice(0, -1));
    setPast((items) => [...items, loadedState.schedule.assignments]);
    saveSchedule(
      next,
      createLog({
        type: "SET_ASSIGNMENTS",
        changedCells: countChangedCells(loadedState.schedule.assignments, next),
        message: "Redo aplicado.",
      }),
      "schedule.redo",
      false,
    );
  }

  function toggleCell(employeeId: EmployeeId, dateISO: DateISO) {
    if (!loadedState) return;

    const employee = loadedState.employees.find((item) => item.id === employeeId);
    const currentStatus = statusOf(loadedState.schedule.assignments, employeeId, dateISO);
    const nextStatus: "WORK" | "OFF" = currentStatus === "OFF" ? "WORK" : "OFF";
    const employeeAssignments = {
      ...(loadedState.schedule.assignments[employeeId] ?? {}),
      [dateISO]: nextStatus,
    };
    const nextAssignments = {
      ...loadedState.schedule.assignments,
      [employeeId]: employeeAssignments,
    };

    saveSchedule(
      nextAssignments,
      createLog({
        type: "SET_STATUS",
        employeeId,
        dateISO,
        prevStatus: currentStatus,
        nextStatus,
        changedCells: 1,
        message: `${employee?.name ?? employeeId} ${dateISO}: ${currentStatus} -> ${nextStatus}`,
      }),
      "schedule.cell.updated",
    );
  }

  function exportXlsx() {
    if (!loadedState) return;

    const exportEmployees = loadedState.employees.map((employee) => ({
      ...employee,
      roleId: roleName(loadedState.roles, employee.roleId) as RoleId,
    }));
    const bytes = buildWorkbook({
      year: loadedState.plan.year,
      month: loadedState.plan.month,
      employees: exportEmployees,
      daysOfMonth: dayISOs,
      assignments: loadedState.schedule.assignments,
      validation,
    });

    downloadBytes({
      filename: `escala-folgas-${loadedState.plan.year}-${String(loadedState.plan.month).padStart(2, "0")}.xlsx`,
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
  }

  return {
    state: {
      data: loadedState,
      loading,
      saving,
      header,
      months: MONTHS,
      weekdayLabels: WEEKDAY_LABELS_PT,
      cadastroTab,
      canManage,
      roleDraft,
      employeeDraft,
      ruleDraft,
      canCreateRole: Boolean(roleDraft.trim()),
      canCreateEmployee: Boolean(employeeDraft.name.trim() && employeeDraft.roleId),
      canCreateRule: canCreateRule(ruleDraft),
      canUndo: past.length > 0,
      canRedo: future.length > 0,
      canExport: Boolean(loadedState && loadedState.employees.length > 0),
      canAccessExport: Boolean(canManage),
      canBulkEdit: Boolean(
        loadedState && canManage && publication.status === "DRAFT" && loadedState.employees.length > 0,
      ),
      canResetSchedule: Boolean(
        loadedState &&
          canManage &&
          publication.status === "DRAFT" &&
          (Object.keys(loadedState.schedule.assignments).length > 0 ||
            loadedState.schedule.changeLog.length > 0),
      ),
      canPublish: Boolean(
        loadedState &&
          canManage &&
          publication.status === "DRAFT" &&
          loadedState.employees.length > 0 &&
          hardConflicts.length === 0,
      ),
      canClose: Boolean(canManage && publication.status === "PUBLISHED"),
      canReopen: Boolean(canManage && publication.status !== "DRAFT"),
      scheduleLocked,
      publication,
      publicationLabel: PUBLICATION_STATUS_LABELS[publication.status],
      publicationDescription: publicationDescription(publication),
      days: scheduleDays,
      setupCells,
      scheduleRows,
      changeLogRows,
      validation,
      hardConflicts,
      softConflicts,
    },
    actions: {
      setCadastroTab,
      setRoleDraft,
      updateEmployeeDraft,
      updateRuleDraft,
      updateRuleSubstitutedIds,
      changeMonth,
      changeYear,
      toggleHoliday,
      createRole,
      deleteRole,
      createEmployee,
      deleteEmployee,
      restoreDefaultRules,
      toggleRule,
      createCustomRule,
      generateSuggestion,
      markAllAsWork,
      resetSchedule,
      publishSchedule,
      reopenSchedule,
      closeSchedule,
      undo,
      redo,
      toggleCell,
      exportXlsx,
    },
  };
}
