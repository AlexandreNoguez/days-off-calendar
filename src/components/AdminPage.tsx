"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import { toast } from "react-toastify";
import type { AuditLog, PublicUser, UserRole } from "../lib/types";

type AdminTab = "users" | "logs";

export function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logActionFilter, setLogActionFilter] = useState("");
  const [logUserFilter, setLogUserFilter] = useState("");
  const [draft, setDraft] = useState({
    username: "",
    displayName: "",
    password: "",
    role: "USER" as UserRole,
  });

  useEffect(() => {
    void loadAll();
    // The initial load should run once; filters are applied by the Atualizar button.
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
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
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

  if (loading) {
    return (
      <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
        <CircularProgress />
        <Typography color="text.secondary">Carregando area administrativa...</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h5" fontWeight={700}>
          Administrador
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gerencie usuarios e acompanhe logins e acoes realizadas no sistema.
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_, value: AdminTab) => setTab(value)}>
        <Tab value="users" label="Usuarios" />
        <Tab value="logs" label="Logs" />
      </Tabs>

      {tab === "users" ? renderUsers() : renderLogs()}
    </Stack>
  );

  function renderUsers() {
    return (
      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              Novo usuario
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              <TextField
                label="Nome"
                value={draft.displayName}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, displayName: event.target.value }))
                }
                fullWidth
              />
              <TextField
                label="Login"
                value={draft.username}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, username: event.target.value }))
                }
                fullWidth
              />
              <TextField
                label="Senha inicial"
                type="password"
                value={draft.password}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, password: event.target.value }))
                }
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Perfil</InputLabel>
                <Select
                  label="Perfil"
                  value={draft.role}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, role: event.target.value as UserRole }))
                  }
                >
                  <MenuItem value="USER">USER</MenuItem>
                  <MenuItem value="ADMIN">ADMIN</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={createUser}
              disabled={!draft.username || !draft.displayName || draft.password.length < 6}
            >
              Criar usuario
            </Button>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ overflow: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Login</TableCell>
                <TableCell>Perfil</TableCell>
                <TableCell>Ativo</TableCell>
                <TableCell>Ultimo login</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.displayName}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={user.role}
                      color={user.role === "ADMIN" ? "primary" : "default"}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={user.active}
                      onChange={(event) =>
                        void patchUser(user.id, { active: event.target.checked })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString("pt-BR")
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Stack>
    );
  }

  function renderLogs() {
    const actions = [...new Set(logs.map((log) => log.action))].sort();
    return (
      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <TextField
              label="Usuario"
              value={logUserFilter}
              onChange={(event) => setLogUserFilter(event.target.value)}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Acao</InputLabel>
              <Select
                label="Acao"
                value={logActionFilter}
                onChange={(event) => setLogActionFilter(event.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {actions.map((action) => (
                  <MenuItem key={action} value={action}>
                    {action}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadLogs}>
              Atualizar
            </Button>
          </Stack>
        </Paper>

        <Alert severity="info">Mostrando ate 200 eventos mais recentes.</Alert>

        <Paper variant="outlined" sx={{ overflow: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell>Acao</TableCell>
                <TableCell>Entidade</TableCell>
                <TableCell>Metadados</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.createdAt).toLocaleString("pt-BR")}</TableCell>
                  <TableCell>{log.usernameSnapshot ?? "-"}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>
                    {log.entityType ?? "-"}
                    {log.entityId ? ` / ${log.entityId}` : ""}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {log.metadata ? JSON.stringify(log.metadata) : "-"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Stack>
    );
  }
}
