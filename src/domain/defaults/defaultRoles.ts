import type { Role } from "../types/employees";

export const DEFAULT_ROLE_IDS = {
  cook: "role_cook",
  laundry: "role_laundry",
  potWasher: "role_pot_washer",
  assistant: "role_assistant",
  stockAssistant: "role_stock_assistant",
} as const;

export function createDefaultRoles(): Role[] {
  return [
    { id: DEFAULT_ROLE_IDS.cook, name: "Cozinheiro" },
    { id: DEFAULT_ROLE_IDS.laundry, name: "Lavanderia" },
    { id: DEFAULT_ROLE_IDS.potWasher, name: "Paneleiro" },
    { id: DEFAULT_ROLE_IDS.assistant, name: "Auxiliar" },
    { id: DEFAULT_ROLE_IDS.stockAssistant, name: "Auxiliar de Estoque" },
  ];
}
