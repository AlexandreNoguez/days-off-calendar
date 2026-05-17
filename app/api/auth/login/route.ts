import { NextResponse, type NextRequest } from "next/server";
import { authenticateUser, requestMeta, setSessionCookie } from "@/src/lib/server/auth";
import { writeAuditLog } from "@/src/lib/server/audit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { username?: string; password?: string }
    | null;

  const username = body?.username?.trim() ?? "";
  const password = body?.password ?? "";
  const meta = requestMeta(request);

  if (!username || !password) {
    await writeAuditLog({
      usernameSnapshot: username || "unknown",
      action: "auth.login.failed",
      metadata: { reason: "missing_credentials" },
      ...meta,
    });
    return NextResponse.json({ error: "Credenciais obrigatorias." }, { status: 400 });
  }

  const user = await authenticateUser(username, password);

  if (!user) {
    await writeAuditLog({
      usernameSnapshot: username,
      action: "auth.login.failed",
      metadata: { reason: "invalid_credentials" },
      ...meta,
    });
    return NextResponse.json({ error: "Login ou senha invalidos." }, { status: 401 });
  }

  await writeAuditLog({
    user,
    action: "auth.login.success",
    ...meta,
  });

  const response = NextResponse.json({ user });
  setSessionCookie(response, user);
  return response;
}
