import type { RuleConfig, RuleSeverity, DefaultRuleKey } from "../types/rules";
import { DEFAULT_ROLE_IDS } from "./defaultRoles";
import { DEFAULT_EMPLOYEE_IDS } from "./defaultEmployees";

function createRule(input: {
  key: DefaultRuleKey;
  title: string;
  severity: RuleSeverity;
  enabled?: boolean;
  description?: string;
  params?: Record<string, unknown>;
}): RuleConfig {
  return {
    id: `rule_${input.key}`,
    key: input.key,
    title: input.title,
    severity: input.severity,
    enabled: input.enabled ?? true,
    description: input.description,
    params: input.params ?? {},
  };
}

export function createDefaultRules(): RuleConfig[] {
  return [
    // Tales: always OFF on Sundays
    createRule({
      key: "fixed_off_sunday_tales",
      title: "Tales folga sempre aos domingos",
      severity: "HARD",
      params: {
        employeeId: DEFAULT_EMPLOYEE_IDS.tales,
      },
      description:
        "O Tales trabalha de segunda a sábado e folga fixo no domingo.",
    }),

    // Cooks: exactly 1 cook OFF each Sunday
    createRule({
      key: "cook_rotation_one_off_each_sunday",
      title: "Rodízio de domingo dos cozinheiros (1 de folga por domingo)",
      severity: "HARD",
      params: {
        cookRoleId: DEFAULT_ROLE_IDS.cook,
        exactlyOffCount: 1,
      },
      description:
        "Em todo domingo, exatamente 1 cozinheiro fica de folga e os demais trabalham.",
    }),

    // Cook if Sunday OFF => cannot have any weekday OFF in that week (Mon-Sat)
    createRule({
      key: "cook_if_sunday_off_no_week_off",
      title: "Cozinheiro que folga no domingo não pode folgar durante a semana",
      severity: "HARD",
      params: {
        cookRoleId: DEFAULT_ROLE_IDS.cook,
      },
    }),

    // Cook if Sunday WORK => must have 1 weekday OFF in that week (Mon-Sat)
    createRule({
      key: "cook_if_sunday_work_requires_week_off",
      title: "Cozinheiro que trabalha no domingo deve folgar 1 dia na semana",
      severity: "HARD",
      params: {
        cookRoleId: DEFAULT_ROLE_IDS.cook,
        requiredWeekdayOffCount: 1,
      },
    }),

    // After Sunday OFF, cannot be OFF on Monday right after
    createRule({
      key: "cook_no_monday_off_after_sunday_off",
      title: "Se folgou domingo, não pode folgar na segunda seguinte",
      severity: "HARD",
      params: {
        cookRoleId: DEFAULT_ROLE_IDS.cook,
      },
    }),

    // Assistants: if Sunday OFF => cannot have weekday OFF in that week
    createRule({
      key: "assistant_if_sunday_off_no_week_off",
      title: "Auxiliar que folga no domingo não pode folgar durante a semana",
      severity: "HARD",
      params: {
        assistantRoleId: DEFAULT_ROLE_IDS.assistant,
      },
    }),

    // Assistants: if Sunday WORK => must have 1 weekday OFF in that week
    createRule({
      key: "assistant_if_sunday_work_requires_week_off",
      title: "Auxiliar que trabalha no domingo deve folgar 1 dia na semana",
      severity: "HARD",
      params: {
        assistantRoleId: DEFAULT_ROLE_IDS.assistant,
        requiredWeekdayOffCount: 1,
      },
    }),

    // Assistants: after Sunday OFF, cannot be OFF on Monday right after
    createRule({
      key: "assistant_no_monday_off_after_sunday_off",
      title: "Auxiliar: se folgou domingo, não pode folgar na segunda seguinte",
      severity: "HARD",
      params: {
        assistantRoleId: DEFAULT_ROLE_IDS.assistant,
      },
    }),

    // Assistants: weekly OFF should stay fixed on the same weekday
    createRule({
      key: "assistant_weekday_off_must_be_fixed",
      title: "Auxiliar deve manter folga fixa no mesmo dia da semana",
      severity: "HARD",
      params: {
        assistantRoleId: DEFAULT_ROLE_IDS.assistant,
      },
    }),

    // Laundry: one Sunday OFF per month
    createRule({
      key: "laundry_one_sunday_off_per_month",
      title: "Lavanderia tem direito a 1 folga no domingo por mês",
      severity: "HARD",
      params: {
        employeeId: DEFAULT_EMPLOYEE_IDS.ingrid,
        exactlyOffCount: 1,
      },
    }),

    // Pot washer: one Sunday OFF per month
    createRule({
      key: "pot_washer_one_sunday_off_per_month",
      title: "Paneleiro tem direito a 1 folga no domingo por mês",
      severity: "HARD",
      params: {
        employeeId: DEFAULT_EMPLOYEE_IDS.fernando,
        exactlyOffCount: 1,
      },
    }),

    // Legal rule: max 6 consecutive work days
    createRule({
      key: "max_six_consecutive_work_days",
      title: "Máximo de 6 dias consecutivos de trabalho",
      severity: "HARD",
      params: {
        maxConsecutiveWorkDays: 6,
      },
      description:
        "Nenhum colaborador pode trabalhar mais de 6 dias seguidos sem folga.",
    }),

    // Clarice, Ingrid, Elaine cannot be OFF on the same day
    createRule({
      key: "no_coincidence_clarice_ingrid_elaine",
      title: "Folgas de Clarice, Ingrid e Elaine não podem coincidir",
      severity: "HARD",
      params: {
        employeeIds: [
          DEFAULT_EMPLOYEE_IDS.clarice,
          DEFAULT_EMPLOYEE_IDS.ingrid,
          DEFAULT_EMPLOYEE_IDS.elaine,
        ],
      },
    }),

    // Elaine cannot be OFF on same day as Josana
    createRule({
      key: "elaine_not_same_day_josana",
      title: "Elaine não pode folgar no mesmo dia da Josana",
      severity: "HARD",
      params: {
        a: DEFAULT_EMPLOYEE_IDS.elaine,
        b: DEFAULT_EMPLOYEE_IDS.josana,
      },
    }),

    // Elaine cannot be OFF on same day as Luis
    createRule({
      key: "elaine_not_same_day_luis",
      title: "Elaine não pode folgar no mesmo dia do Luís",
      severity: "HARD",
      params: {
        a: DEFAULT_EMPLOYEE_IDS.elaine,
        b: DEFAULT_EMPLOYEE_IDS.luis,
      },
    }),

    // If Josana or Luis is OFF, Elaine must WORK (substitution)
    createRule({
      key: "if_josana_or_luis_off_then_elaine_must_work",
      title:
        "Quando Josana ou Luís folgam, Elaine deve trabalhar (substituição)",
      severity: "HARD",
      params: {
        substituteId: DEFAULT_EMPLOYEE_IDS.elaine,
        substitutedIds: [
          DEFAULT_EMPLOYEE_IDS.josana,
          DEFAULT_EMPLOYEE_IDS.luis,
        ],
      },
    }),

    // If Maria is OFF, Lidriel must WORK
    createRule({
      key: "if_maria_off_then_lidriel_must_work",
      title: "Quando Maria folga, Lidriel não pode folgar",
      severity: "HARD",
      params: {
        ifOffEmployeeId: DEFAULT_EMPLOYEE_IDS.maria,
        mustWorkEmployeeId: DEFAULT_EMPLOYEE_IDS.lidriel,
      },
    }),

    // Ingrid and Fernando cannot both be OFF (and vice-versa)
    createRule({
      key: "ingrid_and_fernando_cannot_both_off",
      title: "Folgas de Ingrid e Fernando não podem coincidir",
      severity: "HARD",
      params: {
        a: DEFAULT_EMPLOYEE_IDS.ingrid,
        b: DEFAULT_EMPLOYEE_IDS.fernando,
      },
    }),

    // Annual holiday credit policy (1 holiday off per year per employee)
    createRule({
      key: "annual_holiday_credit_one_per_person",
      title: "Cada pessoa tem direito a 1 folga em feriado por ano",
      severity: "HARD",
      params: {
        creditPerYear: 1,
      },
    }),

    // Soft preference: avoid taking the same weekday off repeatedly
    createRule({
      key: "avoid_same_weekday_off",
      title: "Evitar folgar sempre no mesmo dia da semana",
      severity: "SOFT",
      enabled: true,
      params: {},
    }),
  ];
}
