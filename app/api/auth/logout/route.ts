import { NextResponse, type NextRequest } from "next/server";
import { clearSessionCookie, getCurrentUser, requestMeta } from "@/src/lib/server/auth";
import { writeAuditLog } from "@/src/lib/server/audit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (user) {
    await writeAuditLog({
      user,
      action: "auth.logout",
      ...requestMeta(request),
    });
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
