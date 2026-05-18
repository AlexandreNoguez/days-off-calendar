"use client";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
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

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

const PUBLICATION_LABELS = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicada",
  CLOSED: "Fechada",
} as const;

const PUBLICATION_COLORS = {
  DRAFT: "default",
  PUBLISHED: "success",
  CLOSED: "secondary",
} as const;

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
        <Tab value="scheduleHistory" label="Historico da escala" />
      </Tabs>

      {renderCurrentTab()}
    </Stack>
  );

  function renderCurrentTab() {
    if (state.tab === "users") return renderUsers();
    if (state.tab === "logs") return renderLogs();
    return renderScheduleHistory();
  }

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
              {/* Atualizar */}
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

  function renderScheduleHistory() {
    const history = state.scheduleHistory;
    const tableMinWidth = `${Math.max(900, 260 + (history?.days.length ?? 0) * 86)}px`;

    return (
      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              <TextField
                label="Ano"
                type="number"
                value={state.historyYear}
                onChange={(event) => actions.setHistoryYear(Number(event.target.value))}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Mes</InputLabel>
                <Select
                  label="Mes"
                  value={state.historyMonth}
                  onChange={(event) => actions.setHistoryMonth(Number(event.target.value))}
                >
                  {MONTHS.map((month, index) => (
                    <MenuItem key={month} value={index + 1}>
                      {month}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Colaborador</InputLabel>
                <Select
                  label="Colaborador"
                  value={state.historyEmployeeId}
                  onChange={(event) => actions.setHistoryEmployeeId(event.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {history?.employees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Cargo</InputLabel>
                <Select
                  label="Cargo"
                  value={state.historyRoleId}
                  onChange={(event) => actions.setHistoryRoleId(event.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {history?.roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={state.historyStatus}
                  onChange={(event) => actions.setHistoryStatus(event.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="OFF">Folga</MenuItem>
                  <MenuItem value="WORK">Trabalho</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Dia da semana</InputLabel>
                <Select
                  label="Dia da semana"
                  value={state.historyWeekday}
                  onChange={(event) => actions.setHistoryWeekday(event.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {WEEKDAYS.map((weekday, index) => (
                    <MenuItem key={weekday} value={String(index)}>
                      {weekday}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Buscar nome"
                value={state.historyQuery}
                onChange={(event) => actions.setHistoryQuery(event.target.value)}
                fullWidth
              />
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => void actions.loadScheduleHistory()}
                disabled={state.scheduleHistoryLoading}
              >
                {/* Atualizar */}
              </Button>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={state.historyOnlySundays}
                    onChange={(event) => actions.setHistoryOnlySundays(event.target.checked)}
                  />
                }
                label="Somente domingos"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={state.historyOnlyHolidays}
                    onChange={(event) => actions.setHistoryOnlyHolidays(event.target.checked)}
                  />
                }
                label="Somente feriados"
              />
            </Stack>
          </Stack>
        </Paper>

        {state.scheduleHistoryLoading && (
          <Alert severity="info">Carregando historico da escala...</Alert>
        )}

        {history?.selectedPeriod && (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label={`Periodo: ${String(history.selectedPeriod.month).padStart(2, "0")}/${history.selectedPeriod.year}`}
            />
            <Chip label={`Colaboradores: ${history.summary.visibleEmployeeCount}`} />
            <Chip label={`Dias: ${history.summary.dayCount}`} />
            <Chip label={`Folgas: ${history.summary.offCount}`} color="warning" />
            <Chip label={`Trabalho: ${history.summary.workCount}`} color="primary" />
            <Chip
              label={`Status: ${PUBLICATION_LABELS[history.selectedPeriod.publication.status]}`}
              color={PUBLICATION_COLORS[history.selectedPeriod.publication.status]}
            />
          </Stack>
        )}

        {history && history.rows.length === 0 && (
          <Alert severity="warning">
            Nenhuma escala encontrada para os filtros selecionados.
          </Alert>
        )}

        {history && history.rows.length > 0 && (
          <>
            <Paper variant="outlined" sx={{ overflow: "auto" }}>
              <Table size="small" sx={{ minWidth: tableMinWidth }}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{ position: "sticky", left: 0, bgcolor: "background.paper" }}
                    >
                      Colaborador
                    </TableCell>
                    {history.days.map((day) => (
                      <TableCell key={day.dateISO} align="center">
                        <Typography variant="caption" color="text.secondary">
                          {day.weekdayLabel}
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {day.dayNumber}
                        </Typography>
                        {day.isHoliday && (
                          <Typography variant="caption" color="warning.main">
                            Feriado
                          </Typography>
                        )}
                      </TableCell>
                    ))}
                    <TableCell align="center">Folgas</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell
                        sx={{ position: "sticky", left: 0, bgcolor: "background.paper" }}
                      >
                        <Typography variant="body2" fontWeight={700}>
                          {row.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.roleName}
                        </Typography>
                      </TableCell>
                      {row.days.map((day) => (
                        <TableCell key={`${row.id}_${day.dateISO}`} align="center">
                          <Chip
                            size="small"
                            label={day.status === "OFF" ? "Folga" : "Trab."}
                            color={day.status === "OFF" ? "warning" : "primary"}
                            variant={day.status === "OFF" ? "filled" : "outlined"}
                          />
                        </TableCell>
                      ))}
                      <TableCell align="center">
                        <Chip
                          label={row.offCount}
                          size="small"
                          color={row.offCount > 0 ? "warning" : "default"}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>

            <Paper variant="outlined" sx={{ overflow: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Colaborador</TableCell>
                    <TableCell>Cargo</TableCell>
                    <TableCell align="center">Folgas</TableCell>
                    <TableCell align="center">Trabalho</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.rows.map((row) => (
                    <TableRow key={`${row.id}_summary`}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.roleName}</TableCell>
                      <TableCell align="center">{row.offCount}</TableCell>
                      <TableCell align="center">{row.workCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Alteracoes do periodo
              </Typography>
              <Stack spacing={1}>
                {history.changeLog.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Sem alteracoes registradas para este periodo.
                  </Typography>
                )}
                {history.changeLog.slice(0, 12).map((entry) => (
                  <Box key={entry.id}>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(entry.at).toLocaleString("pt-BR")}
                    </Typography>
                    <Typography variant="body2">{entry.message}</Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </>
        )}
      </Stack>
    );
  }
}
