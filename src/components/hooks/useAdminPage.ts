"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import type {
  AuditLog,
  PublicUser,
  ScheduleHistoryDto,
  UserRole,
} from "../../lib/types";

export type AdminTab = "users" | "logs" | "scheduleHistory";

const currentDate = new Date();

export function useAdminPage() {
  const [tab, setTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [scheduleHistory, setScheduleHistory] = useState<ScheduleHistoryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [scheduleHistoryLoading, setScheduleHistoryLoading] = useState(false);
  const [logActionFilter, setLogActionFilter] = useState("");
  const [logUserFilter, setLogUserFilter] = useState("");
  const [logDateFrom, setLogDateFrom] = useState("");
  const [logDateTo, setLogDateTo] = useState("");
  const [historyYear, setHistoryYear] = useState(currentDate.getFullYear());
  const [historyMonth, setHistoryMonth] = useState(currentDate.getMonth() + 1);
  const [historyEmployeeId, setHistoryEmployeeId] = useState("");
  const [historyRoleId, setHistoryRoleId] = useState("");
  const [historyStatus, setHistoryStatus] = useState("");
  const [historyWeekday, setHistoryWeekday] = useState("");
  const [historyOnlySundays, setHistoryOnlySundays] = useState(false);
  const [historyOnlyHolidays, setHistoryOnlyHolidays] = useState(false);
  const [historyQuery, setHistoryQuery] = useState("");
  const [passwordDrafts, setPasswordDrafts] = useState<Record<string, string>>({});
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
    await Promise.all([loadUsers(), loadLogs(), loadScheduleHistory()]);
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

  async function loadScheduleHistory() {
    setScheduleHistoryLoading(true);
    const params = new URLSearchParams();
    params.set("year", String(historyYear));
    params.set("month", String(historyMonth));
    if (historyEmployeeId) params.set("employeeId", historyEmployeeId);
    if (historyRoleId) params.set("roleId", historyRoleId);
    if (historyStatus) params.set("status", historyStatus);
    if (historyWeekday) params.set("weekday", historyWeekday);
    if (historyOnlySundays) params.set("onlySundays", "true");
    if (historyOnlyHolidays) params.set("onlyHolidays", "true");
    if (historyQuery.trim()) params.set("q", historyQuery.trim());

    const response = await fetch(`/api/admin/schedule-history?${params.toString()}`);
    if (!response.ok) {
      toast.error("Nao foi possivel carregar o historico da escala.");
      setScheduleHistoryLoading(false);
      return;
    }

    const data = (await response.json()) as ScheduleHistoryDto;
    setScheduleHistory(data);
    setScheduleHistoryLoading(false);
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

  async function patchUser(
    id: string,
    patch: Partial<PublicUser> & { password?: string },
  ) {
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

  async function resetPassword(id: string) {
    const password = passwordDrafts[id] ?? "";
    if (password.length < 6) {
      toast.error("Informe uma senha com pelo menos 6 caracteres.");
      return;
    }

    await patchUser(id, { password });
    setPasswordDrafts((prev) => ({ ...prev, [id]: "" }));
  }

  return {
    state: {
      tab,
      users,
      logs,
      scheduleHistory,
      loading,
      scheduleHistoryLoading,
      logActions,
      logActionFilter,
      logUserFilter,
      logDateFrom,
      logDateTo,
      historyYear,
      historyMonth,
      historyEmployeeId,
      historyRoleId,
      historyStatus,
      historyWeekday,
      historyOnlySundays,
      historyOnlyHolidays,
      historyQuery,
      passwordDrafts,
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
      setHistoryYear,
      setHistoryMonth,
      setHistoryEmployeeId,
      setHistoryRoleId,
      setHistoryStatus,
      setHistoryWeekday,
      setHistoryOnlySundays,
      setHistoryOnlyHolidays,
      setHistoryQuery,
      setPasswordDraft: (id: string, value: string) =>
        setPasswordDrafts((prev) => ({ ...prev, [id]: value })),
      setDraft,
      loadLogs,
      loadScheduleHistory,
      createUser,
      patchUser,
      resetPassword,
    },
  };
}
