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
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import type { RuleConfig } from "../domain/types/rules";
import {
  useWorkspacePage,
  type CadastroTab,
  type CustomRuleTemplate,
  type WorkspaceSection,
} from "./hooks/useWorkspacePage";

export function WorkspacePage({ section }: { section: WorkspaceSection }) {
  const { state, actions } = useWorkspacePage();

  if (state.loading) {
    return (
      <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
        <CircularProgress />
        <Typography color="text.secondary">Carregando dados da escala...</Typography>
      </Stack>
    );
  }

  if (!state.data) {
    return <Alert severity="error">Nao foi possivel carregar os dados.</Alert>;
  }

  const appState = state.data;

  function renderHeader(title: string, description: string) {
    return (
      <Stack spacing={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip label={`Periodo: ${state.header.periodLabel}`} />
          <Chip label={`Colaboradores: ${state.header.employeeCount}`} />
          <Chip
            label={`HARD: ${state.header.hardConflictCount}`}
            color={state.header.hardConflictCount > 0 ? "error" : "success"}
          />
          <Chip
            label={`SOFT: ${state.header.softConflictCount}`}
            color={state.header.softConflictCount > 0 ? "warning" : "default"}
          />
          {state.saving && <Chip label="Salvando..." color="primary" />}
        </Stack>
      </Stack>
    );
  }

  function renderSetup() {
    return (
      <Stack spacing={2}>
        {renderHeader("Setup", "Escolha o mes/ano e marque os feriados do periodo.")}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Mes</InputLabel>
              <Select
                label="Mes"
                value={appState.plan.month}
                onChange={(event) => actions.changeMonth(Number(event.target.value))}
              >
                {state.months.map((month, index) => (
                  <MenuItem key={month} value={index + 1}>
                    {month}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Ano"
              type="number"
              value={appState.plan.year}
              onChange={(event) => actions.changeYear(Number(event.target.value))}
              fullWidth
            />
          </Stack>
        </Paper>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
          {state.weekdayLabels.map((label) => (
            <Typography key={label} variant="caption" color="text.secondary" sx={{ px: 1 }}>
              {label}
            </Typography>
          ))}
          {state.setupCells.map((cell) => {
            if (cell.kind === "blank") return <Box key={cell.key} sx={{ minHeight: 64 }} />;
            return (
              <Button
                key={cell.key}
                variant={cell.isHoliday ? "contained" : "outlined"}
                color={cell.isHoliday ? "primary" : cell.weekday === 0 ? "warning" : "inherit"}
                onClick={() => actions.toggleHoliday(cell.dateISO)}
                sx={{ minHeight: 64, justifyContent: "flex-start", alignItems: "flex-start" }}
              >
                <Stack alignItems="flex-start">
                  <Typography variant="subtitle2">{cell.dayNumber}</Typography>
                  <Typography variant="caption">
                    {cell.isHoliday ? "Feriado" : cell.weekdayLabel}
                  </Typography>
                </Stack>
              </Button>
            );
          })}
        </Box>
      </Stack>
    );
  }

  function renderCadastros() {
    return (
      <Stack spacing={2}>
        {renderHeader("Cadastros", "Gerencie colaboradores, cargos e regras da escala.")}
        <Tabs
          value={state.cadastroTab}
          onChange={(_, value: CadastroTab) => actions.setCadastroTab(value)}
        >
          <Tab value="employees" label="Colaboradores" />
          <Tab value="roles" label="Cargos" />
          <Tab value="rules" label="Regras" />
        </Tabs>
        {state.cadastroTab === "employees" && renderEmployees()}
        {state.cadastroTab === "roles" && renderRoles()}
        {state.cadastroTab === "rules" && renderRules()}
      </Stack>
    );
  }

  function renderRoles() {
    return (
      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              label="Nome do cargo"
              value={state.roleDraft}
              onChange={(event) => actions.setRoleDraft(event.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={actions.createRole}
              disabled={!state.canCreateRole}
            >
              Criar
            </Button>
          </Stack>
        </Paper>
        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Cargo</TableCell>
                <TableCell align="right">Acoes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appState.roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>{role.name}</TableCell>
                  <TableCell align="right">
                    <Button
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => actions.deleteRole(role.id)}
                    >
                      Remover
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Stack>
    );
  }

  function renderEmployees() {
    return (
      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              <TextField
                label="Nome"
                value={state.employeeDraft.name}
                onChange={(event) =>
                  actions.updateEmployeeDraft({ name: event.target.value })
                }
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Cargo</InputLabel>
                <Select
                  label="Cargo"
                  value={state.employeeDraft.roleId}
                  onChange={(event) =>
                    actions.updateEmployeeDraft({ roleId: event.target.value })
                  }
                >
                  {appState.roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <TextField
              label="Observacoes"
              value={state.employeeDraft.notes}
              onChange={(event) => actions.updateEmployeeDraft({ notes: event.target.value })}
              fullWidth
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={state.employeeDraft.alwaysOffSunday}
                    onChange={(event) =>
                      actions.updateEmployeeDraft({
                        alwaysOffSunday: event.target.checked,
                      })
                    }
                  />
                }
                label="Sempre folga domingo"
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                disabled={!state.canCreateEmployee}
                onClick={actions.createEmployee}
              >
                Criar colaborador
              </Button>
            </Stack>
          </Stack>
        </Paper>
        <Paper variant="outlined" sx={{ overflow: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Cargo</TableCell>
                <TableCell>Domingo fixo</TableCell>
                <TableCell align="right">Acoes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {state.scheduleRows.map((row) => (
                <TableRow key={row.employee.id}>
                  <TableCell>{row.employee.name}</TableCell>
                  <TableCell>{row.roleName}</TableCell>
                  <TableCell>{row.employee.alwaysOffSunday ? "Sim" : "Nao"}</TableCell>
                  <TableCell align="right">
                    <Button
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => actions.deleteEmployee(row.employee.id)}
                    >
                      Remover
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Stack>
    );
  }

  function renderRules() {
    return (
      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              Nova regra personalizada
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              <FormControl fullWidth>
                <InputLabel>Template</InputLabel>
                <Select
                  label="Template"
                  value={state.ruleDraft.template}
                  onChange={(event) =>
                    actions.updateRuleDraft({
                      template: event.target.value as CustomRuleTemplate,
                    })
                  }
                >
                  <MenuItem value="pair_cannot_both_off">Par nao folga junto</MenuItem>
                  <MenuItem value="substitution_required">Substituicao obrigatoria</MenuItem>
                  <MenuItem value="role_one_off_each_sunday">Folgas por cargo no domingo</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Severidade</InputLabel>
                <Select
                  label="Severidade"
                  value={state.ruleDraft.severity}
                  onChange={(event) =>
                    actions.updateRuleDraft({
                      severity: event.target.value as RuleConfig["severity"],
                    })
                  }
                >
                  <MenuItem value="HARD">HARD</MenuItem>
                  <MenuItem value="SOFT">SOFT</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            {state.ruleDraft.template === "pair_cannot_both_off" && (
              <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                <FormControl fullWidth>
                  <InputLabel>Colaborador A</InputLabel>
                  <Select
                    label="Colaborador A"
                    value={state.ruleDraft.employeeAId}
                    onChange={(event) =>
                      actions.updateRuleDraft({ employeeAId: event.target.value })
                    }
                  >
                    {appState.employees.map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Colaborador B</InputLabel>
                  <Select
                    label="Colaborador B"
                    value={state.ruleDraft.employeeBId}
                    onChange={(event) =>
                      actions.updateRuleDraft({ employeeBId: event.target.value })
                    }
                  >
                    {appState.employees.map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            )}

            {state.ruleDraft.template === "substitution_required" && (
              <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                <FormControl fullWidth>
                  <InputLabel>Substituto</InputLabel>
                  <Select
                    label="Substituto"
                    value={state.ruleDraft.substituteId}
                    onChange={(event) =>
                      actions.updateRuleDraft({ substituteId: event.target.value })
                    }
                  >
                    {appState.employees.map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Substituidos</InputLabel>
                  <Select
                    multiple
                    label="Substituidos"
                    value={state.ruleDraft.substitutedIds}
                    onChange={(event) =>
                      actions.updateRuleSubstitutedIds(
                        event.target.value as string | string[],
                      )
                    }
                  >
                    {appState.employees.map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            )}

            {state.ruleDraft.template === "role_one_off_each_sunday" && (
              <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                <FormControl fullWidth>
                  <InputLabel>Cargo</InputLabel>
                  <Select
                    label="Cargo"
                    value={state.ruleDraft.roleId}
                    onChange={(event) =>
                      actions.updateRuleDraft({ roleId: event.target.value })
                    }
                  >
                    {appState.roles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Folgas por domingo"
                  type="number"
                  value={state.ruleDraft.sundayOffCount}
                  onChange={(event) =>
                    actions.updateRuleDraft({
                      sundayOffCount: Number(event.target.value),
                    })
                  }
                  fullWidth
                />
              </Stack>
            )}

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={actions.createCustomRule}
              disabled={!state.canCreateRule}
            >
              Criar regra
            </Button>
          </Stack>
        </Paper>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button variant="outlined" onClick={actions.restoreDefaultRules}>
            Restaurar regras padrao
          </Button>
        </Stack>

        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Ativa</TableCell>
                <TableCell>Regra</TableCell>
                <TableCell>Severidade</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appState.rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <Switch
                      checked={rule.enabled}
                      onChange={(event) =>
                        actions.toggleRule(rule.id, event.target.checked)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {rule.title}
                    </Typography>
                    {rule.description && (
                      <Typography variant="caption" color="text.secondary">
                        {rule.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={rule.severity}
                      color={rule.severity === "HARD" ? "error" : "warning"}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Stack>
    );
  }

  function renderSchedule() {
    return (
      <Stack spacing={2}>
        {renderHeader("Editor da escala", "Monte a escala manualmente ou gere uma sugestao.")}
        {state.hardConflicts.length > 0 && (
          <Alert severity="error">Existem conflitos HARD pendentes na escala.</Alert>
        )}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button
            variant="contained"
            startIcon={<AutoAwesomeIcon />}
            onClick={actions.generateSuggestion}
          >
            Gerar sugestao
          </Button>
          <Button
            variant="outlined"
            startIcon={<UndoIcon />}
            disabled={!state.canUndo}
            onClick={actions.undo}
          >
            Undo
          </Button>
          <Button
            variant="outlined"
            startIcon={<RedoIcon />}
            disabled={!state.canRedo}
            onClick={actions.redo}
          >
            Redo
          </Button>
        </Stack>

        {state.validation.conflicts.length > 0 && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Conflitos
            </Typography>
            <Stack spacing={1}>
              {state.validation.conflicts.slice(0, 12).map((conflict) => (
                <Alert
                  key={conflict.id}
                  severity={conflict.severity === "HARD" ? "error" : "warning"}
                >
                  <strong>{conflict.dateISO}</strong> - {conflict.message}
                </Alert>
              ))}
            </Stack>
          </Paper>
        )}

        <Paper variant="outlined" sx={{ overflow: "auto" }}>
          <Table size="small" sx={{ minWidth: 1100 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ position: "sticky", left: 0, bgcolor: "background.paper" }}>
                  Colaborador
                </TableCell>
                {state.days.map((day) => (
                  <TableCell key={day.dateISO} align="center">
                    <Typography variant="caption" color="text.secondary">
                      {day.weekdayLabel}
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {day.dayNumber}
                    </Typography>
                  </TableCell>
                ))}
                <TableCell align="center">Folgas</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {state.scheduleRows.map((row) => (
                <TableRow key={row.employee.id}>
                  <TableCell sx={{ position: "sticky", left: 0, bgcolor: "background.paper" }}>
                    <Typography variant="body2" fontWeight={700}>
                      {row.employee.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.roleName}
                    </Typography>
                  </TableCell>
                  {row.days.map((day) => (
                    <TableCell key={`${row.employee.id}_${day.dateISO}`} align="center">
                      <Button
                        size="small"
                        variant={day.isOff ? "contained" : "outlined"}
                        color={day.isOff ? "warning" : "primary"}
                        sx={{ width: 92, minWidth: 92 }}
                        onClick={() => actions.toggleCell(row.employee.id, day.dateISO)}
                      >
                        {day.isOff ? "Folga" : "Trabalho"}
                      </Button>
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

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Historico de alteracoes
          </Typography>
          <Stack spacing={1}>
            {state.changeLogRows.map((entry) => (
              <Box key={entry.id}>
                <Typography variant="caption" color="text.secondary">
                  {entry.atLabel}
                </Typography>
                <Typography variant="body2">{entry.message}</Typography>
              </Box>
            ))}
          </Stack>
        </Paper>
      </Stack>
    );
  }

  function renderExport() {
    return (
      <Stack spacing={2}>
        {renderHeader("Exportar", "Gere a planilha XLSX do periodo atual.")}
        {state.hardConflicts.length > 0 && (
          <Alert severity="warning">A exportacao esta disponivel, mas ha conflitos HARD.</Alert>
        )}
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          disabled={!state.canExport}
          onClick={actions.exportXlsx}
        >
          Exportar XLSX
        </Button>
      </Stack>
    );
  }

  const content = {
    setup: renderSetup,
    cadastros: renderCadastros,
    schedule: renderSchedule,
    export: renderExport,
  }[section];

  return content();
}
