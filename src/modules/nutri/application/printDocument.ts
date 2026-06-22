import type {
  NutriMealPlanStatus,
  NutriRecipeStatus,
  NutriRestaurantMenuStatus,
} from "../domain/types";

const STATUS_LABELS: Record<
  NutriMealPlanStatus | NutriRecipeStatus | NutriRestaurantMenuStatus,
  string
> = {
  DRAFT: "Rascunho",
  APPROVED: "Aprovado",
  ARCHIVED: "Arquivado",
};

export const PROFESSIONAL_REVIEW_NOTICE =
  "Documento de apoio tecnico. A revisao profissional e obrigatoria antes de uso clinico ou operacional.";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function formatDateBR(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

export function formatDateTimeBR(value: string): string {
  return new Date(value).toLocaleString("pt-BR");
}

export function formatDocumentStatus(
  status: NutriMealPlanStatus | NutriRecipeStatus | NutriRestaurantMenuStatus,
): string {
  return STATUS_LABELS[status];
}

export function renderResponsibleMeta(responsibleName?: string): string {
  return `<div class="meta">Responsavel tecnico: ${
    responsibleName ? escapeHtml(responsibleName) : "Nao informado"
  }</div>`;
}

export function renderProfessionalReviewFooter(extraText?: string): string {
  const extra = extraText ? `<br />${escapeHtml(extraText)}` : "";
  return `<footer>${PROFESSIONAL_REVIEW_NOTICE}${extra}</footer>`;
}
