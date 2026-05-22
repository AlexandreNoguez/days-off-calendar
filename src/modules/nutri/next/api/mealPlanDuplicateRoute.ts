import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/src/lib/server/audit";
import { requireNutriUser, requestMeta } from "@/src/lib/server/auth";
import { duplicateNutriMealPlan } from "../../infra/mealPlanRepository";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireNutriUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id } = await context.params;
  const mealPlan = await duplicateNutriMealPlan({ id, userId: user.id });

  if (!mealPlan) {
    return NextResponse.json({ error: "Plano nao encontrado." }, { status: 404 });
  }

  await writeAuditLog({
    user,
    action: "nutri.meal_plan.duplicated",
    entityType: "nutriMealPlan",
    entityId: mealPlan.id,
    metadata: {
      sourceMealPlanId: id,
      patientId: mealPlan.patientId,
      status: mealPlan.status,
    },
    ...requestMeta(request),
  });

  return NextResponse.json({ mealPlan }, { status: 201 });
}
