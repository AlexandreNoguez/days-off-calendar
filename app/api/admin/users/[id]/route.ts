import { NextResponse } from "next/server";
import type { UserDocument, UserRole } from "@/src/lib/types";
import { requireAdminUser } from "@/src/lib/server/auth";
import { writeAuditLog } from "@/src/lib/server/audit";
import { getDb } from "@/src/lib/server/mongodb";
import { hashPassword } from "@/src/lib/server/passwords";

export const runtime = "nodejs";

function isEditableUserRole(role: unknown): role is UserRole {
  return role === "ADMIN" || role === "USER" || role === "NUTRI";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdminUser().catch(() => null);
  if (!admin) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    displayName?: string;
    role?: UserRole;
    active?: boolean;
    password?: string;
  };

  const set: Partial<UserDocument> = {
    updatedAt: new Date().toISOString(),
  };

  if (typeof body.displayName === "string" && body.displayName.trim()) {
    set.displayName = body.displayName.trim();
  }

  if (isEditableUserRole(body.role)) set.role = body.role;
  if (typeof body.active === "boolean") set.active = body.active;
  if (typeof body.password === "string" && body.password.length > 0) {
    if (body.password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres." },
        { status: 400 },
      );
    }
    set.passwordHash = await hashPassword(body.password);
  }

  const db = await getDb();
  const result = await db.collection<UserDocument>("users").findOneAndUpdate(
    { id },
    { $set: set },
    { returnDocument: "after" },
  );

  if (!result) {
    return NextResponse.json({ error: "Usuario nao encontrado." }, { status: 404 });
  }

  await writeAuditLog({
    user: admin,
    action: "user.updated",
    entityType: "user",
    entityId: id,
    metadata: {
      changedFields: Object.keys(set).filter((key) => key !== "passwordHash"),
      passwordChanged: Boolean(set.passwordHash),
    },
  });

  return NextResponse.json({ ok: true });
}
