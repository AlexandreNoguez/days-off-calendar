import { Stack } from "@mui/material";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/src/components/AdminPageHeader";
import { getCurrentUser } from "@/src/lib/server/auth";
import { AdminPage } from "@/src/components/AdminPage";
import { getDefaultRouteForRole } from "@/src/lib/routes";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(getDefaultRouteForRole(user.role));

  return (
    <Stack spacing={2}>
      <AdminPageHeader />
      <AdminPage />
    </Stack>
  );
}
