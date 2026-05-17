import { redirect } from "next/navigation";
import { getCurrentUser } from "@/src/lib/server/auth";
import { MainShell } from "@/src/components/MainShell";

export const dynamic = "force-dynamic";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <MainShell user={user}>{children}</MainShell>;
}
