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
import type { NutriImcClassification, NutriPatientSex } from "../domain/types";
import {
  useNutriPage,
  type NutriAssessmentDraft,
  type NutriPatientDraft,
  type NutriTab,
} from "./hooks/useNutriPage";

const SEX_LABELS: Record<NutriPatientSex, string> = {
  FEMALE: "Feminino",
  MALE: "Masculino",
  OTHER: "Outro",
  NOT_INFORMED: "Nao informado",
};

const IMC_LABELS: Record<NutriImcClassification, string> = {
  UNDERWEIGHT: "Baixo peso",
  NORMAL: "Eutrofia",
  OVERWEIGHT: "Sobrepeso",
  OBESITY_I: "Obesidade I",
  OBESITY_II: "Obesidade II",
  OBESITY_III: "Obesidade III",
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

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Avaliacao nutricional
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Registre medidas, rotina e restricoes para o paciente selecionado.
              </Typography>
            </Box>

            <FormControl fullWidth>
              <InputLabel>Paciente</InputLabel>
              <Select
                label="Paciente"
                value={state.selectedPatientId}
                disabled={state.savingAssessment || state.activePatients.length === 0}
                onChange={(event) => actions.setSelectedPatientId(event.target.value)}
              >
                {state.activePatients.map((patient) => (
                  <MenuItem key={patient.id} value={patient.id}>
                    {patient.fullName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {state.activePatients.length === 0 ? (
              <Alert severity="info">
                Cadastre ou reative um paciente para registrar avaliacoes.
              </Alert>
            ) : (
              <>
                {renderAssessmentForm({
                  draft: state.assessmentDraft,
                  onChange: actions.setAssessmentDraft,
                  disabled: state.savingAssessment,
                })}

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    label={
                      state.assessmentImcPreview
                        ? `IMC: ${state.assessmentImcPreview.value} - ${
                            IMC_LABELS[state.assessmentImcPreview.classification]
                          }`
                        : "IMC: informe peso e altura"
                    }
                    color={state.assessmentImcPreview ? "primary" : "default"}
                  />
                  {state.selectedPatient && (
                    <Chip label={`Paciente: ${state.selectedPatient.fullName}`} />
                  )}
                </Stack>

                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={!state.canCreateAssessment || state.savingAssessment}
                  onClick={() => void actions.createAssessment()}
                >
                  Registrar avaliacao
                </Button>
              </>
            )}
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ overflow: "auto" }}>
          {state.loadingAssessments ? (
            <Stack alignItems="center" spacing={2} sx={{ py: 6 }}>
              <CircularProgress />
              <Typography color="text.secondary">Carregando avaliacoes...</Typography>
            </Stack>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>Objetivo</TableCell>
                  <TableCell>Medidas</TableCell>
                  <TableCell>IMC</TableCell>
                  <TableCell>Restricoes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {state.assessments.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell>
                      {new Date(`${assessment.date}T00:00:00`).toLocaleDateString(
                        "pt-BR",
                      )}
                    </TableCell>
                    <TableCell>{assessment.objective ?? "-"}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        Peso: {assessment.weightKg ? `${assessment.weightKg} kg` : "-"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Altura:{" "}
                        {assessment.heightCm ? `${assessment.heightCm} cm` : "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {assessment.imc
                        ? `${assessment.imc.value} - ${
                            IMC_LABELS[assessment.imc.classification]
                          }`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {[...assessment.allergies, ...assessment.intolerances]
                          .slice(0, 3)
                          .join(", ") || "-"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {state.selectedPatientId && state.assessments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Alert severity="info">
                        Nenhuma avaliacao registrada para este paciente.
                      </Alert>
                    </TableCell>
                  </TableRow>
                )}
                {!state.selectedPatientId && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Alert severity="info">
                        Selecione um paciente para ver o historico de avaliacoes.
                      </Alert>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Paper>

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

  function renderAssessmentForm(input: {
    draft: NutriAssessmentDraft;
    onChange: React.Dispatch<React.SetStateAction<NutriAssessmentDraft>>;
    disabled: boolean;
  }) {
    return (
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
          <TextField
            label="Data"
            type="date"
            value={input.draft.date}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({ ...prev, date: event.target.value }))
            }
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <TextField
            label="Objetivo"
            value={input.draft.objective}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({ ...prev, objective: event.target.value }))
            }
            fullWidth
          />
          <TextField
            label="Nivel de atividade"
            value={input.draft.activityLevel}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({
                ...prev,
                activityLevel: event.target.value,
              }))
            }
            fullWidth
          />
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
          <TextField
            label="Peso kg"
            type="number"
            value={input.draft.weightKg}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({ ...prev, weightKg: event.target.value }))
            }
            fullWidth
          />
          <TextField
            label="Altura cm"
            type="number"
            value={input.draft.heightCm}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({ ...prev, heightCm: event.target.value }))
            }
            fullWidth
          />
          <TextField
            label="Cintura cm"
            type="number"
            value={input.draft.waistCm}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({ ...prev, waistCm: event.target.value }))
            }
            fullWidth
          />
          <TextField
            label="Quadril cm"
            type="number"
            value={input.draft.hipCm}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({ ...prev, hipCm: event.target.value }))
            }
            fullWidth
          />
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
          <TextField
            label="Alergias"
            value={input.draft.allergies}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({ ...prev, allergies: event.target.value }))
            }
            fullWidth
          />
          <TextField
            label="Intolerancias"
            value={input.draft.intolerances}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({
                ...prev,
                intolerances: event.target.value,
              }))
            }
            fullWidth
          />
          <TextField
            label="Restricoes alimentares"
            value={input.draft.dietaryRestrictions}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({
                ...prev,
                dietaryRestrictions: event.target.value,
              }))
            }
            fullWidth
          />
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
          <TextField
            label="Medicamentos"
            value={input.draft.medications}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({ ...prev, medications: event.target.value }))
            }
            fullWidth
          />
          <TextField
            label="Suplementos"
            value={input.draft.supplements}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({ ...prev, supplements: event.target.value }))
            }
            fullWidth
          />
        </Stack>

        <TextField
          label="Rotina alimentar"
          value={input.draft.foodRoutineNotes}
          disabled={input.disabled}
          onChange={(event) =>
            input.onChange((prev) => ({
              ...prev,
              foodRoutineNotes: event.target.value,
            }))
          }
          minRows={2}
          multiline
          fullWidth
        />

        <TextField
          label="Notas clinicas"
          value={input.draft.clinicalNotes}
          disabled={input.disabled}
          onChange={(event) =>
            input.onChange((prev) => ({ ...prev, clinicalNotes: event.target.value }))
          }
          minRows={2}
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
