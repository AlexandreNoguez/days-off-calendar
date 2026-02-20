import { createDefaultSeed } from "../../domain/defaults/defaultSeed";
import { useEmployeesStore } from "../../stores/employees.store";
import { useRulesStore } from "../../stores/rules.store";
import { useAppStore } from "../../stores/app.store";
import { usePlanStore } from "../../stores/plan.store";

export function useSeedDefaults() {
  const year = usePlanStore((s) => s.year);

  const seedEmployees = useEmployeesStore((s) => s.actions.seedDefaults);
  const seedRules = useRulesStore((s) => s.actions.seedDefaults);
  const setHasSavedData = useAppStore((s) => s.actions.setHasSavedData);

  const seedDefaults = () => {
    const seed = createDefaultSeed(year);
    console.log(seed);

    seedEmployees({ roles: seed.roles, employees: seed.employees });
    seedRules(seed.rules);

    setHasSavedData(true);
  };

  return { actions: { seedDefaults } };
}
