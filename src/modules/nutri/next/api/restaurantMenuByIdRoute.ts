import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/src/lib/server/audit";
import { requireNutriUser, requestMeta } from "@/src/lib/server/auth";
import type { NutriRestaurantMenuInput } from "../../contracts/restaurantMenus";
import type { NutriRestaurantMenuStatus } from "../../domain/types";
import { updateNutriRestaurantMenuStatus } from "../../infra/restaurantMenuRepository";

export const runtime = "nodejs";

const VALID_STATUSES = new Set<NutriRestaurantMenuStatus>([
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
  const body = (await request.json().catch(() => null)) as
    | NutriRestaurantMenuInput
    | null;
  const status =
    typeof body?.status === "string" && VALID_STATUSES.has(body.status)
      ? body.status
      : undefined;

  if (!status) {
    return NextResponse.json({ error: "Informe um status valido." }, { status: 400 });
  }

  const menu = await updateNutriRestaurantMenuStatus({
    id,
    status,
    userId: user.id,
  });

  if (!menu) {
    return NextResponse.json({ error: "Cardapio nao encontrado." }, { status: 404 });
  }

  await writeAuditLog({
    user,
    action: "nutri.restaurant_menu.updated",
    entityType: "nutriRestaurantMenu",
    entityId: menu.id,
    metadata: {
      date: menu.date,
      status: menu.status,
    },
    ...requestMeta(request),
  });

  return NextResponse.json({ menu });
}
