import { NextResponse } from "next/server";
import type { AuditLog } from "@/src/lib/types";
import { requireAdminUser } from "@/src/lib/server/auth";
import { getDb } from "@/src/lib/server/mongodb";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const admin = await requireAdminUser().catch(() => null);

    if (!admin) {
      return NextResponse.json(
        { error: "Acesso negado." },
        { status: 403 },
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    const username = url.searchParams.get("username");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    const query: Record<string, unknown> = {};

    if (action) query.action = action;
    if (username) query.usernameSnapshot = username;

    if (from || to) {
      query.createdAt = {
        ...(from ? { $gte: new Date(`${from}T00:00:00.000Z`).toISOString() } : {}),
        ...(to ? { $lte: new Date(`${to}T23:59:59.999Z`).toISOString() } : {}),
      };
    }

    const db = await getDb();

    const logs = await db
      .collection<AuditLog>("auditLogs")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    return NextResponse.json({
      logs: logs.map((log) => {
        const plain = { ...log } as AuditLog & { _id?: unknown };
        delete plain._id;
        return plain;
      }),
    });
  } catch (error) {
    console.error("[api/admin/logs] unexpected error", error);

    return NextResponse.json(
      { error: "Erro interno ao carregar logs." },
      { status: 500 },
    );
  }
}
