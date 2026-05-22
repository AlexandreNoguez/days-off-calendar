import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/src/lib/server/audit";
import { requireNutriUser, requestMeta } from "@/src/lib/server/auth";
import type { NutriFoodInput } from "../../contracts/foods";
import type { NutriFoodSource, NutriNutrients } from "../../domain/types";
import { updateNutriFood } from "../../infra/foodRepository";

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

function parsePatch(body: NutriFoodInput | null) {
  const patch: NutriFoodInput = {};

  if (typeof body?.name === "string") {
    const name = optionalText(body.name);
    if (!name) return { error: "Informe o nome do alimento." };
    patch.name = name;
  }

  if (typeof body?.source === "string" && VALID_SOURCES.has(body.source as NutriFoodSource)) {
    patch.source = body.source as NutriFoodSource;
  }

  if (typeof body?.sourceVersion === "string") {
    patch.sourceVersion = optionalText(body.sourceVersion);
  }

  if (typeof body?.servingDescription === "string") {
    patch.servingDescription = optionalText(body.servingDescription);
  }

  if (body?.nutrientsPer100g) {
    patch.nutrientsPer100g = parseNutrients(body.nutrientsPer100g);
  }

  if (Array.isArray(body?.allergens)) patch.allergens = stringArray(body.allergens);
  if (typeof body?.active === "boolean") patch.active = body.active;

  return { patch };
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireNutriUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as NutriFoodInput | null;
  const parsed = parsePatch(body);

  if (!parsed.patch) {
    return NextResponse.json(
      { error: parsed.error ?? "Dados invalidos." },
      { status: 400 },
    );
  }

  const food = await updateNutriFood({ id, patch: parsed.patch });
  if (!food) {
    return NextResponse.json({ error: "Alimento nao encontrado." }, { status: 404 });
  }

  await writeAuditLog({
    user,
    action: "nutri.food.updated",
    entityType: "nutriFood",
    entityId: food.id,
    metadata: {
      changedFields: Object.keys(parsed.patch),
      source: food.source,
      active: food.active,
    },
    ...requestMeta(request),
  });

  return NextResponse.json({ food });
}
