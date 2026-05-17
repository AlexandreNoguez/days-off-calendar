import { Suspense } from "react";
import { LoginPage } from "@/src/components/LoginPage";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
