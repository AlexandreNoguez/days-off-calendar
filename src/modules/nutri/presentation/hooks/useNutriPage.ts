"use client";

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

export function useNutriPage() {
  return {
    state: {
      summary: INITIAL_SUMMARY,
      firstSteps: FIRST_STEPS,
    },
  };
}
