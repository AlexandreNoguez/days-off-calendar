export const STORAGE_KEYS = {
  app: "folgas:app",
  plan: "folgas:plan",
  calendar: "folgas:calendar",
  employees: "folgas:employees",
  rules: "folgas:rules",
  schedule: "folgas:schedule",
} as const;

export function clearAllPersistedData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}
