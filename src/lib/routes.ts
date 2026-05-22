import type { UserRole } from "./types";

export function getDefaultRouteForRole(role: UserRole): string {
  if (role === "NUTRI") return "/nutri";
  return "/schedule";
}
