"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      setError(data?.error ?? "Nao foi possivel entrar.");
      return;
    }

    router.replace(searchParams.get("next") || "/schedule");
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
