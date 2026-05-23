import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/src/lib/server/audit";
import { requireNutriUser, requestMeta } from "@/src/lib/server/auth";
import { renderRestaurantMenuHtml } from "../../application/renderRestaurantMenuHtml";
import { findNutriRestaurantMenuById } from "../../infra/restaurantMenuRepository";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireNutriUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id } = await context.params;
  const menu = await findNutriRestaurantMenuById(id);
  if (!menu) {
    return NextResponse.json({ error: "Cardapio nao encontrado." }, { status: 404 });
  }

  await writeAuditLog({
    user,
    action: "nutri.restaurant_menu.exported",
    entityType: "nutriRestaurantMenu",
    entityId: menu.id,
    metadata: { date: menu.date, format: "html", status: menu.status },
    ...requestMeta(request),
  });

  return new Response(
    renderRestaurantMenuHtml({
      menu,
      exportedAt: new Date().toISOString(),
    }),
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    },
  );
}
