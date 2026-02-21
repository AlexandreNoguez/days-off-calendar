import { useMemo, useState } from "react";
import type { RuleId } from "../../domain/types/ids";
import { createDefaultRules } from "../../domain/defaults/defaultRules";
import { useRulesStore } from "../../stores/rules.store";
import { useEmployeesStore } from "../../stores/employees.store";
import { ruleFormRegistry, type RuleFormSchema } from "./ruleFormRegistry";

type EditState = {
  text: string;
  error?: string;
};

type FormEditState = {
  params: Record<string, unknown>;
};

function pretty(input: Record<string, unknown>): string {
  return JSON.stringify(input, null, 2);
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

export function useRulesPage() {
  const rules = useRulesStore((s) => s.rules);
  const setRules = useRulesStore((s) => s.actions.setRules);
  const toggleRule = useRulesStore((s) => s.actions.toggleRule);
  const setRuleParams = useRulesStore((s) => s.actions.setRuleParams);
  const resetToDefaultRules = useRulesStore((s) => s.actions.resetToDefaultRules);

  const roles = useEmployeesStore((s) => s.roles);
  const employees = useEmployeesStore((s) => s.employees);

  const [editing, setEditing] = useState<Record<RuleId, EditState>>({});
  const [formEditing, setFormEditing] = useState<Record<RuleId, FormEditState>>(
    {},
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

  function ensureDefaultRules() {
    if (hasRules) return;
    setRules(createDefaultRules());
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
        error: 'Os parâmetros devem ser um objeto JSON (ex: {"x":1}).',
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
            error: "Os parâmetros devem ser um objeto JSON (ex: {\"x\":1}).",
          },
        }));
        return;
      }

      setRuleParams(ruleId, parsed as Record<string, unknown>);
      cancelEditParams(ruleId);
    } catch {
      setEditing((prev) => ({
        ...prev,
        [ruleId]: {
          ...draft,
          error: "JSON inválido. Revise a sintaxe antes de salvar.",
        },
      }));
    }
  }

  function startFormEdit(ruleId: RuleId) {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;

    const schema = ruleFormRegistry[rule.key];
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

    const schema = ruleFormRegistry[rule.key];
    const params = schema ? schema.serializer(draft.params) : draft.params;

    setRuleParams(ruleId, params);
    cancelFormEdit(ruleId);
  }


  return {
    state: {
      orderedRules,
      hasRules,
      editing,
      formEditing,
      ruleFormRegistry,
      formReadyRulesCount: Object.keys(ruleFormRegistry).length,
      roles,
      employees,
    },
    actions: {
      ensureDefaultRules,
      resetToDefaultRules,
      onToggleRule,
      startEditParams,
      cancelEditParams,
      changeParamsDraft,
      saveParams,
      startFormEdit,
      cancelFormEdit,
      updateFormField,
      saveFormEdit,
    },
  };
}
