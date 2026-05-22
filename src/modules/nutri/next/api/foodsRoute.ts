import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/src/lib/server/audit";
import { requireNutriUser, requestMeta } from "@/src/lib/server/auth";
import type { NutriFoodInput } from "../../contracts/foods";
import type { NutriFoodSource, NutriNutrients } from "../../domain/types";
import { createNutriFood, listNutriFoods, summarizeNutriFoods } from "../../infra/foodRepository";

export const runtime = "nodejs";

const VALID_SOURCES = new Set<NutriFoodSource>(["TACO", "IBGE", "LABEL", "MANUAL"]);

function optionalText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function optionalNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return value >= 0 ? value : undefined;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSource(value: unknown): NutriFoodSource {
  return typeof value === "string" && VALID_SOURCES.has(value as NutriFoodSource)
    ? (value as NutriFoodSource)
    : "MANUAL";
}

function parseNutrients(value: unknown): NutriNutrients {
  const source = (value ?? {}) as Record<string, unknown>;

  return {
    energyKcal: optionalNumber(source.energyKcal),
    carbohydrateG: optionalNumber(source.carbohydrateG),
    proteinG: optionalNumber(source.proteinG),
    fatG: optionalNumber(source.fatG),
    saturatedFatG: optionalNumber(source.saturatedFatG),
    fiberG: optionalNumber(source.fiberG),
    sodiumMg: optionalNumber(source.sodiumMg),
    addedSugarG: optionalNumber(source.addedSugarG),
  };
}

function hasAnyNutrient(nutrients: NutriNutrients): boolean {
  return Object.values(nutrients).some((value) => typeof value === "number");
}

function parseFoodInput(body: NutriFoodInput | null): {
  food?: {
    name: string;
    source: NutriFoodSource;
    sourceVersion?: string;
    servingDescription?: string;
    nutrientsPer100g: NutriNutrients;
    allergens: string[];
  };
  error?: string;
} {
  const name = optionalText(body?.name);
  const nutrientsPer100g = parseNutrients(body?.nutrientsPer100g);

  if (!name) return { error: "Informe o nome do alimento." };
  if (!hasAnyNutrient(nutrientsPer100g)) {
    return { error: "Informe pelo menos um nutriente por 100 g." };
  }

  return {
    food: {
      name,
      source: parseSource(body?.source),
      sourceVersion: optionalText(body?.sourceVersion),
      servingDescription: optionalText(body?.servingDescription),
      nutrientsPer100g,
      allergens: stringArray(body?.allergens),
    },
  };
}

export async function GET(request: NextRequest) {
  const user = await requireNutriUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const query = request.nextUrl.searchParams.get("q") ?? "";
  const [foods, summary] = await Promise.all([
    listNutriFoods({ query }),
    summarizeNutriFoods(),
  ]);

  return NextResponse.json({ foods, summary });
}

export async function POST(request: NextRequest) {
  const user = await requireNutriUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as NutriFoodInput | null;
  const parsed = parseFoodInput(body);

  if (!parsed.food) {
    return NextResponse.json(
      { error: parsed.error ?? "Dados invalidos." },
      { status: 400 },
    );
  }

  const food = await createNutriFood({
    food: parsed.food,
    userId: user.id,
  });

  await writeAuditLog({
    user,
    action: "nutri.food.created",
    entityType: "nutriFood",
    entityId: food.id,
    metadata: { source: food.source, active: food.active },
    ...requestMeta(request),
  });

  return NextResponse.json({ food }, { status: 201 });
}
