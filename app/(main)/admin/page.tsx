import { redirect } from "next/navigation";
import { getCurrentUser } from "@/src/lib/server/auth";
import { AdminPage } from "@/src/components/AdminPage";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/schedule");

  return <AdminPage />;
}
