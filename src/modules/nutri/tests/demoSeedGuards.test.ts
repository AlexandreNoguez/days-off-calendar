import { afterEach, describe, expect, it, vi } from "vitest";
import { isNutriDemoToolsEnabled } from "../dev/demoSeedGuards";

function setEnv(input: {
  nodeEnv?: string;
  enabled?: string;
  allowProduction?: string;
}) {
  vi.stubEnv("NODE_ENV", input.nodeEnv ?? "development");
  vi.stubEnv("NUTRI_DEMO_TOOLS_ENABLED", input.enabled ?? "");
  vi.stubEnv(
    "NUTRI_DEMO_TOOLS_ALLOW_PRODUCTION",
    input.allowProduction ?? "",
  );
}

describe("isNutriDemoToolsEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps demo tools disabled by default", () => {
    setEnv({ nodeEnv: "development" });

    expect(isNutriDemoToolsEnabled()).toBe(false);
  });

  it("enables demo tools outside production when explicitly requested", () => {
    setEnv({ nodeEnv: "development", enabled: "true" });

    expect(isNutriDemoToolsEnabled()).toBe(true);
  });

  it("blocks demo tools in production unless the production override is explicit", () => {
    setEnv({ nodeEnv: "production", enabled: "true" });

    expect(isNutriDemoToolsEnabled()).toBe(false);
  });

  it("allows production demo tools only with both flags enabled", () => {
    setEnv({
      nodeEnv: "production",
      enabled: "true",
      allowProduction: "true",
    });

    expect(isNutriDemoToolsEnabled()).toBe(true);
  });
});
