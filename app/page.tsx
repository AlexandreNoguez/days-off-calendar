import { redirect } from "next/navigation";
import { getCurrentUser } from "@/src/lib/server/auth";
import { getDefaultRouteForRole } from "@/src/lib/routes";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  redirect(user ? getDefaultRouteForRole(user.role) : "/login");
}
