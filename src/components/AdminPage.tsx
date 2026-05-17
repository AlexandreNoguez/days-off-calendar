"use client";

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
import { useAdminPage, type AdminTab } from "./hooks/useAdminPage";
import type { UserRole } from "../lib/types";

export function AdminPage() {
  const { state, actions } = useAdminPage();

  if (state.loading) {
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

      <Tabs
        value={state.tab}
        onChange={(_, value: AdminTab) => actions.setTab(value)}
      >
        <Tab value="users" label="Usuarios" />
        <Tab value="logs" label="Logs" />
      </Tabs>

      {state.tab === "users" ? renderUsers() : renderLogs()}
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
                value={state.draft.displayName}
                onChange={(event) =>
                  actions.setDraft((prev) => ({ ...prev, displayName: event.target.value }))
                }
                fullWidth
              />
              <TextField
                label="Login"
                value={state.draft.username}
                onChange={(event) =>
                  actions.setDraft((prev) => ({ ...prev, username: event.target.value }))
                }
                fullWidth
              />
              <TextField
                label="Senha inicial"
                type="password"
                value={state.draft.password}
                onChange={(event) =>
                  actions.setDraft((prev) => ({ ...prev, password: event.target.value }))
                }
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Perfil</InputLabel>
                <Select
                  label="Perfil"
                  value={state.draft.role}
                  onChange={(event) =>
                    actions.setDraft((prev) => ({
                      ...prev,
                      role: event.target.value as UserRole,
                    }))
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
              onClick={() => void actions.createUser()}
              disabled={!state.canCreateUser}
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
              {state.users.map((user) => (
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
                        void actions.patchUser(user.id, { active: event.target.checked })
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
    return (
      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <TextField
              label="Usuario"
              value={state.logUserFilter}
              onChange={(event) => actions.setLogUserFilter(event.target.value)}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Acao</InputLabel>
              <Select
                label="Acao"
                value={state.logActionFilter}
                onChange={(event) => actions.setLogActionFilter(event.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {state.logActions.map((action) => (
                  <MenuItem key={action} value={action}>
                    {action}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="De"
              type="date"
              value={state.logDateFrom}
              onChange={(event) => actions.setLogDateFrom(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField
              label="Ate"
              type="date"
              value={state.logDateTo}
              onChange={(event) => actions.setLogDateTo(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => void actions.loadLogs()}
            >
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
              {state.logs.map((log) => (
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
