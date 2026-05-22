"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import type {
  NutriPatientInput,
  NutriPatientsResponse,
  NutriPatientResponse,
} from "../../contracts/patients";
import type { NutriPatient, NutriPatientSex } from "../../domain/types";

export type NutriTab = "patients" | "mealPlans" | "recipes" | "menus";

export type NutriPatientDraft = {
  fullName: string;
  birthDate: string;
  sex: NutriPatientSex;
  phone: string;
  email: string;
  notes: string;
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

  useEffect(() => {
    void loadPatients();
    // Initial data load should run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      canCreatePatient,
      canUpdatePatient,
      summary,
      firstSteps: FIRST_STEPS,
    },
    actions: {
      setTab,
      setQuery,
      setAndSearchPatients,
      setDraft,
      setEditDraft,
      loadPatients,
      createPatient,
      startEditingPatient,
      cancelEditingPatient,
      updatePatient,
      setPatientActive,
    },
  };
}
