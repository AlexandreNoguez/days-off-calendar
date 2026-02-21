import type { Employee } from "../../../domain/types/employees";
import type { DateISO } from "../../../domain/types/ids";
import type { ScheduleAssignments } from "../../../domain/types/schedule";
import type { ValidationResult } from "../../../domain/types/validation";
import { getWeekday, WEEKDAY_LABELS_PT } from "../../../shared/utils/dates";
import { buildSimpleXlsx } from "../../../shared/utils/simpleXlsx";

type Input = {
  year: number;
  month: number;
  employees: Employee[];
  daysOfMonth: DateISO[];
  assignments: ScheduleAssignments;
  validation: ValidationResult;
};

function statusOf(
  assignments: ScheduleAssignments,
  employeeId: string,
  dateISO: DateISO,
): string {
  return assignments[employeeId]?.[dateISO] ?? "WORK";
}

export function buildWorkbook(input: Input): Uint8Array {
  const header = [
    "Colaborador",
    "Cargo",
    ...input.daysOfMonth.map((dateISO) => {
      const day = Number(dateISO.slice(8, 10));
      const weekday = WEEKDAY_LABELS_PT[getWeekday(dateISO)];
      return `${day} (${weekday})`;
    }),
    "Total OFF",
  ];

  const rows: Array<Array<string | number>> = [
    [
      "Escala de Folgas",
      `${String(input.month).padStart(2, "0")}/${input.year}`,
    ],
    [
      "Status da validação",
      input.validation.isValid ? "Sem conflitos HARD" : "Com conflitos HARD",
    ],
    [
      "Conflitos HARD",
      input.validation.conflicts.filter((c) => c.severity === "HARD").length,
    ],
    [
      "Conflitos SOFT",
      input.validation.conflicts.filter((c) => c.severity === "SOFT").length,
    ],
    [],
    header,
  ];

  input.employees.forEach((employee) => {
    const statuses = input.daysOfMonth.map((d) =>
      statusOf(input.assignments, employee.id, d),
    );
    const offCount = statuses.reduce(
      (acc, status) => acc + (status === "OFF" ? 1 : 0),
      0,
    );

    rows.push([employee.name, employee.roleId, ...statuses, offCount]);
  });

  if (input.validation.conflicts.length > 0) {
    rows.push([]);
    rows.push(["Conflitos detectados"]);
    rows.push(["Data", "Severidade", "Regra", "Mensagem"]);

    input.validation.conflicts.forEach((conflict) => {
      rows.push([
        conflict.dateISO,
        conflict.severity,
        conflict.ruleId,
        conflict.message,
      ]);
    });
  }

  return buildSimpleXlsx(rows);
}
