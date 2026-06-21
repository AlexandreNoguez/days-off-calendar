"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
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
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PrintIcon from "@mui/icons-material/Print";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import type {
  NutriFoodSource,
  NutriImcClassification,
  NutriMealPlanStatus,
  NutriPatientSex,
  NutriRecipeStatus,
  NutriRestaurantMenuStatus,
} from "../domain/types";
import { NutriLoadingState } from "./components/NutriLoadingState";
import { NutriMetricGrid } from "./components/NutriMetricGrid";
import { NutriPageHeader } from "./components/NutriPageHeader";
import { NutriSectionCard } from "./components/NutriSectionCard";
import { NutriWorkflowNotices } from "./components/NutriWorkflowNotices";
import {
  useNutriPage,
  type NutriAssessmentDraft,
  type NutriDemoSeedKind,
  type NutriFoodDraft,
  type NutriPatientDraft,
  type NutriRecipeDraft,
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

const FOOD_SOURCE_LABELS: Record<NutriFoodSource, string> = {
  MANUAL: "Manual",
  LABEL: "Rotulo",
  TACO: "TACO",
  IBGE: "IBGE",
};

const MEAL_PLAN_STATUS_LABELS: Record<NutriMealPlanStatus, string> = {
  DRAFT: "Rascunho",
  APPROVED: "Aprovado",
  ARCHIVED: "Arquivado",
};

const RECIPE_STATUS_LABELS: Record<NutriRecipeStatus, string> = {
  DRAFT: "Rascunho",
  APPROVED: "Aprovada",
  ARCHIVED: "Arquivada",
};

const RESTAURANT_MENU_STATUS_LABELS: Record<NutriRestaurantMenuStatus, string> = {
  DRAFT: "Rascunho",
  APPROVED: "Aprovado",
  ARCHIVED: "Arquivado",
};

export function NutriPage() {
  const { state, actions } = useNutriPage();

  return (
    <Stack spacing={3}>
      <NutriPageHeader
        title="Modulo Nutri"
        badgeLabel="NUTRI"
        description="Area dedicada a pacientes, planos alimentares, receitas, fichas tecnicas e cardapios."
      />

      <NutriMetricGrid items={state.summary} />

      <Paper variant="outlined" sx={{ borderRadius: 2, px: 2, py: 0.5 }}>
        <Tabs
          value={state.tab}
          onChange={(_, value: NutriTab) => actions.setTab(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab value="patients" label="Pacientes" />
          <Tab value="foods" label="Alimentos" />
          <Tab value="mealPlans" label="Planos" />
          <Tab value="recipes" label="Receitas" />
          <Tab value="menus" label="Cardapios" />
        </Tabs>
      </Paper>

      <NutriWorkflowNotices notices={state.workflowNotices} />

      {state.tab === "patients" && renderPatients()}
      {state.tab === "foods" && renderFoods()}
      {state.tab === "mealPlans" && renderMealPlans()}
      {state.tab === "recipes" && renderRecipes()}
      {state.tab === "menus" && renderMenus()}
      {state.tab !== "patients" &&
        state.tab !== "foods" &&
        state.tab !== "mealPlans" &&
        state.tab !== "recipes" &&
        state.tab !== "menus" &&
        renderPlannedArea()}
    </Stack>
  );

  function renderPatients() {
    return (
      <Stack spacing={2}>
        {renderSeedButton("patients", "Seed 5 pacientes")}

        <NutriSectionCard title="Novo paciente">
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
        </NutriSectionCard>

        <NutriSectionCard>
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
        </NutriSectionCard>

        {state.editingPatientId && (
          <NutriSectionCard title="Editar paciente">
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
          </NutriSectionCard>
        )}

        <NutriSectionCard
          title="Avaliacao nutricional"
          description="Registre medidas, rotina e restricoes para o paciente selecionado."
        >
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
        </NutriSectionCard>

        <Paper variant="outlined" sx={{ overflow: "auto" }}>
          {state.loadingAssessments ? (
            <NutriLoadingState message="Carregando avaliacoes..." />
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
            <NutriLoadingState message="Carregando pacientes..." />
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

  function renderFoods() {
    return (
      <Stack spacing={2}>
        {renderSeedButton("foods", "Seed 5 alimentos")}

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              Novo alimento
            </Typography>
            {renderFoodForm({
              draft: state.foodDraft,
              onChange: actions.setFoodDraft,
              disabled: state.savingFood,
            })}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              disabled={!state.canCreateFood || state.savingFood}
              onClick={() => void actions.createFood()}
            >
              Cadastrar alimento
            </Button>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              <TextField
                label="Buscar alimento"
                value={state.foodQuery}
                onChange={(event) => actions.setFoodQuery(event.target.value)}
                fullWidth
              />
              <Button
                variant="outlined"
                startIcon={<SearchIcon />}
                onClick={() => void actions.loadFoods()}
              >
                Buscar
              </Button>
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={`Ativos: ${state.foodSummary.active}`} />
              <Chip label={`Arquivados: ${state.foodSummary.archived}`} />
              <Chip label={`Total: ${state.foodSummary.total}`} />
            </Stack>
          </Stack>
        </Paper>

        {state.editingFoodId && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight={700}>
                Editar alimento
              </Typography>
              {renderFoodForm({
                draft: state.foodEditDraft,
                onChange: actions.setFoodEditDraft,
                disabled: state.savingFood,
              })}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={!state.canUpdateFood || state.savingFood}
                  onClick={() => void actions.updateFood()}
                >
                  Salvar alteracoes
                </Button>
                <Button
                  variant="outlined"
                  disabled={state.savingFood}
                  onClick={actions.cancelEditingFood}
                >
                  Cancelar
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}

        <Paper variant="outlined" sx={{ overflow: "auto" }}>
          {state.loadingFoods ? (
            <NutriLoadingState message="Carregando alimentos..." />
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Alimento</TableCell>
                  <TableCell>Fonte</TableCell>
                  <TableCell>Energia</TableCell>
                  <TableCell>Macros</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Acoes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {state.foods.map((food) => (
                  <TableRow key={food.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {food.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {food.servingDescription || "Valores por 100 g"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={FOOD_SOURCE_LABELS[food.source]} />
                    </TableCell>
                    <TableCell>
                      {food.nutrientsPer100g.energyKcal ?? "-"} kcal
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        C: {food.nutrientsPer100g.carbohydrateG ?? "-"} g / P:{" "}
                        {food.nutrientsPer100g.proteinG ?? "-"} g / G:{" "}
                        {food.nutrientsPer100g.fatG ?? "-"} g
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Switch
                          checked={food.active}
                          disabled={state.savingFood}
                          onChange={(event) =>
                            void actions.setFoodActive(food.id, event.target.checked)
                          }
                        />
                        <Chip
                          size="small"
                          label={food.active ? "Ativo" : "Arquivado"}
                          color={food.active ? "success" : "default"}
                        />
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        disabled={state.savingFood}
                        onClick={() => actions.startEditingFood(food)}
                      >
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {state.foods.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Alert severity="info">
                        Nenhum alimento encontrado para os filtros atuais.
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

  function renderFoodForm(input: {
    draft: NutriFoodDraft;
    onChange: React.Dispatch<React.SetStateAction<NutriFoodDraft>>;
    disabled: boolean;
  }) {
    return (
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
          <TextField
            label="Nome"
            value={input.draft.name}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({ ...prev, name: event.target.value }))
            }
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Fonte</InputLabel>
            <Select
              label="Fonte"
              value={input.draft.source}
              disabled={input.disabled}
              onChange={(event) =>
                input.onChange((prev) => ({
                  ...prev,
                  source: event.target.value as NutriFoodSource,
                }))
              }
            >
              {Object.entries(FOOD_SOURCE_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Versao da fonte"
            value={input.draft.sourceVersion}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({
                ...prev,
                sourceVersion: event.target.value,
              }))
            }
            fullWidth
          />
        </Stack>

        <TextField
          label="Medida caseira ou observacao"
          value={input.draft.servingDescription}
          disabled={input.disabled}
          onChange={(event) =>
            input.onChange((prev) => ({
              ...prev,
              servingDescription: event.target.value,
            }))
          }
          fullWidth
        />

        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
          <TextField
            label="Energia kcal"
            type="number"
            value={input.draft.energyKcal}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({ ...prev, energyKcal: event.target.value }))
            }
            fullWidth
          />
          <TextField
            label="Carboidrato g"
            type="number"
            value={input.draft.carbohydrateG}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({
                ...prev,
                carbohydrateG: event.target.value,
              }))
            }
            fullWidth
          />
          <TextField
            label="Proteina g"
            type="number"
            value={input.draft.proteinG}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({ ...prev, proteinG: event.target.value }))
            }
            fullWidth
          />
          <TextField
            label="Gordura g"
            type="number"
            value={input.draft.fatG}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({ ...prev, fatG: event.target.value }))
            }
            fullWidth
          />
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
          <TextField
            label="Gordura saturada g"
            type="number"
            value={input.draft.saturatedFatG}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({
                ...prev,
                saturatedFatG: event.target.value,
              }))
            }
            fullWidth
          />
          <TextField
            label="Fibra g"
            type="number"
            value={input.draft.fiberG}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({ ...prev, fiberG: event.target.value }))
            }
            fullWidth
          />
          <TextField
            label="Sodio mg"
            type="number"
            value={input.draft.sodiumMg}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({ ...prev, sodiumMg: event.target.value }))
            }
            fullWidth
          />
          <TextField
            label="Acucar adicionado g"
            type="number"
            value={input.draft.addedSugarG}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({ ...prev, addedSugarG: event.target.value }))
            }
            fullWidth
          />
        </Stack>

        <TextField
          label="Alergenicos"
          value={input.draft.allergens}
          disabled={input.disabled}
          onChange={(event) =>
            input.onChange((prev) => ({ ...prev, allergens: event.target.value }))
          }
          fullWidth
        />
      </Stack>
    );
  }

  function renderMealPlans() {
    return (
      <Stack spacing={2}>
        {renderSeedButton("mealPlans", "Seed 5 planos")}

        <NutriSectionCard
          title="Novo plano alimentar"
          description="Monte refeicoes com alimentos cadastrados e quantidades em gramas."
        >
            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              <FormControl fullWidth>
                <InputLabel>Paciente</InputLabel>
                <Select
                  label="Paciente"
                  value={state.mealPlanDraft.patientId || state.selectedPatientId}
                  disabled={state.savingMealPlan || state.activePatients.length === 0}
                  onChange={(event) => actions.setMealPlanPatientId(event.target.value)}
                >
                  {state.activePatients.map((patient) => (
                    <MenuItem key={patient.id} value={patient.id}>
                      {patient.fullName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Titulo"
                value={state.mealPlanDraft.title}
                disabled={state.savingMealPlan}
                onChange={(event) =>
                  actions.setMealPlanDraft((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              {renderMealPlanTargetField("Meta kcal", "targetEnergyKcal")}
              {renderMealPlanTargetField("Carboidrato g", "targetCarbohydrateG")}
              {renderMealPlanTargetField("Proteina g", "targetProteinG")}
              {renderMealPlanTargetField("Gordura g", "targetFatG")}
              {renderMealPlanTargetField("Fibra g", "targetFiberG")}
              {renderMealPlanTargetField("Sodio mg", "targetSodiumMg")}
            </Stack>

            <Divider />

            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              <TextField
                label="Refeicao"
                value={state.mealPlanDraft.mealName}
                disabled={state.savingMealPlan}
                onChange={(event) =>
                  actions.setMealPlanDraft((prev) => ({
                    ...prev,
                    mealName: event.target.value,
                  }))
                }
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Alimento</InputLabel>
                <Select
                  label="Alimento"
                  value={state.mealPlanDraft.foodId}
                  disabled={state.savingMealPlan || state.activeFoods.length === 0}
                  onChange={(event) =>
                    actions.setMealPlanDraft((prev) => ({
                      ...prev,
                      foodId: event.target.value,
                    }))
                  }
                >
                  {state.activeFoods.map((food) => (
                    <MenuItem key={food.id} value={food.id}>
                      {food.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Quantidade g"
                type="number"
                value={state.mealPlanDraft.amountG}
                disabled={state.savingMealPlan}
                onChange={(event) =>
                  actions.setMealPlanDraft((prev) => ({
                    ...prev,
                    amountG: event.target.value,
                  }))
                }
                fullWidth
              />
              <TextField
                label="Medida caseira"
                value={state.mealPlanDraft.householdMeasure}
                disabled={state.savingMealPlan}
                onChange={(event) =>
                  actions.setMealPlanDraft((prev) => ({
                    ...prev,
                    householdMeasure: event.target.value,
                  }))
                }
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                disabled={!state.canAddMealPlanItem || state.savingMealPlan}
                onClick={actions.addMealPlanItem}
              >
                Adicionar alimento
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={!state.canCreateMealPlan || state.savingMealPlan}
                onClick={() => void actions.createMealPlan()}
              >
                Salvar plano
              </Button>
            </Stack>
        </NutriSectionCard>

        <NutriSectionCard title="Previa do plano">
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={`Kcal: ${state.mealPlanPreviewTotals.energyKcal ?? 0}`} />
              <Chip label={`Carbo: ${state.mealPlanPreviewTotals.carbohydrateG ?? 0} g`} />
              <Chip label={`Proteina: ${state.mealPlanPreviewTotals.proteinG ?? 0} g`} />
              <Chip label={`Gordura: ${state.mealPlanPreviewTotals.fatG ?? 0} g`} />
              <Chip label={`Fibra: ${state.mealPlanPreviewTotals.fiberG ?? 0} g`} />
              <Chip label={`Sodio: ${state.mealPlanPreviewTotals.sodiumMg ?? 0} mg`} />
            </Stack>

            {renderDraftMealPlanComparison()}

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Refeicao</TableCell>
                  <TableCell>Alimento</TableCell>
                  <TableCell>Quantidade</TableCell>
                  <TableCell>Acoes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {state.mealPlanDraft.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.mealName}</TableCell>
                    <TableCell>{item.foodName}</TableCell>
                    <TableCell>
                      {item.amountG} g
                      {item.householdMeasure ? ` / ${item.householdMeasure}` : ""}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<DeleteIcon />}
                        disabled={state.savingMealPlan}
                        onClick={() => actions.removeMealPlanItem(item.id)}
                      >
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {state.mealPlanDraft.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Alert severity="info">
                        Adicione alimentos para montar a previa do plano.
                      </Alert>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <Typography variant="subtitle2" fontWeight={700}>
              Lista de compras agregada
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Ingrediente</TableCell>
                  <TableCell>Peso liquido</TableCell>
                  <TableCell>Peso bruto</TableCell>
                  <TableCell>Receitas</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {state.restaurantMenuShoppingListPreview.map((item) => (
                  <TableRow key={item.foodId}>
                    <TableCell>{item.foodNameSnapshot}</TableCell>
                    <TableCell>{item.totalNetWeightG} g</TableCell>
                    <TableCell>
                      {item.totalGrossWeightG ? `${item.totalGrossWeightG} g` : "-"}
                    </TableCell>
                    <TableCell>{item.recipeNames.join(", ")}</TableCell>
                  </TableRow>
                ))}
                {state.restaurantMenuShoppingListPreview.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Alert severity="info">
                        A lista de compras aparece apos adicionar receitas.
                      </Alert>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        </NutriSectionCard>

        <Paper variant="outlined" sx={{ overflow: "auto" }}>
          {state.loadingMealPlans ? (
            <NutriLoadingState message="Carregando planos..." />
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Plano</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Refeicoes</TableCell>
                  <TableCell>Acoes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {state.mealPlans.map((mealPlan) => (
                  <TableRow key={mealPlan.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {mealPlan.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Atualizado em {new Date(mealPlan.updatedAt).toLocaleString("pt-BR")}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={MEAL_PLAN_STATUS_LABELS[mealPlan.status]}
                        color={
                          mealPlan.status === "APPROVED"
                            ? "success"
                            : mealPlan.status === "ARCHIVED"
                              ? "default"
                              : "warning"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {mealPlan.totals.energyKcal ?? 0} kcal /{" "}
                        {mealPlan.totals.proteinG ?? 0} g proteina
                      </Typography>
                      {renderSavedMealPlanDiffs(mealPlan.id)}
                    </TableCell>
                    <TableCell>{mealPlan.meals.length}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PrintIcon />}
                          href={`/api/nutri/meal-plans/${mealPlan.id}/print`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Imprimir
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={state.savingMealPlan}
                          onClick={() => void actions.duplicateMealPlan(mealPlan.id)}
                        >
                          Duplicar
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={state.savingMealPlan || mealPlan.status === "APPROVED"}
                          onClick={() =>
                            void actions.setMealPlanStatus(mealPlan.id, "APPROVED")
                          }
                        >
                          Aprovar
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={state.savingMealPlan || mealPlan.status === "ARCHIVED"}
                          onClick={() =>
                            void actions.setMealPlanStatus(mealPlan.id, "ARCHIVED")
                          }
                        >
                          Arquivar
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {state.mealPlans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Alert severity="info">
                        Nenhum plano alimentar salvo para o paciente selecionado.
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

  function renderDraftMealPlanComparison() {
    return (
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nutriente</TableCell>
            <TableCell>Meta</TableCell>
            <TableCell>Planejado</TableCell>
            <TableCell>Diferenca</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {state.mealPlanComparisonRows.map((row) => (
            <TableRow key={row.key}>
              <TableCell>{row.label}</TableCell>
              <TableCell>{row.targetLabel}</TableCell>
              <TableCell>{row.totalLabel}</TableCell>
              <TableCell>
                <Chip size="small" label={row.diffLabel} color={row.diffColor} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  function renderSavedMealPlanDiffs(mealPlanId: string) {
    const chips = state.mealPlanDiffChipsById[mealPlanId] ?? [];
    if (chips.length === 0) return null;

    return (
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
        {chips.map((chip) => (
          <Chip
            key={chip.key}
            size="small"
            label={chip.label}
            color={chip.color}
          />
        ))}
      </Stack>
    );
  }

  function renderMealPlanTargetField(
    label: string,
    key: keyof Pick<
      typeof state.mealPlanDraft,
      | "targetEnergyKcal"
      | "targetCarbohydrateG"
      | "targetProteinG"
      | "targetFatG"
      | "targetFiberG"
      | "targetSodiumMg"
    >,
  ) {
    return (
      <TextField
        label={label}
        type="number"
        value={state.mealPlanDraft[key]}
        disabled={state.savingMealPlan}
        onChange={(event) =>
          actions.setMealPlanDraft((prev) => ({
            ...prev,
            [key]: event.target.value,
          }))
        }
        fullWidth
      />
    );
  }

  function renderRecipes() {
    return (
      <Stack spacing={2}>
        {renderSeedButton("recipes", "Seed 5 receitas")}

        <NutriSectionCard
          title="Nova receita / ficha tecnica"
          description="Use alimentos cadastrados como ingredientes para calcular rendimento, porcao, custo e nutrientes."
        >
            {renderRecipeBaseForm({
              draft: state.recipeDraft,
              onChange: actions.setRecipeDraft,
              disabled: state.savingRecipe,
            })}

            <Divider />

            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              <FormControl fullWidth>
                <InputLabel>Ingrediente</InputLabel>
                <Select
                  label="Ingrediente"
                  value={state.recipeDraft.foodId}
                  disabled={state.savingRecipe || state.activeFoods.length === 0}
                  onChange={(event) =>
                    actions.setRecipeDraft((prev) => ({
                      ...prev,
                      foodId: event.target.value,
                    }))
                  }
                >
                  {state.activeFoods.map((food) => (
                    <MenuItem key={food.id} value={food.id}>
                      {food.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Peso liquido g"
                type="number"
                value={state.recipeDraft.netWeightG}
                disabled={state.savingRecipe}
                onChange={(event) =>
                  actions.setRecipeDraft((prev) => ({
                    ...prev,
                    netWeightG: event.target.value,
                  }))
                }
                fullWidth
              />
              <TextField
                label="Peso bruto g"
                type="number"
                value={state.recipeDraft.grossWeightG}
                disabled={state.savingRecipe}
                onChange={(event) =>
                  actions.setRecipeDraft((prev) => ({
                    ...prev,
                    grossWeightG: event.target.value,
                  }))
                }
                fullWidth
              />
              <TextField
                label="Custo R$"
                type="number"
                value={state.recipeDraft.unitCostReais}
                disabled={state.savingRecipe}
                onChange={(event) =>
                  actions.setRecipeDraft((prev) => ({
                    ...prev,
                    unitCostReais: event.target.value,
                  }))
                }
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                disabled={!state.canAddRecipeIngredient || state.savingRecipe}
                onClick={actions.addRecipeIngredient}
              >
                Adicionar ingrediente
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={!state.canCreateRecipe || state.savingRecipe}
                onClick={() => void actions.createRecipe()}
              >
                Salvar receita
              </Button>
            </Stack>
        </NutriSectionCard>

        <NutriSectionCard title="Previa da ficha tecnica">
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={`Porcoes: ${state.recipePreview.servings || 0}`} />
              <Chip
                label={`Kcal/porcao: ${
                  state.recipePreview.nutrientsPerServing.energyKcal ?? 0
                }`}
              />
              <Chip
                label={`Proteina/porcao: ${
                  state.recipePreview.nutrientsPerServing.proteinG ?? 0
                } g`}
              />
              <Chip
                label={`Kcal/100g: ${state.recipePreview.nutrientsPer100g.energyKcal ?? 0}`}
              />
              <Chip
                label={`Custo/porcao: ${formatMoney(
                  state.recipePreviewCostCents.costPerServingCents,
                )}`}
              />
              <Chip
                label={`FC: ${state.recipeTechnicalFactorsPreview.correctionFactor ?? "-"}`}
              />
              <Chip
                label={`FCc: ${state.recipeTechnicalFactorsPreview.cookingFactor ?? "-"}`}
              />
            </Stack>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Ingrediente</TableCell>
                  <TableCell>Peso liquido</TableCell>
                  <TableCell>Peso bruto</TableCell>
                  <TableCell>FC</TableCell>
                  <TableCell>Custo</TableCell>
                  <TableCell>Acoes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {state.recipeDraft.ingredients.map((ingredient) => (
                  <TableRow key={ingredient.id}>
                    <TableCell>{ingredient.foodName}</TableCell>
                    <TableCell>{ingredient.netWeightG} g</TableCell>
                    <TableCell>
                      {ingredient.grossWeightG ? `${ingredient.grossWeightG} g` : "-"}
                    </TableCell>
                    <TableCell>
                      {ingredient.grossWeightG
                        ? Math.round((ingredient.grossWeightG / ingredient.netWeightG) * 100) /
                          100
                        : "-"}
                    </TableCell>
                    <TableCell>{formatMoney(ingredient.unitCostCents)}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<DeleteIcon />}
                        disabled={state.savingRecipe}
                        onClick={() => actions.removeRecipeIngredient(ingredient.id)}
                      >
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {state.recipeDraft.ingredients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Alert severity="info">
                        Adicione ingredientes para montar a ficha tecnica.
                      </Alert>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        </NutriSectionCard>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              <TextField
                label="Buscar receita"
                value={state.recipeQuery}
                onChange={(event) => actions.setRecipeQuery(event.target.value)}
                fullWidth
              />
              <Button
                variant="outlined"
                startIcon={<SearchIcon />}
                onClick={() => void actions.loadRecipes()}
              >
                Buscar
              </Button>
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={`Ativas: ${state.recipeSummary.active}`} />
              <Chip label={`Arquivadas: ${state.recipeSummary.archived}`} />
              <Chip label={`Total: ${state.recipeSummary.total}`} />
            </Stack>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ overflow: "auto" }}>
          {state.loadingRecipes ? (
            <NutriLoadingState message="Carregando receitas..." />
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Receita</TableCell>
                  <TableCell>Rendimento</TableCell>
                  <TableCell>Porcao</TableCell>
                  <TableCell>Nutrientes por porcao</TableCell>
                  <TableCell>Custo</TableCell>
                  <TableCell>Fatores</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Acoes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {state.recipes.map((recipe) => (
                  <TableRow key={recipe.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {recipe.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {recipe.category || "Sem categoria"} /{" "}
                        {recipe.ingredients.length} ingredientes / v{recipe.version}
                      </Typography>
                    </TableCell>
                    <TableCell>{recipe.yieldTotalG} g</TableCell>
                    <TableCell>
                      {recipe.servingSizeG} g / {recipe.servings} porcoes
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {recipe.nutrientsPerServing.energyKcal ?? 0} kcal /{" "}
                        {recipe.nutrientsPerServing.proteinG ?? 0} g proteina
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        Total: {formatMoney(recipe.totalCostCents)}
                      </Typography>
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        Porcao: {formatMoney(recipe.costPerServingCents)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        FC: {recipe.correctionFactor ?? "-"} / FCc:{" "}
                        {recipe.cookingFactor ?? "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={RECIPE_STATUS_LABELS[recipe.status]}
                        color={
                          recipe.status === "APPROVED"
                            ? "success"
                            : recipe.status === "ARCHIVED"
                              ? "default"
                              : "warning"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PrintIcon />}
                          href={`/api/nutri/recipes/${recipe.id}/print`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Imprimir
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={state.savingRecipe}
                          onClick={() => void actions.duplicateRecipe(recipe.id)}
                        >
                          Duplicar
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={state.savingRecipe || recipe.status === "APPROVED"}
                          onClick={() =>
                            void actions.setRecipeStatus(recipe.id, "APPROVED")
                          }
                        >
                          Aprovar
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={state.savingRecipe || recipe.status === "ARCHIVED"}
                          onClick={() =>
                            void actions.setRecipeStatus(recipe.id, "ARCHIVED")
                          }
                        >
                          Arquivar
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {state.recipes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Alert severity="info">
                        Nenhuma receita encontrada para os filtros atuais.
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

  function renderRecipeBaseForm(input: {
    draft: NutriRecipeDraft;
    onChange: React.Dispatch<React.SetStateAction<NutriRecipeDraft>>;
    disabled: boolean;
  }) {
    return (
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
          <TextField
            label="Nome da receita"
            value={input.draft.name}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({ ...prev, name: event.target.value }))
            }
            fullWidth
          />
          <TextField
            label="Categoria"
            value={input.draft.category}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({ ...prev, category: event.target.value }))
            }
            fullWidth
          />
          <TextField
            label="Rendimento total g"
            type="number"
            value={input.draft.yieldTotalG}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({
                ...prev,
                yieldTotalG: event.target.value,
              }))
            }
            fullWidth
          />
          <TextField
            label="Porcao g"
            type="number"
            value={input.draft.servingSizeG}
            disabled={input.disabled}
            onChange={(event) =>
              input.onChange((prev) => ({
                ...prev,
                servingSizeG: event.target.value,
              }))
            }
            fullWidth
          />
        </Stack>

        <TextField
          label="Modo de preparo"
          value={input.draft.preparationMethod}
          disabled={input.disabled}
          onChange={(event) =>
            input.onChange((prev) => ({
              ...prev,
              preparationMethod: event.target.value,
            }))
          }
          minRows={3}
          multiline
          fullWidth
        />

        <TextField
          label="Alergenicos"
          value={input.draft.allergens}
          disabled={input.disabled}
          onChange={(event) =>
            input.onChange((prev) => ({ ...prev, allergens: event.target.value }))
          }
          fullWidth
        />
      </Stack>
    );
  }

  function formatMoney(value: number | undefined): string {
    if (typeof value !== "number") return "-";

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  }

  function renderMenus() {
    return (
      <Stack spacing={2}>
        {renderSeedButton("restaurantMenus", "Seed 5 cardapios")}

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Novo cardapio de restaurante
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Monte cardapios com receitas aprovadas e preserve snapshots para
                operacao.
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              <TextField
                label="Titulo"
                value={state.restaurantMenuDraft.title}
                disabled={state.savingRestaurantMenu}
                onChange={(event) =>
                  actions.setRestaurantMenuDraft((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
                fullWidth
              />
              <TextField
                label="Data"
                type="date"
                value={state.restaurantMenuDraft.date}
                disabled={state.savingRestaurantMenu}
                onChange={(event) =>
                  actions.setRestaurantMenuDraft((prev) => ({
                    ...prev,
                    date: event.target.value,
                  }))
                }
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
              <TextField
                label="Refeicoes previstas"
                type="number"
                value={state.restaurantMenuDraft.expectedMeals}
                disabled={state.savingRestaurantMenu}
                onChange={(event) =>
                  actions.setRestaurantMenuDraft((prev) => ({
                    ...prev,
                    expectedMeals: event.target.value,
                  }))
                }
                fullWidth
              />
            </Stack>

            <Divider />

            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              <TextField
                label="Refeicao"
                value={state.restaurantMenuDraft.mealName}
                disabled={state.savingRestaurantMenu}
                onChange={(event) =>
                  actions.setRestaurantMenuDraft((prev) => ({
                    ...prev,
                    mealName: event.target.value,
                  }))
                }
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Receita aprovada</InputLabel>
                <Select
                  label="Receita aprovada"
                  value={state.restaurantMenuDraft.recipeId}
                  disabled={
                    state.savingRestaurantMenu || state.approvedRecipes.length === 0
                  }
                  onChange={(event) =>
                    actions.setRestaurantMenuDraft((prev) => ({
                      ...prev,
                      recipeId: event.target.value,
                    }))
                  }
                >
                  {state.approvedRecipes.map((recipe) => (
                    <MenuItem key={recipe.id} value={recipe.id}>
                      {recipe.name} v{recipe.version}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Porcoes"
                type="number"
                value={state.restaurantMenuDraft.servings}
                disabled={state.savingRestaurantMenu}
                onChange={(event) =>
                  actions.setRestaurantMenuDraft((prev) => ({
                    ...prev,
                    servings: event.target.value,
                  }))
                }
                fullWidth
              />
            </Stack>

            {state.approvedRecipes.length === 0 && (
              <Alert severity="info">
                Aprove pelo menos uma receita antes de montar cardapios.
              </Alert>
            )}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                disabled={
                  !state.canAddRestaurantMenuItem || state.savingRestaurantMenu
                }
                onClick={actions.addRestaurantMenuItem}
              >
                Adicionar receita
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={
                  !state.canCreateRestaurantMenu || state.savingRestaurantMenu
                }
                onClick={() => void actions.createRestaurantMenu()}
              >
                Salvar cardapio
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              Previa operacional
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                label={`Kcal: ${state.restaurantMenuPreview.totals.energyKcal ?? 0}`}
              />
              <Chip
                label={`Proteina: ${
                  state.restaurantMenuPreview.totals.proteinG ?? 0
                } g`}
              />
              <Chip
                label={`Custo total: ${formatMoney(
                  state.restaurantMenuPreview.totalCostCents,
                )}`}
              />
              <Chip
                label={`Custo per capita: ${formatMoney(
                  state.restaurantMenuPreview.costPerCapitaCents,
                )}`}
              />
            </Stack>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Refeicao</TableCell>
                  <TableCell>Receita</TableCell>
                  <TableCell>Porcoes</TableCell>
                  <TableCell>Custo</TableCell>
                  <TableCell>Acoes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {state.restaurantMenuDraft.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.mealName}</TableCell>
                    <TableCell>
                      {item.recipeName} v{item.recipeVersion}
                    </TableCell>
                    <TableCell>
                      {item.servings} x {item.servingSizeG} g
                    </TableCell>
                    <TableCell>
                      {formatMoney(
                        typeof item.costPerServingCents === "number"
                          ? item.costPerServingCents * item.servings
                          : undefined,
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<DeleteIcon />}
                        disabled={state.savingRestaurantMenu}
                        onClick={() => actions.removeRestaurantMenuItem(item.id)}
                      >
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {state.restaurantMenuDraft.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Alert severity="info">
                        Adicione receitas aprovadas para montar o cardapio.
                      </Alert>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              <TextField
                label="Buscar cardapio"
                value={state.restaurantMenuQuery}
                onChange={(event) =>
                  actions.setRestaurantMenuQuery(event.target.value)
                }
                fullWidth
              />
              <Button
                variant="outlined"
                startIcon={<SearchIcon />}
                onClick={() => void actions.loadRestaurantMenus()}
              >
                Buscar
              </Button>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={`Rascunhos: ${state.restaurantMenuSummary.draft}`} />
              <Chip label={`Aprovados: ${state.restaurantMenuSummary.approved}`} />
              <Chip label={`Arquivados: ${state.restaurantMenuSummary.archived}`} />
              <Chip label={`Total: ${state.restaurantMenuSummary.total}`} />
            </Stack>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ overflow: "auto" }}>
          {state.loadingRestaurantMenus ? (
            <NutriLoadingState message="Carregando cardapios..." />
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Cardapio</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Itens</TableCell>
                  <TableCell>Compras</TableCell>
                  <TableCell>Totais</TableCell>
                  <TableCell>Custo</TableCell>
                  <TableCell>Acoes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {state.restaurantMenus.map((menu) => (
                  <TableRow key={menu.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {menu.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(`${menu.date}T00:00:00`).toLocaleDateString(
                          "pt-BR",
                        )}
                        {menu.expectedMeals ? ` / ${menu.expectedMeals} refeicoes` : ""}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={RESTAURANT_MENU_STATUS_LABELS[menu.status]}
                        color={
                          menu.status === "APPROVED"
                            ? "success"
                            : menu.status === "ARCHIVED"
                              ? "default"
                              : "warning"
                        }
                      />
                    </TableCell>
                    <TableCell>{menu.items.length}</TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {menu.shoppingList
                          .slice(0, 3)
                          .map(
                            (item) =>
                              `${item.foodNameSnapshot}: ${item.totalNetWeightG} g`,
                          )
                          .join(" / ") || "-"}
                      </Typography>
                      {menu.shoppingList.length > 3 && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          +{menu.shoppingList.length - 3} itens
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {menu.totals.energyKcal ?? 0} kcal /{" "}
                        {menu.totals.proteinG ?? 0} g proteina
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        Total: {formatMoney(menu.totalCostCents)}
                      </Typography>
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        Per capita: {formatMoney(menu.costPerCapitaCents)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PrintIcon />}
                          href={`/api/nutri/restaurant-menus/${menu.id}/print`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Imprimir
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={
                            state.savingRestaurantMenu ||
                            menu.status === "APPROVED"
                          }
                          onClick={() =>
                            void actions.setRestaurantMenuStatus(
                              menu.id,
                              "APPROVED",
                            )
                          }
                        >
                          Aprovar
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={
                            state.savingRestaurantMenu ||
                            menu.status === "ARCHIVED"
                          }
                          onClick={() =>
                            void actions.setRestaurantMenuStatus(
                              menu.id,
                              "ARCHIVED",
                            )
                          }
                        >
                          Arquivar
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {state.restaurantMenus.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Alert severity="info">
                        Nenhum cardapio encontrado para os filtros atuais.
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

  function renderSeedButton(kind: NutriDemoSeedKind, label: string) {
    if (!state.demoSeedsEnabled || state.loadingDemoSeedStatus) return null;

    return (
      <Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            size="small"
            variant="outlined"
            disabled={Boolean(state.seedingDemoKind) || state.clearingDemoData}
            onClick={() => void actions.seedDemoData(kind)}
          >
            {state.seedingDemoKind === kind ? "Criando demo..." : label}
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="warning"
            disabled={Boolean(state.seedingDemoKind) || state.clearingDemoData}
            onClick={() => void actions.clearDemoData()}
          >
            {state.clearingDemoData ? "Limpando demos..." : "Limpar demos"}
          </Button>
        </Stack>
      </Box>
    );
  }
}
