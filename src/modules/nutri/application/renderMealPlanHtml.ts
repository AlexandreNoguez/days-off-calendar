import type { NutriMealPlan, NutriNutrients, NutriPatient } from "../domain/types";

const NUTRIENT_ROWS: Array<{
  key: keyof NutriNutrients;
  label: string;
  unit: string;
}> = [
  { key: "energyKcal", label: "Energia", unit: "kcal" },
  { key: "carbohydrateG", label: "Carboidrato", unit: "g" },
  { key: "proteinG", label: "Proteina", unit: "g" },
  { key: "fatG", label: "Gordura", unit: "g" },
  { key: "fiberG", label: "Fibra", unit: "g" },
  { key: "sodiumMg", label: "Sodio", unit: "mg" },
];

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatNutrient(value: number | undefined, unit: string): string {
  if (typeof value !== "number") return "-";
  return `${value} ${unit}`;
}

function renderNutrientTable(mealPlan: NutriMealPlan): string {
  return NUTRIENT_ROWS.map((row) => {
    const target = mealPlan.target[row.key];
    const total = mealPlan.totals[row.key];
    const diff =
      typeof total === "number" && typeof target === "number"
        ? Math.round((total - target) * 10) / 10
        : undefined;

    return `<tr>
      <td>${row.label}</td>
      <td>${formatNutrient(target, row.unit)}</td>
      <td>${formatNutrient(total, row.unit)}</td>
      <td>${formatNutrient(diff, row.unit)}</td>
    </tr>`;
  }).join("");
}

export function renderMealPlanHtml(input: {
  mealPlan: NutriMealPlan;
  patient: NutriPatient;
  exportedAt: string;
}): string {
  const { mealPlan, patient, exportedAt } = input;

  const meals = mealPlan.meals
    .map(
      (meal) => `
        <section>
          <h2>${escapeHtml(meal.name)}</h2>
          <table>
            <thead>
              <tr>
                <th>Alimento</th>
                <th>Quantidade</th>
                <th>Medida caseira</th>
              </tr>
            </thead>
            <tbody>
              ${meal.items
                .map(
                  (item) => `<tr>
                    <td>${escapeHtml(item.foodNameSnapshot)}</td>
                    <td>${item.amountG} g</td>
                    <td>${item.householdMeasure ? escapeHtml(item.householdMeasure) : "-"}</td>
                  </tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </section>`,
    )
    .join("");

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(mealPlan.title)} - ${escapeHtml(patient.fullName)}</title>
    <style>
      body { color: #1f2937; font-family: Arial, sans-serif; line-height: 1.4; margin: 32px; }
      header { border-bottom: 2px solid #0f766e; margin-bottom: 24px; padding-bottom: 16px; }
      h1 { font-size: 26px; margin: 0 0 8px; }
      h2 { color: #0f766e; font-size: 18px; margin: 24px 0 8px; }
      .meta { color: #64748b; font-size: 13px; }
      table { border-collapse: collapse; margin: 8px 0 18px; width: 100%; }
      th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; vertical-align: top; }
      th { background: #f1f5f9; }
      footer { border-top: 1px solid #cbd5e1; color: #64748b; font-size: 12px; margin-top: 28px; padding-top: 12px; }
      @media print { body { margin: 18mm; } button { display: none; } }
    </style>
  </head>
  <body>
    <header>
      <button onclick="window.print()">Imprimir</button>
      <h1>${escapeHtml(mealPlan.title)}</h1>
      <div class="meta">Paciente: ${escapeHtml(patient.fullName)}</div>
      <div class="meta">Status: ${mealPlan.status}</div>
      <div class="meta">Exportado em: ${new Date(exportedAt).toLocaleString("pt-BR")}</div>
    </header>

    <section>
      <h2>Resumo nutricional</h2>
      <table>
        <thead>
          <tr>
            <th>Nutriente</th>
            <th>Meta</th>
            <th>Planejado</th>
            <th>Diferenca</th>
          </tr>
        </thead>
        <tbody>${renderNutrientTable(mealPlan)}</tbody>
      </table>
    </section>

    ${meals}

    <footer>
      Documento gerado como apoio tecnico. A orientacao final deve ser revisada
      pela nutricionista responsavel.
    </footer>
  </body>
</html>`;
}
