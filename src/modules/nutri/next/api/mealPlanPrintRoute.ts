import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/src/lib/server/audit";
import { requireNutriUser, requestMeta } from "@/src/lib/server/auth";
import { renderMealPlanHtml } from "../../application/renderMealPlanHtml";
import { findNutriMealPlanById } from "../../infra/mealPlanRepository";
import { findNutriPatientById } from "../../infra/patientRepository";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireNutriUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id } = await context.params;
  const mealPlan = await findNutriMealPlanById(id);
  if (!mealPlan) {
    return NextResponse.json({ error: "Plano nao encontrado." }, { status: 404 });
  }

  const patient = await findNutriPatientById(mealPlan.patientId);
  if (!patient) {
    return NextResponse.json({ error: "Paciente nao encontrado." }, { status: 404 });
  }

  await writeAuditLog({
    user,
    action: "nutri.meal_plan.exported",
    entityType: "nutriMealPlan",
    entityId: mealPlan.id,
    metadata: { patientId: mealPlan.patientId, format: "html", status: mealPlan.status },
    ...requestMeta(request),
  });

  return new Response(
    renderMealPlanHtml({
      mealPlan,
      patient,
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
