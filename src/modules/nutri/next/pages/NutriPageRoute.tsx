import { redirect } from "next/navigation";
import { requireNutriUser } from "@/src/lib/server/auth";
import { NutriPage } from "../../presentation/NutriPage";

export default async function NutriPageRoute() {
  const user = await requireNutriUser().catch(() => null);
  if (!user) redirect("/");

  return <NutriPage />;
}
