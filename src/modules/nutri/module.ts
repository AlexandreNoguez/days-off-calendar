export const NUTRI_MODULE = {
  id: "nutri",
  label: "Nutri",
  routeBase: "/nutri",
  apiBase: "/api/nutri",
  requiredRole: "NUTRI",
} as const;

export type NutriModule = typeof NUTRI_MODULE;
