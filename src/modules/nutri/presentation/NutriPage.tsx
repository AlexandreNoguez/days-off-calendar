"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
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
import EditIcon from "@mui/icons-material/Edit";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import type { NutriPatientSex } from "../domain/types";
import { useNutriPage, type NutriPatientDraft, type NutriTab } from "./hooks/useNutriPage";

const SEX_LABELS: Record<NutriPatientSex, string> = {
  FEMALE: "Feminino",
  MALE: "Masculino",
  OTHER: "Outro",
  NOT_INFORMED: "Nao informado",
};

export function NutriPage() {
  const { state, actions } = useNutriPage();

  return (
    <Stack spacing={3}>
      <Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <RestaurantMenuIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>
            Modulo Nutri
          </Typography>
          <Chip size="small" label="NUTRI" color="success" />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          Area dedicada a pacientes, planos alimentares, receitas, fichas tecnicas
          e cardapios.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(3, minmax(0, 1fr))",
          },
        }}
      >
        {state.summary.map((item) => (
          <Paper key={item.label} variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {item.label}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ my: 0.5 }}>
              {item.value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {item.description}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Tabs value={state.tab} onChange={(_, value: NutriTab) => actions.setTab(value)}>
        <Tab value="patients" label="Pacientes" />
        <Tab value="mealPlans" label="Planos" />
        <Tab value="recipes" label="Receitas" />
        <Tab value="menus" label="Cardapios" />
      </Tabs>

      {state.tab === "patients" ? renderPatients() : renderPlannedArea()}
    </Stack>
  );

  function renderPatients() {
    return (
      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              Novo paciente
            </Typography>
            {renderPatientForm({
              draft: state.draft,
              onChange: actions.setDraft,
              disabled: state.savingPatient,
            })}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              disabled={!state.canCreatePatient || state.savingPatient}
              onClick={() => void actions.createPatient()}
            >
              Cadastrar paciente
            </Button>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              <TextField
                label="Buscar paciente"
                value={state.query}
                onChange={(event) => actions.setQuery(event.target.value)}
                fullWidth
              />
              <Button
                variant="outlined"
                startIcon={<SearchIcon />}
                onClick={() => void actions.loadPatients()}
              >
                Buscar
              </Button>
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={`Ativos: ${state.patientSummary.active}`} />
              <Chip label={`Arquivados: ${state.patientSummary.archived}`} />
              <Chip label={`Total: ${state.patientSummary.total}`} />
            </Stack>
          </Stack>
        </Paper>

        {state.editingPatientId && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight={700}>
                Editar paciente
              </Typography>
              {renderPatientForm({
                draft: state.editDraft,
                onChange: actions.setEditDraft,
                disabled: state.savingPatient,
              })}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={!state.canUpdatePatient || state.savingPatient}
                  onClick={() => void actions.updatePatient()}
                >
                  Salvar alteracoes
                </Button>
                <Button
                  variant="outlined"
                  disabled={state.savingPatient}
                  onClick={actions.cancelEditingPatient}
                >
                  Cancelar
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}

        <Paper variant="outlined" sx={{ overflow: "auto" }}>
          {state.loadingPatients ? (
            <Stack alignItems="center" spacing={2} sx={{ py: 6 }}>
              <CircularProgress />
              <Typography color="text.secondary">Carregando pacientes...</Typography>
            </Stack>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Perfil</TableCell>
                  <TableCell>Contato</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Atualizado em</TableCell>
                  <TableCell>Acoes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {state.patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {patient.fullName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {patient.birthDate
                          ? new Date(`${patient.birthDate}T00:00:00`).toLocaleDateString(
                              "pt-BR",
                            )
                          : "Data de nascimento nao informada"}
                      </Typography>
                    </TableCell>
                    <TableCell>{SEX_LABELS[patient.sex]}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{patient.phone ?? "-"}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {patient.email ?? "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Switch
                          checked={patient.active}
                          disabled={state.savingPatient}
                          onChange={(event) =>
                            void actions.setPatientActive(patient.id, event.target.checked)
                          }
                        />
                        <Chip
                          size="small"
                          label={patient.active ? "Ativo" : "Arquivado"}
                          color={patient.active ? "success" : "default"}
                        />
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {new Date(patient.updatedAt).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        disabled={state.savingPatient}
                        onClick={() => actions.startEditingPatient(patient)}
                      >
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {state.patients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Alert severity="info">
                        Nenhum paciente encontrado para os filtros atuais.
                      </Alert>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Paper>
      </Stack>
    );
  }

  function renderPatientForm(input: {
    draft: NutriPatientDraft;
    onChange: React.Dispatch<React.SetStateAction<NutriPatientDraft>>;
    disabled: boolean;
  }) {
    return (
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
          <TextField
            label="Nome completo"
            value={input.draft.fullName}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({ ...prev, fullName: event.target.value }))
            }
            fullWidth
          />
          <TextField
            label="Nascimento"
            type="date"
            value={input.draft.birthDate}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({ ...prev, birthDate: event.target.value }))
            }
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Sexo</InputLabel>
            <Select
              label="Sexo"
              value={input.draft.sex}
              disabled={input.disabled}
              onChange={(event) =>
                input.onChange((prev) => ({
                  ...prev,
                  sex: event.target.value as NutriPatientSex,
                }))
              }
            >
              {Object.entries(SEX_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
          <TextField
            label="Telefone"
            value={input.draft.phone}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({ ...prev, phone: event.target.value }))
            }
            fullWidth
          />
          <TextField
            label="Email"
            type="email"
            value={input.draft.email}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({ ...prev, email: event.target.value }))
            }
            fullWidth
          />
        </Stack>

        <TextField
          label="Observacoes iniciais"
          value={input.draft.notes}
          disabled={input.disabled}
          onChange={(event) =>
            input.onChange((prev) => ({ ...prev, notes: event.target.value }))
          }
          minRows={3}
          multiline
          fullWidth
        />
      </Stack>
    );
  }

  function renderPlannedArea() {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          Proximos passos do modulo
        </Typography>
        <Divider sx={{ my: 1.5 }} />
        <List dense disablePadding>
          {state.firstSteps.map((step, index) => (
            <ListItem key={step} disableGutters>
              <ListItemText
                primary={`${index + 1}. ${step}`}
                primaryTypographyProps={{ variant: "body2" }}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    );
  }
}
