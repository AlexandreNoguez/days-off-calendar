import { NextResponse } from "next/server";
import type { PublicUser, UserDocument, UserRole } from "@/src/lib/types";
import { requireAdminUser } from "@/src/lib/server/auth";
import { writeAuditLog } from "@/src/lib/server/audit";
import { getDb } from "@/src/lib/server/mongodb";
import { hashPassword } from "@/src/lib/server/passwords";
import { createId } from "@/src/lib/server/appData";

export const runtime = "nodejs";

function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
  };
}

function parseUserRole(role?: UserRole): UserRole {
  if (role === "ADMIN" || role === "NUTRI") return role;
  return "USER";
}

export async function GET() {
  const admin = await requireAdminUser().catch(() => null);
  if (!admin) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const db = await getDb();
  const users = await db
    .collection<UserDocument>("users")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({ users: users.map(toPublicUser) });
}

export async function POST(request: Request) {
  const admin = await requireAdminUser().catch(() => null);
  if (!admin) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as
    | {
        username?: string;
        displayName?: string;
        password?: string;
        role?: UserRole;
      }
    | null;

  const username = body?.username?.trim().toLowerCase() ?? "";
  const displayName = body?.displayName?.trim() ?? "";
  const password = body?.password ?? "";
  const role = parseUserRole(body?.role);

  if (!username || !displayName || password.length < 6) {
    return NextResponse.json(
      { error: "Informe nome, usuario e senha com pelo menos 6 caracteres." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const users = db.collection<UserDocument>("users");
  const existing = await users.findOne({ username });
  if (existing) {
    return NextResponse.json({ error: "Usuario ja existe." }, { status: 409 });
  }

  const now = new Date().toISOString();
  const user: UserDocument = {
    id: createId("user"),
    username,
    displayName,
    passwordHash: await hashPassword(password),
    role,
    active: true,
    createdByUserId: admin.id,
    createdAt: now,
    updatedAt: now,
  };

  await users.insertOne(user);
  await writeAuditLog({
    user: admin,
    action: "user.created",
    entityType: "user",
    entityId: user.id,
    metadata: { username: user.username, role: user.role },
  });

  return NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
}
