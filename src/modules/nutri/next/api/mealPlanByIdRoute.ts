import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/src/lib/server/audit";
import { requireNutriUser, requestMeta } from "@/src/lib/server/auth";
import type { NutriMealPlanInput } from "../../contracts/mealPlans";
import type { NutriMealPlanStatus } from "../../domain/types";
import { updateNutriMealPlanStatus } from "../../infra/mealPlanRepository";

export const runtime = "nodejs";

const VALID_STATUSES = new Set<NutriMealPlanStatus>([
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
  const body = (await request.json().catch(() => null)) as NutriMealPlanInput | null;
  const status =
    typeof body?.status === "string" && VALID_STATUSES.has(body.status)
      ? body.status
      : undefined;

  if (!status) {
    return NextResponse.json({ error: "Informe um status valido." }, { status: 400 });
  }

  const mealPlan = await updateNutriMealPlanStatus({
    id,
    status,
    userId: user.id,
  });

  if (!mealPlan) {
    return NextResponse.json({ error: "Plano nao encontrado." }, { status: 404 });
  }

  await writeAuditLog({
    user,
    action: "nutri.meal_plan.updated",
    entityType: "nutriMealPlan",
    entityId: mealPlan.id,
    metadata: {
      patientId: mealPlan.patientId,
      status: mealPlan.status,
    },
    ...requestMeta(request),
  });

  return NextResponse.json({ mealPlan });
}
