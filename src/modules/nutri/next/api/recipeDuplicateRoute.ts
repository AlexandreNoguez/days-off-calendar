import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/src/lib/server/audit";
import { requireNutriUser, requestMeta } from "@/src/lib/server/auth";
import { duplicateNutriRecipe } from "../../infra/recipeRepository";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireNutriUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id } = await context.params;
  const recipe = await duplicateNutriRecipe({ id, userId: user.id });

  if (!recipe) {
    return NextResponse.json({ error: "Receita nao encontrada." }, { status: 404 });
  }

  await writeAuditLog({
    user,
    action: "nutri.recipe.duplicated",
    entityType: "nutriRecipe",
    entityId: recipe.id,
    metadata: {
      sourceRecipeId: id,
      status: recipe.status,
      version: recipe.version,
    },
    ...requestMeta(request),
  });

  return NextResponse.json({ recipe }, { status: 201 });
}
