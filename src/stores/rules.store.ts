import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RuleConfig } from "../domain/types/rules";
import type { RuleId } from "../domain/types/ids";
import { createDefaultRules } from "../domain/defaults/defaultRules";
import { STORAGE_KEYS } from "./persistence";

type RulesState = {
  rules: RuleConfig[];
  schemaVersion: number;

  actions: {
    setRules: (rules: RuleConfig[]) => void;
    toggleRule: (ruleId: RuleId, enabled: boolean) => void;
    updateRuleParams: (
      ruleId: RuleId,
      paramsPatch: Record<string, unknown>,
    ) => void;
    setRuleParams: (ruleId: RuleId, params: Record<string, unknown>) => void;
    resetToDefaultRules: () => void;
    // seeds
    seedDefaults: (rules: RuleConfig[]) => void;
  };
};

export const useRulesStore = create<RulesState>()(
  persist(
    (set, get) => ({
      rules: [],
      schemaVersion: 1,

      actions: {
        setRules: (rules) => set({ rules }),

        toggleRule: (ruleId, enabled) =>
          set({
            rules: get().rules.map((r) =>
              r.id === ruleId ? { ...r, enabled } : r,
            ),
          }),

        updateRuleParams: (ruleId, paramsPatch) =>
          set({
            rules: get().rules.map((r) =>
              r.id === ruleId
                ? { ...r, params: { ...r.params, ...paramsPatch } }
                : r,
            ),
          }),

        setRuleParams: (ruleId, params) =>
          set({
            rules: get().rules.map((r) =>
              r.id === ruleId ? { ...r, params } : r,
            ),
          }),

        resetToDefaultRules: () => {
          set({ rules: createDefaultRules() });
        },

        // seeds
        seedDefaults: (rules: RuleConfig[]) => set({ rules }),
      },
    }),
    {
      name: STORAGE_KEYS.rules,
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        rules: state.rules,
      }),
    },
  ),
);
