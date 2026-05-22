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
  NutriMealPlanInput,
  NutriMealPlanResponse,
  NutriMealPlansResponse,
} from "../../contracts/mealPlans";
import type {
  NutriPatientInput,
  NutriPatientsResponse,
  NutriPatientResponse,
} from "../../contracts/patients";
import type {
  NutriRecipeInput,
  NutriRecipeResponse,
  NutriRecipesResponse,
} from "../../contracts/recipes";
import { calculateImc } from "../../application/calculateImc";
import { calculateMealPlanTotals } from "../../application/calculateMealPlanTotals";
import { calculateRecipeNutrition } from "../../application/calculateRecipeNutrition";
import type {
  NutriAssessment,
  NutriFood,
  NutriFoodSource,
  NutriMeal,
  NutriMealPlan,
  NutriNutrients,
  NutriPatient,
  NutriPatientSex,
  NutriRecipe,
  NutriRecipeIngredient,
  NutriRecipeStatus,
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

export type NutriMealPlanDraftItem = {
  id: string;
  mealName: string;
  foodId: string;
  foodName: string;
  amountG: number;
  householdMeasure: string;
  nutrientsPer100g: NutriNutrients;
};

export type NutriMealPlanDraft = {
  patientId: string;
  title: string;
  targetEnergyKcal: string;
  targetCarbohydrateG: string;
  targetProteinG: string;
  targetFatG: string;
  targetFiberG: string;
  targetSodiumMg: string;
  mealName: string;
  foodId: string;
  amountG: string;
  householdMeasure: string;
  items: NutriMealPlanDraftItem[];
};

export type NutriRecipeDraftIngredient = {
  id: string;
  foodId: string;
  foodName: string;
  netWeightG: number;
  grossWeightG?: number;
  unitCostCents?: number;
  nutrientsPer100g: NutriNutrients;
};

export type NutriRecipeDraft = {
  name: string;
  category: string;
  yieldTotalG: string;
  servingSizeG: string;
  preparationMethod: string;
  allergens: string;
  foodId: string;
  netWeightG: string;
  grossWeightG: string;
  unitCostReais: string;
  ingredients: NutriRecipeDraftIngredient[];
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
  {
    label: "Receitas",
    value: "0",
    description: "Fichas tecnicas com rendimento, custo e porcao.",
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

const DEFAULT_MEAL_NAMES = [
  "Cafe da manha",
  "Lanche da manha",
  "Almoco",
  "Lanche da tarde",
  "Jantar",
  "Ceia",
] as const;

function createEmptyMealPlanDraft(): NutriMealPlanDraft {
  return {
    patientId: "",
    title: "Plano alimentar",
    targetEnergyKcal: "",
    targetCarbohydrateG: "",
    targetProteinG: "",
    targetFatG: "",
    targetFiberG: "",
    targetSodiumMg: "",
    mealName: DEFAULT_MEAL_NAMES[0],
    foodId: "",
    amountG: "",
    householdMeasure: "",
    items: [],
  };
}

function createEmptyRecipeDraft(): NutriRecipeDraft {
  return {
    name: "",
    category: "",
    yieldTotalG: "",
    servingSizeG: "",
    preparationMethod: "",
    allergens: "",
    foodId: "",
    netWeightG: "",
    grossWeightG: "",
    unitCostReais: "",
    ingredients: [],
  };
}

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

function moneyToCents(value: string): number | undefined {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return undefined;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : undefined;
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

function createLocalId(prefix: string): string {
  return `${prefix}_${globalThis.crypto.randomUUID()}`;
}

function mealPlanDraftMeals(items: NutriMealPlanDraftItem[]): NutriMeal[] {
  const mealNames = [...new Set(items.map((item) => item.mealName))];

  return mealNames.map((mealName) => ({
    id: `draft_${mealName}`,
    name: mealName,
    items: items
      .filter((item) => item.mealName === mealName)
      .map((item) => ({
        id: item.id,
        foodId: item.foodId,
        foodNameSnapshot: item.foodName,
        amountG: item.amountG,
        householdMeasure: item.householdMeasure || undefined,
        nutrientsPer100gSnapshot: item.nutrientsPer100g,
      })),
  }));
}

function toMealPlanInput(draft: NutriMealPlanDraft): NutriMealPlanInput {
  const meals = mealPlanDraftMeals(draft.items);

  return {
    patientId: draft.patientId,
    title: draft.title.trim(),
    target: {
      energyKcal: positiveNumber(draft.targetEnergyKcal),
      carbohydrateG: positiveNumber(draft.targetCarbohydrateG),
      proteinG: positiveNumber(draft.targetProteinG),
      fatG: positiveNumber(draft.targetFatG),
      fiberG: positiveNumber(draft.targetFiberG),
      sodiumMg: positiveNumber(draft.targetSodiumMg),
    },
    meals: meals.map((meal) => ({
      name: meal.name,
      items: meal.items.map((item) => ({
        foodId: item.foodId,
        amountG: item.amountG,
        householdMeasure: item.householdMeasure,
      })),
    })),
  };
}

function recipeDraftIngredients(
  ingredients: NutriRecipeDraftIngredient[],
): NutriRecipeIngredient[] {
  return ingredients.map((ingredient) => ({
    id: ingredient.id,
    foodId: ingredient.foodId,
    foodNameSnapshot: ingredient.foodName,
    netWeightG: ingredient.netWeightG,
    grossWeightG: ingredient.grossWeightG,
    unitCostCents: ingredient.unitCostCents,
    nutrientsPer100gSnapshot: ingredient.nutrientsPer100g,
  }));
}

function toRecipeInput(draft: NutriRecipeDraft): NutriRecipeInput {
  return {
    name: draft.name.trim(),
    category: draft.category.trim(),
    yieldTotalG: positiveNumber(draft.yieldTotalG),
    servingSizeG: positiveNumber(draft.servingSizeG),
    preparationMethod: draft.preparationMethod.trim(),
    allergens: splitList(draft.allergens),
    ingredients: draft.ingredients.map((ingredient) => ({
      foodId: ingredient.foodId,
      netWeightG: ingredient.netWeightG,
      grossWeightG: ingredient.grossWeightG,
      unitCostCents: ingredient.unitCostCents,
    })),
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
  const [mealPlans, setMealPlans] = useState<NutriMealPlan[]>([]);
  const [loadingMealPlans, setLoadingMealPlans] = useState(false);
  const [savingMealPlan, setSavingMealPlan] = useState(false);
  const [mealPlanDraft, setMealPlanDraft] = useState<NutriMealPlanDraft>(
    createEmptyMealPlanDraft(),
  );
  const [recipes, setRecipes] = useState<NutriRecipe[]>([]);
  const [recipeSummary, setRecipeSummary] = useState({
    total: 0,
    active: 0,
    archived: 0,
  });
  const [recipeQuery, setRecipeQuery] = useState("");
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState(false);
  const [recipeDraft, setRecipeDraft] = useState<NutriRecipeDraft>(
    createEmptyRecipeDraft(),
  );

  const summary = useMemo(
    () =>
      INITIAL_SUMMARY.map((item) =>
        item.label === "Pacientes"
          ? { ...item, value: String(patientSummary.active) }
          : item.label === "Alimentos"
            ? { ...item, value: String(foodSummary.active) }
            : item.label === "Planos"
              ? { ...item, value: String(mealPlans.length) }
              : item.label === "Receitas"
                ? { ...item, value: String(recipeSummary.active) }
                : item,
      ),
    [
      foodSummary.active,
      mealPlans.length,
      patientSummary.active,
      recipeSummary.active,
    ],
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
  const activeFoods = useMemo(
    () => foods.filter((food) => food.active),
    [foods],
  );
  const mealPlanPreviewMeals = useMemo(
    () => mealPlanDraftMeals(mealPlanDraft.items),
    [mealPlanDraft.items],
  );
  const mealPlanPreviewTotals = useMemo(
    () => calculateMealPlanTotals(mealPlanPreviewMeals),
    [mealPlanPreviewMeals],
  );
  const canAddMealPlanItem = Boolean(
    mealPlanDraft.mealName.trim() &&
      mealPlanDraft.foodId &&
      positiveNumber(mealPlanDraft.amountG),
  );
  const canCreateMealPlan = Boolean(
    mealPlanDraft.patientId &&
      mealPlanDraft.title.trim() &&
      mealPlanDraft.items.length > 0,
  );
  const recipePreviewIngredients = useMemo(
    () => recipeDraftIngredients(recipeDraft.ingredients),
    [recipeDraft.ingredients],
  );
  const recipePreview = useMemo(
    () =>
      calculateRecipeNutrition({
        ingredients: recipePreviewIngredients,
        yieldTotalG: positiveNumber(recipeDraft.yieldTotalG) ?? 0,
        servingSizeG: positiveNumber(recipeDraft.servingSizeG) ?? 0,
      }),
    [
      recipeDraft.servingSizeG,
      recipeDraft.yieldTotalG,
      recipePreviewIngredients,
    ],
  );
  const recipePreviewCostCents = useMemo(() => {
    const totalCostCents = recipeDraft.ingredients.reduce((total, ingredient) => {
      return total + (ingredient.unitCostCents ?? 0);
    }, 0);

    return {
      totalCostCents: totalCostCents || undefined,
      costPerServingCents:
        totalCostCents > 0 && recipePreview.servings > 0
          ? Math.round(totalCostCents / recipePreview.servings)
          : undefined,
    };
  }, [recipeDraft.ingredients, recipePreview.servings]);
  const canAddRecipeIngredient = Boolean(
    recipeDraft.foodId && positiveNumber(recipeDraft.netWeightG),
  );
  const canCreateRecipe = Boolean(
    recipeDraft.name.trim() &&
      positiveNumber(recipeDraft.yieldTotalG) &&
      positiveNumber(recipeDraft.servingSizeG) &&
      recipeDraft.ingredients.length > 0,
  );

  useEffect(() => {
    void Promise.all([loadPatients(), loadFoods(), loadRecipes()]);
    // Initial data load should run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      void loadAssessments(selectedPatientId);
      void loadMealPlans(selectedPatientId);
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
        setMealPlanDraft((prev) => ({ ...prev, patientId: firstActivePatient.id }));
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

  async function loadMealPlans(patientId = selectedPatientId) {
    if (!patientId) {
      setMealPlans([]);
      return;
    }

    setLoadingMealPlans(true);

    try {
      const params = new URLSearchParams({ patientId });
      const data = await fetchJson<NutriMealPlansResponse>(
        `/api/nutri/meal-plans?${params.toString()}`,
      );

      setMealPlans(data.mealPlans);
    } catch (error) {
      console.error("[useNutriPage] Failed to load meal plans", error);
      toast.error("Nao foi possivel carregar planos alimentares.");
    } finally {
      setLoadingMealPlans(false);
    }
  }

  async function loadRecipes(nextQuery = recipeQuery) {
    setLoadingRecipes(true);

    try {
      const params = new URLSearchParams();
      if (nextQuery.trim()) params.set("q", nextQuery.trim());

      const data = await fetchJson<NutriRecipesResponse>(
        `/api/nutri/recipes${params.toString() ? `?${params.toString()}` : ""}`,
      );

      setRecipes(data.recipes);
      setRecipeSummary(data.summary);
    } catch (error) {
      console.error("[useNutriPage] Failed to load recipes", error);
      toast.error("Nao foi possivel carregar receitas.");
    } finally {
      setLoadingRecipes(false);
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

  function setMealPlanPatientId(patientId: string) {
    setSelectedPatientId(patientId);
    setMealPlanDraft((prev) => ({ ...prev, patientId }));
  }

  function addMealPlanItem() {
    const food = foods.find((candidate) => candidate.id === mealPlanDraft.foodId);
    const amountG = positiveNumber(mealPlanDraft.amountG);

    if (!food || !amountG) return;

    setMealPlanDraft((prev) => ({
      ...prev,
      foodId: "",
      amountG: "",
      householdMeasure: "",
      items: [
        ...prev.items,
        {
          id: createLocalId("draft_meal_item"),
          mealName: prev.mealName.trim(),
          foodId: food.id,
          foodName: food.name,
          amountG,
          householdMeasure: prev.householdMeasure.trim(),
          nutrientsPer100g: food.nutrientsPer100g,
        },
      ],
    }));
  }

  function removeMealPlanItem(id: string) {
    setMealPlanDraft((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  }

  async function createMealPlan() {
    if (!canCreateMealPlan) return;
    setSavingMealPlan(true);

    try {
      await fetchJson<NutriMealPlanResponse>("/api/nutri/meal-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toMealPlanInput(mealPlanDraft)),
      });

      setMealPlanDraft({
        ...createEmptyMealPlanDraft(),
        patientId: mealPlanDraft.patientId,
      });
      toast.success("Plano alimentar salvo como rascunho.");
      await loadMealPlans(mealPlanDraft.patientId);
    } catch (error) {
      console.error("[useNutriPage] Failed to create meal plan", error);
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar.");
    } finally {
      setSavingMealPlan(false);
    }
  }

  async function setMealPlanStatus(id: string, status: NutriMealPlan["status"]) {
    setSavingMealPlan(true);

    try {
      await fetchJson<NutriMealPlanResponse>(`/api/nutri/meal-plans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      toast.success("Status do plano atualizado.");
      await loadMealPlans(mealPlanDraft.patientId || selectedPatientId);
    } catch (error) {
      console.error("[useNutriPage] Failed to update meal plan status", error);
      toast.error("Nao foi possivel atualizar o plano.");
    } finally {
      setSavingMealPlan(false);
    }
  }

  async function duplicateMealPlan(id: string) {
    setSavingMealPlan(true);

    try {
      await fetchJson<NutriMealPlanResponse>(`/api/nutri/meal-plans/${id}/duplicate`, {
        method: "POST",
      });

      toast.success("Plano duplicado como novo rascunho.");
      await loadMealPlans(mealPlanDraft.patientId || selectedPatientId);
    } catch (error) {
      console.error("[useNutriPage] Failed to duplicate meal plan", error);
      toast.error("Nao foi possivel duplicar o plano.");
    } finally {
      setSavingMealPlan(false);
    }
  }

  function addRecipeIngredient() {
    const food = foods.find((candidate) => candidate.id === recipeDraft.foodId);
    const netWeightG = positiveNumber(recipeDraft.netWeightG);

    if (!food || !netWeightG) return;

    setRecipeDraft((prev) => ({
      ...prev,
      foodId: "",
      netWeightG: "",
      grossWeightG: "",
      unitCostReais: "",
      ingredients: [
        ...prev.ingredients,
        {
          id: createLocalId("draft_recipe_ingredient"),
          foodId: food.id,
          foodName: food.name,
          netWeightG,
          grossWeightG: positiveNumber(prev.grossWeightG),
          unitCostCents: moneyToCents(prev.unitCostReais),
          nutrientsPer100g: food.nutrientsPer100g,
        },
      ],
    }));
  }

  function removeRecipeIngredient(id: string) {
    setRecipeDraft((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((ingredient) => ingredient.id !== id),
    }));
  }

  async function createRecipe() {
    if (!canCreateRecipe) return;
    setSavingRecipe(true);

    try {
      await fetchJson<NutriRecipeResponse>("/api/nutri/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toRecipeInput(recipeDraft)),
      });

      setRecipeDraft(createEmptyRecipeDraft());
      toast.success("Receita salva.");
      await loadRecipes();
    } catch (error) {
      console.error("[useNutriPage] Failed to create recipe", error);
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar.");
    } finally {
      setSavingRecipe(false);
    }
  }

  async function setRecipeStatus(id: string, status: NutriRecipeStatus) {
    setSavingRecipe(true);

    try {
      await fetchJson<NutriRecipeResponse>(`/api/nutri/recipes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      toast.success("Status da receita atualizado.");
      await loadRecipes();
    } catch (error) {
      console.error("[useNutriPage] Failed to update recipe status", error);
      toast.error("Nao foi possivel atualizar a receita.");
    } finally {
      setSavingRecipe(false);
    }
  }

  async function duplicateRecipe(id: string) {
    setSavingRecipe(true);

    try {
      await fetchJson<NutriRecipeResponse>(`/api/nutri/recipes/${id}/duplicate`, {
        method: "POST",
      });

      toast.success("Receita duplicada como nova versao.");
      await loadRecipes();
    } catch (error) {
      console.error("[useNutriPage] Failed to duplicate recipe", error);
      toast.error("Nao foi possivel duplicar a receita.");
    } finally {
      setSavingRecipe(false);
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
      mealPlans,
      loadingMealPlans,
      savingMealPlan,
      mealPlanDraft,
      recipes,
      recipeSummary,
      recipeQuery,
      loadingRecipes,
      savingRecipe,
      recipeDraft,
      activeFoods,
      mealPlanPreviewMeals,
      mealPlanPreviewTotals,
      recipePreview,
      recipePreviewCostCents,
      canCreatePatient,
      canUpdatePatient,
      canCreateAssessment,
      canCreateFood,
      canUpdateFood,
      canAddMealPlanItem,
      canCreateMealPlan,
      canAddRecipeIngredient,
      canCreateRecipe,
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
      setMealPlanDraft,
      setMealPlanPatientId,
      setRecipeQuery,
      setRecipeDraft,
      loadPatients,
      loadAssessments,
      loadFoods,
      loadMealPlans,
      loadRecipes,
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
      addMealPlanItem,
      removeMealPlanItem,
      createMealPlan,
      setMealPlanStatus,
      duplicateMealPlan,
      addRecipeIngredient,
      removeRecipeIngredient,
      createRecipe,
      setRecipeStatus,
      duplicateRecipe,
    },
  };
}
