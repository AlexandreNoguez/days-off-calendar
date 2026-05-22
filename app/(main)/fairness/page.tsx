import { redirect } from "next/navigation";
import { WorkspacePage } from "@/src/components/WorkspacePage";
import { getCurrentUser } from "@/src/lib/server/auth";
import { getDefaultRouteForRole } from "@/src/lib/routes";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "NUTRI") redirect(getDefaultRouteForRole(user.role));

  return <WorkspacePage section="fairness" />;
}
