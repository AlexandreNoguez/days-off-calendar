"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import type {
  NutriAssessmentInput,
  NutriAssessmentResponse,
  NutriAssessmentsResponse,
} from "../../contracts/assessments";
import type {
  NutriPatientInput,
  NutriPatientsResponse,
  NutriPatientResponse,
} from "../../contracts/patients";
import { calculateImc } from "../../application/calculateImc";
import type {
  NutriAssessment,
  NutriPatient,
  NutriPatientSex,
} from "../../domain/types";

export type NutriTab = "patients" | "mealPlans" | "recipes" | "menus";

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

const INITIAL_SUMMARY = [
  {
    label: "Pacientes",
    value: "0",
    description: "Cadastro clinico inicial e historico de avaliacoes.",
  },
  {
    label: "Planos",
    value: "0",
    description: "Planos alimentares em rascunho ou aprovados.",
  },
  {
    label: "Receitas",
    value: "0",
    description: "Fichas tecnicas e preparacoes para cardapios.",
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

  const summary = useMemo(
    () =>
      INITIAL_SUMMARY.map((item) =>
        item.label === "Pacientes"
          ? { ...item, value: String(patientSummary.active) }
          : item,
      ),
    [patientSummary.active],
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

  useEffect(() => {
    void loadPatients();
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
      canCreatePatient,
      canUpdatePatient,
      canCreateAssessment,
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
      loadPatients,
      loadAssessments,
      createPatient,
      startEditingPatient,
      cancelEditingPatient,
      updatePatient,
      setPatientActive,
      createAssessment,
    },
  };
}
