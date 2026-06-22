import type { NutriNutrients, NutriRecipe } from "../domain/types";
import {
  escapeHtml,
  formatDateTimeBR,
  formatDocumentStatus,
  renderProfessionalReviewFooter,
  renderResponsibleMeta,
} from "./printDocument";

const NUTRIENT_ROWS: Array<{
  key: keyof NutriNutrients;
  label: string;
  unit: string;
}> = [
  { key: "energyKcal", label: "Energia", unit: "kcal" },
  { key: "carbohydrateG", label: "Carboidrato", unit: "g" },
  { key: "proteinG", label: "Proteina", unit: "g" },
  { key: "fatG", label: "Gordura", unit: "g" },
  { key: "saturatedFatG", label: "Gordura saturada", unit: "g" },
  { key: "fiberG", label: "Fibra", unit: "g" },
  { key: "sodiumMg", label: "Sodio", unit: "mg" },
  { key: "addedSugarG", label: "Acucar adicionado", unit: "g" },
];

function formatNutrient(value: number | undefined, unit: string): string {
  if (typeof value !== "number") return "-";
  return `${value} ${unit}`;
}

function formatMoney(value: number | undefined): string {
  if (typeof value !== "number") return "-";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

function renderNutrientTable(recipe: NutriRecipe): string {
  return NUTRIENT_ROWS.map((row) => `<tr>
      <td>${row.label}</td>
      <td>${formatNutrient(recipe.totalNutrients[row.key], row.unit)}</td>
      <td>${formatNutrient(recipe.nutrientsPer100g[row.key], row.unit)}</td>
      <td>${formatNutrient(recipe.nutrientsPerServing[row.key], row.unit)}</td>
    </tr>`).join("");
}

function renderIngredientRows(recipe: NutriRecipe): string {
  return recipe.ingredients
    .map((ingredient) => `<tr>
      <td>${escapeHtml(ingredient.foodNameSnapshot)}</td>
      <td>${ingredient.netWeightG} g</td>
      <td>${ingredient.grossWeightG ? `${ingredient.grossWeightG} g` : "-"}</td>
      <td>${ingredient.correctionFactor ?? "-"}</td>
      <td>${formatMoney(ingredient.unitCostCents)}</td>
    </tr>`)
    .join("");
}

export function renderRecipeHtml(input: {
  recipe: NutriRecipe;
  exportedAt: string;
  responsibleName?: string;
}): string {
  const { recipe, exportedAt, responsibleName } = input;

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(recipe.name)} - Ficha tecnica</title>
    <style>
      body { color: #1f2937; font-family: Arial, sans-serif; line-height: 1.4; margin: 32px; }
      header { border-bottom: 2px solid #0f766e; margin-bottom: 24px; padding-bottom: 16px; }
      h1 { font-size: 26px; margin: 0 0 8px; }
      h2 { color: #0f766e; font-size: 18px; margin: 24px 0 8px; }
      .meta { color: #64748b; font-size: 13px; }
      .grid { display: grid; gap: 8px; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 16px 0; }
      .box { border: 1px solid #cbd5e1; padding: 10px; }
      .box strong { display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; }
      table { border-collapse: collapse; margin: 8px 0 18px; width: 100%; }
      th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; vertical-align: top; }
      th { background: #f1f5f9; }
      footer { border-top: 1px solid #cbd5e1; color: #64748b; font-size: 12px; margin-top: 28px; padding-top: 12px; }
      @media print { body { margin: 18mm; } button { display: none; } .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    </style>
  </head>
  <body>
    <header>
      <button onclick="window.print()">Imprimir</button>
      <h1>${escapeHtml(recipe.name)}</h1>
      <div class="meta">Categoria: ${recipe.category ? escapeHtml(recipe.category) : "-"}</div>
      <div class="meta">Status: ${formatDocumentStatus(recipe.status)} / Versao: ${recipe.version}</div>
      ${renderResponsibleMeta(responsibleName)}
      <div class="meta">Exportado em: ${formatDateTimeBR(exportedAt)}</div>
    </header>

    <section class="grid">
      <div class="box"><strong>Rendimento</strong>${recipe.yieldTotalG} g</div>
      <div class="box"><strong>Porcao</strong>${recipe.servingSizeG} g</div>
      <div class="box"><strong>Porcoes</strong>${recipe.servings}</div>
      <div class="box"><strong>Custo por porcao</strong>${formatMoney(recipe.costPerServingCents)}</div>
      <div class="box"><strong>Peso liquido total</strong>${recipe.totalNetWeightG ?? "-"} g</div>
      <div class="box"><strong>Peso bruto total</strong>${
        recipe.totalGrossWeightG ? `${recipe.totalGrossWeightG} g` : "-"
      }</div>
      <div class="box"><strong>Fator de correcao</strong>${recipe.correctionFactor ?? "-"}</div>
      <div class="box"><strong>Fator de coccao</strong>${recipe.cookingFactor ?? "-"}</div>
    </section>

    <section>
      <h2>Ingredientes</h2>
      <table>
        <thead>
          <tr>
            <th>Ingrediente</th>
            <th>Peso liquido</th>
            <th>Peso bruto</th>
            <th>FC</th>
            <th>Custo</th>
          </tr>
        </thead>
        <tbody>${renderIngredientRows(recipe)}</tbody>
      </table>
    </section>

    <section>
      <h2>Resumo nutricional</h2>
      <table>
        <thead>
          <tr>
            <th>Nutriente</th>
            <th>Total da receita</th>
            <th>Por 100 g</th>
            <th>Por porcao</th>
          </tr>
        </thead>
        <tbody>${renderNutrientTable(recipe)}</tbody>
      </table>
    </section>

    <section>
      <h2>Preparo e alergicos</h2>
      <p>${recipe.preparationMethod ? escapeHtml(recipe.preparationMethod) : "-"}</p>
      <p><strong>Alergenicos:</strong> ${
        recipe.allergens.length > 0 ? escapeHtml(recipe.allergens.join(", ")) : "-"
      }</p>
    </section>

    ${renderProfessionalReviewFooter(
      "A ficha deve ser revisada pela nutricionista responsavel antes do uso operacional.",
    )}
  </body>
</html>`;
}
