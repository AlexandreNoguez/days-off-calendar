import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/src/lib/server/audit";
import { requireNutriUser, requestMeta } from "@/src/lib/server/auth";
import { renderRecipeHtml } from "../../application/renderRecipeHtml";
import { findNutriRecipeById } from "../../infra/recipeRepository";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireNutriUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id } = await context.params;
  const recipe = await findNutriRecipeById(id);
  if (!recipe) {
    return NextResponse.json({ error: "Receita nao encontrada." }, { status: 404 });
  }

  await writeAuditLog({
    user,
    action: "nutri.recipe.exported",
    entityType: "nutriRecipe",
    entityId: recipe.id,
    metadata: { format: "html", status: recipe.status, version: recipe.version },
    ...requestMeta(request),
  });

  return new Response(
    renderRecipeHtml({
      recipe,
      exportedAt: new Date().toISOString(),
      responsibleName: user.displayName || user.username,
    }),
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    },
  );
}
