"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import type { AuditLog, PublicUser, UserRole } from "../../lib/types";

export type AdminTab = "users" | "logs";

export function useAdminPage() {
  const [tab, setTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logActionFilter, setLogActionFilter] = useState("");
  const [logUserFilter, setLogUserFilter] = useState("");
  const [logDateFrom, setLogDateFrom] = useState("");
  const [logDateTo, setLogDateTo] = useState("");
  const [draft, setDraft] = useState({
    username: "",
    displayName: "",
    password: "",
    role: "USER" as UserRole,
  });

  const logActions = useMemo(
    () => [...new Set(logs.map((log) => log.action))].sort(),
    [logs],
  );

  useEffect(() => {
    void loadAll();
    // Initial admin data load should run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadUsers(), loadLogs()]);
    setLoading(false);
  }

  async function loadUsers() {
    const response = await fetch("/api/admin/users");
    if (!response.ok) {
      toast.error("Nao foi possivel carregar usuarios.");
      return;
    }
    const data = (await response.json()) as { users: PublicUser[] };
    setUsers(data.users);
  }

  async function loadLogs() {
    const params = new URLSearchParams();
    if (logActionFilter.trim()) params.set("action", logActionFilter.trim());
    if (logUserFilter.trim()) params.set("username", logUserFilter.trim());
    if (logDateFrom) params.set("from", logDateFrom);
    if (logDateTo) params.set("to", logDateTo);

    const query = params.toString();
    const response = await fetch(`/api/admin/logs${query ? `?${query}` : ""}`);
    if (!response.ok) {
      toast.error("Nao foi possivel carregar logs.");
      return;
    }
    const data = (await response.json()) as { logs: AuditLog[] };
    setLogs(data.logs);
  }

  async function createUser() {
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      toast.error(data?.error ?? "Nao foi possivel criar usuario.");
      return;
    }

    setDraft({ username: "", displayName: "", password: "", role: "USER" });
    toast.success("Usuario criado. Repasse login e senha inicial para a pessoa.");
    await loadUsers();
    await loadLogs();
  }

  async function patchUser(id: string, patch: Partial<PublicUser>) {
    const response = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (!response.ok) {
      toast.error("Nao foi possivel atualizar usuario.");
      return;
    }

    toast.success("Usuario atualizado.");
    await loadUsers();
    await loadLogs();
  }

  return {
    state: {
      tab,
      users,
      logs,
      loading,
      logActions,
      logActionFilter,
      logUserFilter,
      logDateFrom,
      logDateTo,
      draft,
      canCreateUser:
        Boolean(draft.username) &&
        Boolean(draft.displayName) &&
        draft.password.length >= 6,
    },
    actions: {
      setTab,
      setLogActionFilter,
      setLogUserFilter,
      setLogDateFrom,
      setLogDateTo,
      setDraft,
      loadLogs,
      createUser,
      patchUser,
    },
  };
}
