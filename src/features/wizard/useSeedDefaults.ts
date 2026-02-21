import { createDefaultSeed } from "../../domain/defaults/defaultSeed";
import { useEmployeesStore } from "../../stores/employees.store";
import { useRulesStore } from "../../stores/rules.store";
import { useAppStore } from "../../stores/app.store";
import { usePlanStore } from "../../stores/plan.store";
import { toast } from "react-toastify";

export function useSeedDefaults() {
  const year = usePlanStore((s) => s.year);

  const seedEmployees = useEmployeesStore((s) => s.actions.seedDefaults);
  const seedRules = useRulesStore((s) => s.actions.seedDefaults);
  const setHasSavedData = useAppStore((s) => s.actions.setHasSavedData);

  const seedDefaults = () => {
    const seed = createDefaultSeed(year);

    seedEmployees({ roles: seed.roles, employees: seed.employees });
    seedRules(seed.rules);

    setHasSavedData(true);
    toast.success("Dados padrão carregados.");
  };

  const seedEmployeesDefaults = () => {
    const seed = createDefaultSeed(year);
    seedEmployees({ roles: seed.roles, employees: seed.employees });
    setHasSavedData(true);
    toast.success("Colaboradores e cargos padrão restaurados.");
  };

  const seedRulesDefaults = () => {
    const seed = createDefaultSeed(year);
    seedRules(seed.rules);
    setHasSavedData(true);
    toast.success("Regras padrão restauradas.");
  };

  return {
    actions: {
      seedDefaults,
      seedEmployeesDefaults,
      seedRulesDefaults,
    },
  };
}
