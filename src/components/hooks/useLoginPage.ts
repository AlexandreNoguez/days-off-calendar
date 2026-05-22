"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { PublicUser } from "@/src/lib/types";
import { getDefaultRouteForRole } from "@/src/lib/routes";

export function useLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);

    const data = (await response.json().catch(() => null)) as
      | { error?: string; user?: PublicUser }
      | null;

    if (!response.ok) {
      setError(data?.error ?? "Nao foi possivel entrar.");
      return;
    }

    router.replace(
      searchParams.get("next") ||
        (data?.user ? getDefaultRouteForRole(data.user.role) : "/schedule"),
    );
    router.refresh();
  }

  return {
    state: {
      username,
      password,
      error,
      loading,
    },
    actions: {
      setUsername,
      setPassword,
      submit,
    },
  };
}
