import type { Role } from "../types/employees";

const DEFAULT_TIMESTAMP = "1970-01-01T00:00:00.000Z";

export const DEFAULT_ROLE_IDS = {
  cook: "role_cook",
  laundry: "role_laundry",
  potWasher: "role_pot_washer",
  assistant: "role_assistant",
  stockAssistant: "role_stock_assistant",
} as const;

export function createDefaultRoles(timestamp = DEFAULT_TIMESTAMP): Role[] {
  return [
    {
      id: DEFAULT_ROLE_IDS.cook,
      name: "Cozinheiro",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: DEFAULT_ROLE_IDS.laundry,
      name: "Lavanderia",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: DEFAULT_ROLE_IDS.potWasher,
      name: "Paneleiro",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: DEFAULT_ROLE_IDS.assistant,
      name: "Auxiliar",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: DEFAULT_ROLE_IDS.stockAssistant,
      name: "Auxiliar de Estoque",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
}
