export function isNutriDemoToolsEnabled(): boolean {
  const enabled = process.env.NUTRI_DEMO_TOOLS_ENABLED === "true";
  const allowProduction =
    process.env.NUTRI_DEMO_TOOLS_ALLOW_PRODUCTION === "true";

  if (!enabled) return false;
  if (process.env.NODE_ENV === "production" && !allowProduction) return false;

  return true;
}
