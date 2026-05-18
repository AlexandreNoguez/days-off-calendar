import { NextResponse } from "next/server";
import type { AppStatePatch } from "@/src/lib/types";
import { getAppState, saveAppStatePatch } from "@/src/lib/server/appData";
import { getCurrentUser, requireAdminUser } from "@/src/lib/server/auth";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const state = await getAppState(user);
  return NextResponse.json(state);
}

export async function PUT(request: Request) {
  const user = await requireAdminUser().catch(() => null);
  if (!user) {
    return NextResponse.json(
      { error: "Apenas administradores podem alterar os dados da escala." },
      { status: 403 },
    );
  }

  const patch = (await request.json().catch(() => ({}))) as AppStatePatch;
  const state = await saveAppStatePatch(user, patch);
  return NextResponse.json(state);
}
