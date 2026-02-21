import { useMemo, useState } from "react";
import type { RuleConfig } from "../../domain/types/rules";
import type { RuleId } from "../../domain/types/ids";
import { createDefaultRules } from "../../domain/defaults/defaultRules";
import { useRulesStore } from "../../stores/rules.store";
import { useEmployeesStore } from "../../stores/employees.store";
import {
  ruleFormRegistry,
  type RuleFormSchema,
} from "./ruleFormRegistry";
import { toast } from "react-toastify";

type EditState = {
  text: string;
  error?: string;
};

type FormEditState = {
  params: Record<string, unknown>;
};

export type CustomRuleTemplate =
  | "pair_cannot_both_off"
  | "substitution_required"
  | "cook_one_off_each_sunday";

type CreateRuleDraft = {
  template: CustomRuleTemplate;
  employeeAId: string;
  employeeBId: string;
  substituteId: string;
  substitutedIds: string[];
  cookRoleId: string;
  sundayOffCount: number;
  severity: RuleConfig["severity"];
};

const defaultCreateRuleDraft: CreateRuleDraft = {
  template: "pair_cannot_both_off",
  employeeAId: "",
  employeeBId: "",
  substituteId: "",
  substitutedIds: [],
  cookRoleId: "",
  sundayOffCount: 1,
  severity: "HARD",
};

function pretty(input: Record<string, unknown>): string {
  return JSON.stringify(input, null, 2);
}

const customRuleFormSchemas: Record<string, RuleFormSchema> = {
  pair_cannot_both_off: {
    fields: [
      { type: "select", key: "a", label: "Colaborador A", source: "employees", required: true },
      { type: "select", key: "b", label: "Colaborador B", source: "employees", required: true },
    ],
    defaults: { a: "", b: "" },
    parser: (input) => ({
      a: typeof input.a === "string" ? input.a : "",
      b: typeof input.b === "string" ? input.b : "",
    }),
    serializer: (input) => ({
      customTemplate: "pair_cannot_both_off",
      a: input.a,
      b: input.b,
    }),
  },
  substitution_required: {
    fields: [
      {
        type: "select",
        key: "substituteId",
        label: "Substituto",
        source: "employees",
        required: true,
      },
      {
        type: "multiselect",
        key: "substitutedIds",
        label: "Substituídos",
        source: "employees",
        minItems: 1,
        required: true,
      },
    ],
    defaults: { substituteId: "", substitutedIds: [] },
    parser: (input) => ({
      substituteId: typeof input.substituteId === "string" ? input.substituteId : "",
      substitutedIds: Array.isArray(input.substitutedIds)
        ? input.substitutedIds.filter((x): x is string => typeof x === "string")
        : [],
    }),
    serializer: (input) => ({
      customTemplate: "substitution_required",
      substituteId: input.substituteId,
      substitutedIds: input.substitutedIds,
    }),
  },
  role_one_off_each_sunday: {
    fields: [
      { type: "select", key: "roleId", label: "Cargo", source: "roles", required: true },
      {
        type: "number",
        key: "exactlyOffCount",
        label: "Folgas por domingo",
        min: 1,
        max: 7,
        step: 1,
        required: true,
      },
    ],
    defaults: { roleId: "", exactlyOffCount: 1 },
    parser: (input) => ({
      roleId: typeof input.roleId === "string" ? input.roleId : "",
      exactlyOffCount:
        typeof input.exactlyOffCount === "number" && Number.isFinite(input.exactlyOffCount)
          ? input.exactlyOffCount
          : 1,
    }),
    serializer: (input) => ({
      customTemplate: "role_one_off_each_sunday",
      roleId: input.roleId,
      exactlyOffCount: input.exactlyOffCount,
    }),
  },
};

function getRuleSchema(rule: RuleConfig): RuleFormSchema | undefined {
  if (rule.key in ruleFormRegistry) {
    return ruleFormRegistry[rule.key as keyof typeof ruleFormRegistry];
  }

  const customTemplate = rule.params.customTemplate;
  if (typeof customTemplate === "string" && customTemplate in customRuleFormSchemas) {
    return customRuleFormSchemas[customTemplate];
  }

  return undefined;
}

function createFormParams(
  schema: RuleFormSchema | undefined,
  currentParams: Record<string, unknown>,
): Record<string, unknown> {
  if (!schema) return { ...currentParams };

  return {
    ...schema.defaults,
    ...schema.parser(currentParams),
  };
}

function buildCustomRule(input: {
  draft: CreateRuleDraft;
  employeeNameById: Record<string, string>;
  roleNameById: Record<string, string>;
}): RuleConfig | { error: string } {
  const now = Date.now();

  if (input.draft.template === "pair_cannot_both_off") {
    if (!input.draft.employeeAId || !input.draft.employeeBId) {
      return { error: "Selecione os dois colaboradores do par." };
    }

    if (input.draft.employeeAId === input.draft.employeeBId) {
      return { error: "Os colaboradores do par devem ser diferentes." };
    }

    const nameA = input.employeeNameById[input.draft.employeeAId] ?? "Colaborador A";
    const nameB = input.employeeNameById[input.draft.employeeBId] ?? "Colaborador B";

    return {
      id: `rule_custom_pair_${now}`,
      key: `custom_pair_${now}`,
      enabled: true,
      severity: input.draft.severity,
      title: `${nameA} e ${nameB} não podem folgar juntos`,
      description: "Regra personalizada criada a partir do template de par.",
      params: {
        customTemplate: "pair_cannot_both_off",
        a: input.draft.employeeAId,
        b: input.draft.employeeBId,
      },
    };
  }

  if (input.draft.template === "substitution_required") {
    if (!input.draft.substituteId || input.draft.substitutedIds.length === 0) {
      return { error: "Selecione o substituto e ao menos um colaborador substituído." };
    }

    const substituteName =
      input.employeeNameById[input.draft.substituteId] ?? "Substituto";

    return {
      id: `rule_custom_substitution_${now}`,
      key: `custom_substitution_${now}`,
      enabled: true,
      severity: input.draft.severity,
      title: `Substituição obrigatória por ${substituteName}`,
      description: "Regra personalizada criada a partir do template de substituição.",
      params: {
        customTemplate: "substitution_required",
        substituteId: input.draft.substituteId,
        substitutedIds: input.draft.substitutedIds,
      },
    };
  }

  if (!input.draft.cookRoleId) {
    return { error: "Selecione o cargo para o template de domingo." };
  }

  const roleName = input.roleNameById[input.draft.cookRoleId] ?? "Cargo";

  return {
    id: `rule_custom_cook_sunday_${now}`,
    key: `custom_cook_sunday_${now}`,
    enabled: true,
    severity: input.draft.severity,
    title: `${input.draft.sundayOffCount} folga(s) no domingo para ${roleName}`,
    description: "Regra personalizada criada a partir do template de domingo.",
    params: {
      customTemplate: "role_one_off_each_sunday",
      roleId: input.draft.cookRoleId,
      exactlyOffCount: input.draft.sundayOffCount,
    },
  };
}

export function useRulesPage() {
  const rules = useRulesStore((s) => s.rules);
  const setRules = useRulesStore((s) => s.actions.setRules);
  const toggleRule = useRulesStore((s) => s.actions.toggleRule);
  const setRuleParams = useRulesStore((s) => s.actions.setRuleParams);
  const resetToDefaultRules = useRulesStore((s) => s.actions.resetToDefaultRules);

  const roles = useEmployeesStore((s) => s.roles);
  const employees = useEmployeesStore((s) => s.employees);

  const [editing, setEditing] = useState<Record<RuleId, EditState>>({});
  const [formEditing, setFormEditing] = useState<Record<RuleId, FormEditState>>({});

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createStep, setCreateStep] = useState(0);
  const [createError, setCreateError] = useState<string | undefined>(undefined);
  const [createRuleDraft, setCreateRuleDraft] = useState<CreateRuleDraft>(
    defaultCreateRuleDraft,
  );

  const hasRules = rules.length > 0;

  const orderedRules = useMemo(
    () =>
      [...rules].sort((a, b) => {
        if (a.severity !== b.severity) return a.severity === "HARD" ? -1 : 1;
        return a.title.localeCompare(b.title, "pt-BR");
      }),
    [rules],
  );

  const employeeNameById = useMemo(
    () => Object.fromEntries(employees.map((employee) => [employee.id, employee.name])),
    [employees],
  );

  const roleNameById = useMemo(
    () => Object.fromEntries(roles.map((role) => [role.id, role.name])),
    [roles],
  );

  function ensureDefaultRules() {
    if (hasRules) {
      toast.info("As regras já estão carregadas.");
      return;
    }
    setRules(createDefaultRules());
    toast.success("Regras padrão carregadas.");
  }

  function restoreDefaultRules() {
    resetToDefaultRules();
    toast.success("Regras restauradas para o padrão.");
  }

  function onToggleRule(ruleId: RuleId, enabled: boolean) {
    toggleRule(ruleId, enabled);
  }

  function startEditParams(ruleId: RuleId) {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;

    setEditing((prev) => ({
      ...prev,
      [ruleId]: { text: pretty(rule.params) },
    }));
  }

  function cancelEditParams(ruleId: RuleId) {
    setEditing((prev) => {
      const next = { ...prev };
      delete next[ruleId];
      return next;
    });
  }

  function changeParamsDraft(ruleId: RuleId, text: string) {
    setEditing((prev) => ({
      ...prev,
      [ruleId]: {
        text,
        error: undefined,
      },
    }));
  }

  function saveParams(ruleId: RuleId) {
    const draft = editing[ruleId];
    if (!draft) return;

    try {
      const parsed: unknown = JSON.parse(draft.text);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        setEditing((prev) => ({
          ...prev,
          [ruleId]: {
            ...draft,
            error: 'Os parâmetros devem ser um objeto JSON (ex: {"x":1}).',
          },
        }));
        return;
      }

      setRuleParams(ruleId, parsed as Record<string, unknown>);
      cancelEditParams(ruleId);
      toast.success("Parâmetros da regra atualizados.");
    } catch {
      setEditing((prev) => ({
        ...prev,
        [ruleId]: {
          ...draft,
          error: "JSON inválido. Revise a sintaxe antes de salvar.",
        },
      }));
      toast.error("JSON inválido para parâmetros da regra.");
    }
  }

  function startFormEdit(ruleId: RuleId) {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;

    const schema = getRuleSchema(rule);
    const params = createFormParams(schema, rule.params);

    setFormEditing((prev) => ({
      ...prev,
      [ruleId]: { params },
    }));
  }

  function cancelFormEdit(ruleId: RuleId) {
    setFormEditing((prev) => {
      const next = { ...prev };
      delete next[ruleId];
      return next;
    });
  }

  function updateFormField(ruleId: RuleId, field: string, value: unknown) {
    setFormEditing((prev) => ({
      ...prev,
      [ruleId]: {
        params: {
          ...(prev[ruleId]?.params ?? {}),
          [field]: value,
        },
      },
    }));
  }

  function saveFormEdit(ruleId: RuleId) {
    const rule = rules.find((r) => r.id === ruleId);
    const draft = formEditing[ruleId];
    if (!rule || !draft) return;

    const schema = getRuleSchema(rule);
    const params = schema ? schema.serializer(draft.params) : draft.params;

    setRuleParams(ruleId, params);
    cancelFormEdit(ruleId);
    toast.success("Regra atualizada com sucesso.");
  }

  function openCreateRuleDialog() {
    setCreateStep(0);
    setCreateError(undefined);
    setCreateRuleDraft(defaultCreateRuleDraft);
    setIsCreateDialogOpen(true);
  }

  function closeCreateRuleDialog() {
    setIsCreateDialogOpen(false);
    setCreateStep(0);
    setCreateError(undefined);
  }

  function changeCreateStep(nextStep: number) {
    setCreateStep(Math.max(0, Math.min(2, nextStep)));
    setCreateError(undefined);
  }

  function updateCreateRuleDraft(patch: Partial<CreateRuleDraft>) {
    setCreateRuleDraft((prev) => ({ ...prev, ...patch }));
    setCreateError(undefined);
  }

  function createCustomRule() {
    const builtRule = buildCustomRule({
      draft: createRuleDraft,
      employeeNameById,
      roleNameById,
    });

    if ("error" in builtRule) {
      setCreateError(builtRule.error);
      toast.error(builtRule.error);
      return false;
    }

    setRules([...rules, builtRule]);
    closeCreateRuleDialog();
    toast.success("Regra personalizada criada.");
    return true;
  }

  return {
    state: {
      orderedRules,
      hasRules,
      editing,
      formEditing,
      ruleFormRegistry,
      formReadyRulesCount:
        Object.keys(ruleFormRegistry).length + Object.keys(customRuleFormSchemas).length,
      roles,
      employees,
      isCreateDialogOpen,
      createStep,
      createError,
      createRuleDraft,
    },
    actions: {
      ensureDefaultRules,
      resetToDefaultRules: restoreDefaultRules,
      onToggleRule,
      startEditParams,
      cancelEditParams,
      changeParamsDraft,
      saveParams,
      startFormEdit,
      cancelFormEdit,
      updateFormField,
      saveFormEdit,
      openCreateRuleDialog,
      closeCreateRuleDialog,
      changeCreateStep,
      updateCreateRuleDraft,
      createCustomRule,
    },
  };
}
