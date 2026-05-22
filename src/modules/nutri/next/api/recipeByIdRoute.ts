import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/src/lib/server/audit";
import { requireNutriUser, requestMeta } from "@/src/lib/server/auth";
import type { NutriRecipeInput } from "../../contracts/recipes";
import type { NutriRecipeStatus } from "../../domain/types";
import { updateNutriRecipeStatus } from "../../infra/recipeRepository";

export const runtime = "nodejs";

const VALID_STATUSES = new Set<NutriRecipeStatus>([
  "DRAFT",
  "APPROVED",
  "ARCHIVED",
]);

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireNutriUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as NutriRecipeInput | null;
  const status =
    typeof body?.status === "string" && VALID_STATUSES.has(body.status)
      ? body.status
      : undefined;

  if (!status) {
    return NextResponse.json({ error: "Informe um status valido." }, { status: 400 });
  }

  const recipe = await updateNutriRecipeStatus({
    id,
    status,
    userId: user.id,
  });

  if (!recipe) {
    return NextResponse.json({ error: "Receita nao encontrada." }, { status: 404 });
  }

  await writeAuditLog({
    user,
    action: "nutri.recipe.updated",
    entityType: "nutriRecipe",
    entityId: recipe.id,
    metadata: {
      status: recipe.status,
      version: recipe.version,
      sourceRecipeId: recipe.sourceRecipeId,
    },
    ...requestMeta(request),
  });

  return NextResponse.json({ recipe });
}
