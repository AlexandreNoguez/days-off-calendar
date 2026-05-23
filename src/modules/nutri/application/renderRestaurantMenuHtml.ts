import type { NutriNutrients, NutriRestaurantMenu } from "../domain/types";

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

function formatMoney(value: number | undefined): string {
  if (typeof value !== "number") return "-";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

function renderNutrientRows(menu: NutriRestaurantMenu): string {
  return NUTRIENT_ROWS.map((row) => `<tr>
      <td>${row.label}</td>
      <td>${formatNutrient(menu.totals[row.key], row.unit)}</td>
    </tr>`).join("");
}

function renderShoppingRows(menu: NutriRestaurantMenu): string {
  return menu.shoppingList
    .map((item) => `<tr>
      <td>${escapeHtml(item.foodNameSnapshot)}</td>
      <td>${item.totalNetWeightG} g</td>
      <td>${item.totalGrossWeightG ? `${item.totalGrossWeightG} g` : "-"}</td>
      <td>${escapeHtml(item.recipeNames.join(", "))}</td>
    </tr>`)
    .join("");
}

function renderProductionRows(menu: NutriRestaurantMenu): string {
  return menu.items
    .map((item) => {
      const totalWeightG = Math.round(item.servings * item.servingSizeGSnapshot * 10) / 10;

      return `<tr>
        <td>${escapeHtml(item.mealName)}</td>
        <td>${escapeHtml(item.recipeNameSnapshot)} v${item.recipeVersionSnapshot}</td>
        <td>${item.servings}</td>
        <td>${item.servingSizeGSnapshot} g</td>
        <td>${totalWeightG} g</td>
        <td>${item.preparationMethodSnapshot ? escapeHtml(item.preparationMethodSnapshot) : "-"}</td>
      </tr>`;
    })
    .join("");
}

export function renderRestaurantMenuHtml(input: {
  menu: NutriRestaurantMenu;
  exportedAt: string;
}): string {
  const { menu, exportedAt } = input;

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(menu.title)} - Relatorio operacional</title>
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
      <h1>${escapeHtml(menu.title)}</h1>
      <div class="meta">Data: ${new Date(`${menu.date}T00:00:00`).toLocaleDateString("pt-BR")}</div>
      <div class="meta">Status: ${menu.status}</div>
      <div class="meta">Exportado em: ${new Date(exportedAt).toLocaleString("pt-BR")}</div>
    </header>

    <section class="grid">
      <div class="box"><strong>Refeicoes previstas</strong>${menu.expectedMeals ?? "-"}</div>
      <div class="box"><strong>Preparacoes</strong>${menu.items.length}</div>
      <div class="box"><strong>Custo total</strong>${formatMoney(menu.totalCostCents)}</div>
      <div class="box"><strong>Custo per capita</strong>${formatMoney(menu.costPerCapitaCents)}</div>
    </section>

    <section>
      <h2>Resumo nutricional</h2>
      <table>
        <thead>
          <tr>
            <th>Nutriente</th>
            <th>Total planejado</th>
          </tr>
        </thead>
        <tbody>${renderNutrientRows(menu)}</tbody>
      </table>
    </section>

    <section>
      <h2>Lista de compras</h2>
      <table>
        <thead>
          <tr>
            <th>Ingrediente</th>
            <th>Peso liquido</th>
            <th>Peso bruto</th>
            <th>Receitas</th>
          </tr>
        </thead>
        <tbody>${renderShoppingRows(menu)}</tbody>
      </table>
    </section>

    <section>
      <h2>Mapa de producao</h2>
      <table>
        <thead>
          <tr>
            <th>Refeicao</th>
            <th>Preparacao</th>
            <th>Porcoes</th>
            <th>Porcao</th>
            <th>Total produzido</th>
            <th>Preparo</th>
          </tr>
        </thead>
        <tbody>${renderProductionRows(menu)}</tbody>
      </table>
    </section>

    <footer>
      Documento operacional para apoio de cozinha e compras. Revise quantidades,
      rendimento e disponibilidade de ingredientes antes da producao.
    </footer>
  </body>
</html>`;
}
