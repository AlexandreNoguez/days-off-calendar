"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import type {
  NutriAssessmentInput,
  NutriAssessmentResponse,
  NutriAssessmentsResponse,
} from "../../contracts/assessments";
import type {
  NutriFoodInput,
  NutriFoodResponse,
  NutriFoodsResponse,
} from "../../contracts/foods";
import type {
  NutriPatientInput,
  NutriPatientsResponse,
  NutriPatientResponse,
} from "../../contracts/patients";
import { calculateImc } from "../../application/calculateImc";
import type {
  NutriAssessment,
  NutriFood,
  NutriFoodSource,
  NutriPatient,
  NutriPatientSex,
} from "../../domain/types";

export type NutriTab = "patients" | "foods" | "mealPlans" | "recipes" | "menus";

export type NutriPatientDraft = {
  fullName: string;
  birthDate: string;
  sex: NutriPatientSex;
  phone: string;
  email: string;
  notes: string;
};

export type NutriAssessmentDraft = {
  date: string;
  objective: string;
  weightKg: string;
  heightCm: string;
  waistCm: string;
  hipCm: string;
  activityLevel: string;
  allergies: string;
  intolerances: string;
  dietaryRestrictions: string;
  medications: string;
  supplements: string;
  foodRoutineNotes: string;
  clinicalNotes: string;
};

export type NutriFoodDraft = {
  name: string;
  source: NutriFoodSource;
  sourceVersion: string;
  servingDescription: string;
  energyKcal: string;
  carbohydrateG: string;
  proteinG: string;
  fatG: string;
  saturatedFatG: string;
  fiberG: string;
  sodiumMg: string;
  addedSugarG: string;
  allergens: string;
};

const INITIAL_SUMMARY = [
  {
    label: "Pacientes",
    value: "0",
    description: "Cadastro clinico inicial e historico de avaliacoes.",
  },
  {
    label: "Alimentos",
    value: "0",
    description: "Base nutricional por 100 g para calculos.",
  },
  {
    label: "Planos",
    value: "0",
    description: "Planos alimentares em rascunho ou aprovados.",
  },
] as const;

const FIRST_STEPS = [
  "Cadastrar pacientes e dados basicos.",
  "Registrar avaliacao inicial com peso, altura e restricoes.",
  "Montar a base manual de alimentos mais usados.",
  "Criar o primeiro plano alimentar em rascunho.",
] as const;

const EMPTY_PATIENT_DRAFT: NutriPatientDraft = {
  fullName: "",
  birthDate: "",
  sex: "NOT_INFORMED",
  phone: "",
  email: "",
  notes: "",
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyAssessmentDraft(): NutriAssessmentDraft {
  return {
    date: todayISO(),
    objective: "",
    weightKg: "",
    heightCm: "",
    waistCm: "",
    hipCm: "",
    activityLevel: "",
    allergies: "",
    intolerances: "",
    dietaryRestrictions: "",
    medications: "",
    supplements: "",
    foodRoutineNotes: "",
    clinicalNotes: "",
  };
}

const EMPTY_FOOD_DRAFT: NutriFoodDraft = {
  name: "",
  source: "MANUAL",
  sourceVersion: "",
  servingDescription: "",
  energyKcal: "",
  carbohydrateG: "",
  proteinG: "",
  fatG: "",
  saturatedFatG: "",
  fiberG: "",
  sodiumMg: "",
  addedSugarG: "",
  allergens: "",
};

async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
    cache: "no-store",
  });

  const data = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;

  if (!response.ok) {
    throw new Error(data?.error ?? `Request failed with status ${response.status}`);
  }

  return data as T;
}

function toPatientInput(
  draft: NutriPatientDraft,
  options: { active?: boolean } = {},
): NutriPatientInput {
  const input: NutriPatientInput = {
    fullName: draft.fullName.trim(),
    birthDate: draft.birthDate,
    sex: draft.sex,
    phone: draft.phone.trim(),
    email: draft.email.trim(),
    notes: draft.notes.trim(),
  };

  if (typeof options.active === "boolean") input.active = options.active;
  return input;
}

function toPatientDraft(patient: NutriPatient): NutriPatientDraft {
  return {
    fullName: patient.fullName,
    birthDate: patient.birthDate ?? "",
    sex: patient.sex,
    phone: patient.phone ?? "",
    email: patient.email ?? "",
    notes: patient.notes ?? "",
  };
}

function positiveNumber(value: string): number | undefined {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toAssessmentInput(
  patientId: string,
  draft: NutriAssessmentDraft,
): NutriAssessmentInput {
  return {
    patientId,
    date: draft.date,
    objective: draft.objective.trim(),
    weightKg: positiveNumber(draft.weightKg),
    heightCm: positiveNumber(draft.heightCm),
    waistCm: positiveNumber(draft.waistCm),
    hipCm: positiveNumber(draft.hipCm),
    activityLevel: draft.activityLevel.trim(),
    allergies: splitList(draft.allergies),
    intolerances: splitList(draft.intolerances),
    dietaryRestrictions: splitList(draft.dietaryRestrictions),
    medications: draft.medications.trim(),
    supplements: draft.supplements.trim(),
    foodRoutineNotes: draft.foodRoutineNotes.trim(),
    clinicalNotes: draft.clinicalNotes.trim(),
  };
}

function toFoodInput(
  draft: NutriFoodDraft,
  options: { active?: boolean } = {},
): NutriFoodInput {
  const input: NutriFoodInput = {
    name: draft.name.trim(),
    source: draft.source,
    sourceVersion: draft.sourceVersion.trim(),
    servingDescription: draft.servingDescription.trim(),
    nutrientsPer100g: {
      energyKcal: positiveNumber(draft.energyKcal),
      carbohydrateG: positiveNumber(draft.carbohydrateG),
      proteinG: positiveNumber(draft.proteinG),
      fatG: positiveNumber(draft.fatG),
      saturatedFatG: positiveNumber(draft.saturatedFatG),
      fiberG: positiveNumber(draft.fiberG),
      sodiumMg: positiveNumber(draft.sodiumMg),
      addedSugarG: positiveNumber(draft.addedSugarG),
    },
    allergens: splitList(draft.allergens),
  };

  if (typeof options.active === "boolean") input.active = options.active;
  return input;
}

function toFoodDraft(food: NutriFood): NutriFoodDraft {
  return {
    name: food.name,
    source: food.source,
    sourceVersion: food.sourceVersion ?? "",
    servingDescription: food.servingDescription ?? "",
    energyKcal: String(food.nutrientsPer100g.energyKcal ?? ""),
    carbohydrateG: String(food.nutrientsPer100g.carbohydrateG ?? ""),
    proteinG: String(food.nutrientsPer100g.proteinG ?? ""),
    fatG: String(food.nutrientsPer100g.fatG ?? ""),
    saturatedFatG: String(food.nutrientsPer100g.saturatedFatG ?? ""),
    fiberG: String(food.nutrientsPer100g.fiberG ?? ""),
    sodiumMg: String(food.nutrientsPer100g.sodiumMg ?? ""),
    addedSugarG: String(food.nutrientsPer100g.addedSugarG ?? ""),
    allergens: food.allergens.join(", "),
  };
}

export function useNutriPage() {
  const [tab, setTab] = useState<NutriTab>("patients");
  const [patients, setPatients] = useState<NutriPatient[]>([]);
  const [patientSummary, setPatientSummary] = useState({
    total: 0,
    active: 0,
    archived: 0,
  });
  const [query, setQuery] = useState("");
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [savingPatient, setSavingPatient] = useState(false);
  const [draft, setDraft] = useState<NutriPatientDraft>(EMPTY_PATIENT_DRAFT);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [editDraft, setEditDraft] =
    useState<NutriPatientDraft>(EMPTY_PATIENT_DRAFT);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [assessments, setAssessments] = useState<NutriAssessment[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [savingAssessment, setSavingAssessment] = useState(false);
  const [assessmentDraft, setAssessmentDraft] = useState<NutriAssessmentDraft>(
    createEmptyAssessmentDraft(),
  );
  const [foods, setFoods] = useState<NutriFood[]>([]);
  const [foodSummary, setFoodSummary] = useState({
    total: 0,
    active: 0,
    archived: 0,
  });
  const [foodQuery, setFoodQuery] = useState("");
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [savingFood, setSavingFood] = useState(false);
  const [foodDraft, setFoodDraft] = useState<NutriFoodDraft>(EMPTY_FOOD_DRAFT);
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [foodEditDraft, setFoodEditDraft] =
    useState<NutriFoodDraft>(EMPTY_FOOD_DRAFT);

  const summary = useMemo(
    () =>
      INITIAL_SUMMARY.map((item) =>
        item.label === "Pacientes"
          ? { ...item, value: String(patientSummary.active) }
          : item.label === "Alimentos"
            ? { ...item, value: String(foodSummary.active) }
          : item,
      ),
    [foodSummary.active, patientSummary.active],
  );

  const canCreatePatient = draft.fullName.trim().length > 0;
  const canUpdatePatient =
    Boolean(editingPatientId) && editDraft.fullName.trim().length > 0;
  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId),
    [patients, selectedPatientId],
  );
  const activePatients = useMemo(
    () => patients.filter((patient) => patient.active),
    [patients],
  );
  const assessmentImcPreview = useMemo(
    () =>
      calculateImc({
        weightKg: positiveNumber(assessmentDraft.weightKg),
        heightCm: positiveNumber(assessmentDraft.heightCm),
      }),
    [assessmentDraft.heightCm, assessmentDraft.weightKg],
  );
  const canCreateAssessment = Boolean(selectedPatientId && assessmentDraft.date);
  const canCreateFood =
    foodDraft.name.trim().length > 0 &&
    Object.values(toFoodInput(foodDraft).nutrientsPer100g ?? {}).some(
      (value) => typeof value === "number",
    );
  const canUpdateFood =
    Boolean(editingFoodId) &&
    foodEditDraft.name.trim().length > 0 &&
    Object.values(toFoodInput(foodEditDraft).nutrientsPer100g ?? {}).some(
      (value) => typeof value === "number",
    );

  useEffect(() => {
    void Promise.all([loadPatients(), loadFoods()]);
    // Initial data load should run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      void loadAssessments(selectedPatientId);
    }
    // Loading follows selected patient changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatientId]);

  async function loadPatients(nextQuery = query) {
    setLoadingPatients(true);

    try {
      const params = new URLSearchParams();
      if (nextQuery.trim()) params.set("q", nextQuery.trim());

      const data = await fetchJson<NutriPatientsResponse>(
        `/api/nutri/patients${params.toString() ? `?${params.toString()}` : ""}`,
      );

      setPatients(data.patients);
      setPatientSummary(data.summary);

      const firstActivePatient = data.patients.find((patient) => patient.active);
      if (!selectedPatientId && firstActivePatient) {
        setSelectedPatientId(firstActivePatient.id);
      }
    } catch (error) {
      console.error("[useNutriPage] Failed to load patients", error);
      toast.error("Nao foi possivel carregar pacientes.");
    } finally {
      setLoadingPatients(false);
    }
  }

  async function loadFoods(nextQuery = foodQuery) {
    setLoadingFoods(true);

    try {
      const params = new URLSearchParams();
      if (nextQuery.trim()) params.set("q", nextQuery.trim());

      const data = await fetchJson<NutriFoodsResponse>(
        `/api/nutri/foods${params.toString() ? `?${params.toString()}` : ""}`,
      );

      setFoods(data.foods);
      setFoodSummary(data.summary);
    } catch (error) {
      console.error("[useNutriPage] Failed to load foods", error);
      toast.error("Nao foi possivel carregar alimentos.");
    } finally {
      setLoadingFoods(false);
    }
  }

  async function createPatient() {
    if (!canCreatePatient) return;
    setSavingPatient(true);

    try {
      await fetchJson<NutriPatientResponse>("/api/nutri/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPatientInput(draft, { active: true })),
      });

      setDraft(EMPTY_PATIENT_DRAFT);
      toast.success("Paciente cadastrado.");
      await loadPatients();
    } catch (error) {
      console.error("[useNutriPage] Failed to create patient", error);
      toast.error(error instanceof Error ? error.message : "Nao foi possivel cadastrar.");
    } finally {
      setSavingPatient(false);
    }
  }

  function startEditingPatient(patient: NutriPatient) {
    setEditingPatientId(patient.id);
    setEditDraft(toPatientDraft(patient));
  }

  function cancelEditingPatient() {
    setEditingPatientId(null);
    setEditDraft(EMPTY_PATIENT_DRAFT);
  }

  async function updatePatient() {
    if (!editingPatientId || !canUpdatePatient) return;
    setSavingPatient(true);

    try {
      await fetchJson<NutriPatientResponse>(`/api/nutri/patients/${editingPatientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPatientInput(editDraft)),
      });

      cancelEditingPatient();
      toast.success("Paciente atualizado.");
      await loadPatients();
    } catch (error) {
      console.error("[useNutriPage] Failed to update patient", error);
      toast.error(error instanceof Error ? error.message : "Nao foi possivel atualizar.");
    } finally {
      setSavingPatient(false);
    }
  }

  async function setPatientActive(id: string, active: boolean) {
    setSavingPatient(true);

    try {
      await fetchJson<NutriPatientResponse>(`/api/nutri/patients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });

      toast.success(active ? "Paciente reativado." : "Paciente arquivado.");
      await loadPatients();
    } catch (error) {
      console.error("[useNutriPage] Failed to change patient status", error);
      toast.error("Nao foi possivel alterar o status do paciente.");
    } finally {
      setSavingPatient(false);
    }
  }

  function setAndSearchPatients(value: string) {
    setQuery(value);
    void loadPatients(value);
  }

  async function loadAssessments(patientId = selectedPatientId) {
    if (!patientId) {
      setAssessments([]);
      return;
    }

    setLoadingAssessments(true);

    try {
      const params = new URLSearchParams({ patientId });
      const data = await fetchJson<NutriAssessmentsResponse>(
        `/api/nutri/assessments?${params.toString()}`,
      );

      setAssessments(data.assessments);
    } catch (error) {
      console.error("[useNutriPage] Failed to load assessments", error);
      toast.error("Nao foi possivel carregar avaliacoes.");
    } finally {
      setLoadingAssessments(false);
    }
  }

  async function createAssessment() {
    if (!canCreateAssessment) return;
    setSavingAssessment(true);

    try {
      await fetchJson<NutriAssessmentResponse>("/api/nutri/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toAssessmentInput(selectedPatientId, assessmentDraft)),
      });

      setAssessmentDraft(createEmptyAssessmentDraft());
      toast.success("Avaliacao registrada.");
      await loadAssessments(selectedPatientId);
    } catch (error) {
      console.error("[useNutriPage] Failed to create assessment", error);
      toast.error(
        error instanceof Error ? error.message : "Nao foi possivel registrar.",
      );
    } finally {
      setSavingAssessment(false);
    }
  }

  async function createFood() {
    if (!canCreateFood) return;
    setSavingFood(true);

    try {
      await fetchJson<NutriFoodResponse>("/api/nutri/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toFoodInput(foodDraft, { active: true })),
      });

      setFoodDraft(EMPTY_FOOD_DRAFT);
      toast.success("Alimento cadastrado.");
      await loadFoods();
    } catch (error) {
      console.error("[useNutriPage] Failed to create food", error);
      toast.error(error instanceof Error ? error.message : "Nao foi possivel cadastrar.");
    } finally {
      setSavingFood(false);
    }
  }

  function startEditingFood(food: NutriFood) {
    setEditingFoodId(food.id);
    setFoodEditDraft(toFoodDraft(food));
  }

  function cancelEditingFood() {
    setEditingFoodId(null);
    setFoodEditDraft(EMPTY_FOOD_DRAFT);
  }

  async function updateFood() {
    if (!editingFoodId || !canUpdateFood) return;
    setSavingFood(true);

    try {
      await fetchJson<NutriFoodResponse>(`/api/nutri/foods/${editingFoodId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toFoodInput(foodEditDraft)),
      });

      cancelEditingFood();
      toast.success("Alimento atualizado.");
      await loadFoods();
    } catch (error) {
      console.error("[useNutriPage] Failed to update food", error);
      toast.error(error instanceof Error ? error.message : "Nao foi possivel atualizar.");
    } finally {
      setSavingFood(false);
    }
  }

  async function setFoodActive(id: string, active: boolean) {
    setSavingFood(true);

    try {
      await fetchJson<NutriFoodResponse>(`/api/nutri/foods/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });

      toast.success(active ? "Alimento reativado." : "Alimento arquivado.");
      await loadFoods();
    } catch (error) {
      console.error("[useNutriPage] Failed to change food status", error);
      toast.error("Nao foi possivel alterar o status do alimento.");
    } finally {
      setSavingFood(false);
    }
  }

  return {
    state: {
      tab,
      patients,
      patientSummary,
      query,
      loadingPatients,
      savingPatient,
      draft,
      editingPatientId,
      editDraft,
      selectedPatientId,
      selectedPatient,
      activePatients,
      assessments,
      loadingAssessments,
      savingAssessment,
      assessmentDraft,
      assessmentImcPreview,
      foods,
      foodSummary,
      foodQuery,
      loadingFoods,
      savingFood,
      foodDraft,
      editingFoodId,
      foodEditDraft,
      canCreatePatient,
      canUpdatePatient,
      canCreateAssessment,
      canCreateFood,
      canUpdateFood,
      summary,
      firstSteps: FIRST_STEPS,
    },
    actions: {
      setTab,
      setQuery,
      setAndSearchPatients,
      setDraft,
      setEditDraft,
      setSelectedPatientId,
      setAssessmentDraft,
      setFoodQuery,
      setFoodDraft,
      setFoodEditDraft,
      loadPatients,
      loadAssessments,
      loadFoods,
      createPatient,
      startEditingPatient,
      cancelEditingPatient,
      updatePatient,
      setPatientActive,
      createAssessment,
      createFood,
      startEditingFood,
      cancelEditingFood,
      updateFood,
      setFoodActive,
    },
  };
}
