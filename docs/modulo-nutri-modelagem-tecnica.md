# Modulo Nutri - Modelagem Tecnica Inicial

Este documento descreve uma proposta tecnica inicial para adicionar o modulo
`Nutri` sem misturar regras de nutricao com o dominio atual de escala de folgas.

## Decisoes De Arquitetura

- O modulo deve viver como monolito modular em `src/modules/nutri`.
- O perfil `NUTRI` deve ser adicionado ao contrato compartilhado `UserRole`.
- Autorizacao deve ser validada no server, nunca apenas no menu.
- A UI deve seguir o padrao atual: componente de tela simples e hook dedicado,
  mas dentro da pasta do modulo.
- Calculos nutricionais devem ser funcoes puras em
  `src/modules/nutri/application`.
- Tipos e entidades de nutricao devem ficar em `src/modules/nutri/domain`.
- Persistencia deve ficar em `src/modules/nutri/infra`.
- Rotas em `app/` devem ser adaptadores finos que reexportam paginas e handlers
  de `src/modules/nutri/next`.
- O modulo nao deve importar codigo de escala de folgas, regras de escala ou
  componentes globais de workspace.

## Estrutura Sugerida

```txt
app/(main)/nutri/page.tsx
app/api/nutri/patients/route.ts
app/api/nutri/patients/[id]/route.ts
app/api/nutri/foods/route.ts
app/api/nutri/recipes/route.ts
app/api/nutri/meal-plans/route.ts
app/api/nutri/menus/route.ts
src/modules/nutri/README.md
src/modules/nutri/module.ts
src/modules/nutri/domain/types.ts
src/modules/nutri/domain/calculationTypes.ts
src/modules/nutri/application/calculateImc.ts
src/modules/nutri/application/calculateMealPlanTotals.ts
src/modules/nutri/application/calculateRecipeNutrition.ts
src/modules/nutri/application/calculateRecipeCost.ts
src/modules/nutri/contracts/api.ts
src/modules/nutri/infra/nutriRepositories.ts
src/modules/nutri/next/pages/NutriPageRoute.tsx
src/modules/nutri/next/api/patientsRoute.ts
src/modules/nutri/presentation/NutriPage.tsx
src/modules/nutri/presentation/hooks/useNutriPage.ts
src/modules/nutri/tests/calculateImc.test.ts
```

Se o modulo crescer, dividir `NutriPage` em subviews:

- `src/modules/nutri/presentation/NutriPatientsView.tsx`.
- `src/modules/nutri/presentation/NutriAssessmentView.tsx`.
- `src/modules/nutri/presentation/NutriMealPlanView.tsx`.
- `src/modules/nutri/presentation/NutriRecipesView.tsx`.
- `src/modules/nutri/presentation/NutriMenusView.tsx`.

## Regra De Monolito Modular

O codigo de produto de nutricao deve ficar dentro de `src/modules/nutri`.
Arquivos fora dessa pasta podem existir por exigencia do Next.js ou para integrar
o modulo ao shell principal, mas precisam ser pequenos adaptadores.

### Permitido Fora Da Pasta Nutri

- `app/(main)/nutri/page.tsx`: reexporta a pagina do modulo.
- `app/api/nutri/**/route.ts`: reexporta handlers do modulo.
- `src/components/hooks/useMainShell.ts`: registra o item de menu `Nutri`.
- `src/lib/types.ts`: adiciona `NUTRI` ao `UserRole` global.
- `src/lib/server/auth.ts`: adiciona helper de autorizacao ou chama helper do
  modulo.

### Nao Permitido Fora Da Pasta Nutri

- Regras de calculo nutricional.
- Tipos ricos de paciente, plano alimentar, receita ou cardapio.
- Componentes de tela do modulo.
- Repositorios MongoDB especificos de nutricao.
- Formatadores/exportadores especificos de plano alimentar ou ficha tecnica.

### Adaptadores Next.js

Exemplo de pagina:

```ts
export { default } from "@/src/modules/nutri/next/pages/NutriPageRoute";
```

Exemplo de API route:

```ts
export { GET, POST } from "@/src/modules/nutri/next/api/patientsRoute";
```

Essa regra existe porque o Next.js precisa descobrir paginas e APIs pela pasta
`app/`. O restante do codigo fica dentro do modulo.

## Extracao Para Um Projeto Next.js Proprio

A extracao deve ser planejada como copia da pasta `src/modules/nutri` mais
criacao dos adaptadores de host no novo projeto.

Checklist:

1. Criar novo projeto Next.js.
2. Copiar `src/modules/nutri`.
3. Copiar ou recriar `app/(main)/nutri` e `app/api/nutri`.
4. Criar no novo projeto os adaptadores de host exigidos pelo modulo:
   autenticacao, permissao `NUTRI`, MongoDB, auditoria, tema e toast.
5. Manter `src/shared` apenas para utilitarios genericos; se o modulo usar algo
   compartilhado, copiar esse utilitario ou substituir por dependencia local.
6. Rodar testes do modulo.
7. Rodar `npm run build`.

## Alteracoes Em Autenticacao

Contrato atual:

```ts
export type UserRole = "ADMIN" | "USER";
```

Proposta:

```ts
export type UserRole = "ADMIN" | "USER" | "NUTRI";
```

Helpers server-side sugeridos:

```ts
export async function requireNutriUser(): Promise<PublicUser> {
  const user = await requireCurrentUser();
  if (user.role !== "NUTRI") throw new Error("Forbidden");
  return user;
}

export async function requireNutriOrAdminUser(): Promise<PublicUser> {
  const user = await requireCurrentUser();
  if (user.role !== "NUTRI" && user.role !== "ADMIN") throw new Error("Forbidden");
  return user;
}
```

Decisao pendente: se `ADMIN` pode abrir dados clinicos. Recomendacao inicial:
`ADMIN` gerencia usuarios e configuracoes, mas prontuarios e planos ficam
restritos a `NUTRI`.

## Navegacao

Adicionar novo tipo para item de menu com permissao por perfil:

```ts
export type NavItem = {
  label: string;
  href: string;
  allowedRoles?: UserRole[];
};
```

Exemplo:

```ts
const NAV_ITEMS: NavItem[] = [
  { label: "Setup", href: "/setup", allowedRoles: ["ADMIN"] },
  { label: "Cadastros", href: "/cadastros", allowedRoles: ["ADMIN"] },
  { label: "Escala", href: "/schedule", allowedRoles: ["ADMIN", "USER"] },
  { label: "Nutri", href: "/nutri", allowedRoles: ["NUTRI"] },
  { label: "Administrador", href: "/admin", allowedRoles: ["ADMIN"] },
];
```

## Entidades Principais

### Patient

```ts
export type NutriPatient = {
  id: string;
  fullName: string;
  birthDate?: string;
  sex?: "FEMALE" | "MALE" | "OTHER" | "NOT_INFORMED";
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
```

Evitar campos altamente sensiveis no MVP se nao forem necessarios.

### Assessment

```ts
export type NutriAssessment = {
  id: string;
  patientId: string;
  date: string;
  objective?: string;
  weightKg?: number;
  heightCm?: number;
  waistCm?: number;
  hipCm?: number;
  activityLevel?: string;
  allergies: string[];
  intolerances: string[];
  dietaryRestrictions: string[];
  medications?: string;
  supplements?: string;
  foodRoutineNotes?: string;
  clinicalNotes?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};
```

### Food

```ts
export type NutriFood = {
  id: string;
  name: string;
  source: "TACO" | "IBGE" | "LABEL" | "MANUAL";
  sourceVersion?: string;
  servingDescription?: string;
  nutrientsPer100g: {
    energyKcal: number;
    carbohydrateG?: number;
    proteinG?: number;
    fatG?: number;
    saturatedFatG?: number;
    fiberG?: number;
    sodiumMg?: number;
    addedSugarG?: number;
  };
  allergens?: string[];
  createdAt: string;
  updatedAt: string;
};
```

### Recipe

```ts
export type NutriRecipe = {
  id: string;
  name: string;
  category?: string;
  ingredients: NutriRecipeIngredient[];
  yieldTotalG?: number;
  servingSizeG?: number;
  servings?: number;
  preparationMethod?: string;
  allergens?: string[];
  costCents?: number;
  createdAt: string;
  updatedAt: string;
};

export type NutriRecipeIngredient = {
  foodId: string;
  grossWeightG?: number;
  netWeightG: number;
  correctionFactor?: number;
  cookingFactor?: number;
  unitCostCents?: number;
};
```

### Meal Plan

```ts
export type NutriMealPlan = {
  id: string;
  patientId: string;
  assessmentId?: string;
  title: string;
  status: "DRAFT" | "APPROVED" | "ARCHIVED";
  target: {
    energyKcal?: number;
    carbohydrateG?: number;
    proteinG?: number;
    fatG?: number;
    fiberG?: number;
    sodiumMg?: number;
  };
  meals: NutriMeal[];
  approvedAt?: string;
  approvedByUserId?: string;
  createdAt: string;
  updatedAt: string;
};

export type NutriMeal = {
  id: string;
  name: string;
  time?: string;
  items: NutriMealItem[];
};

export type NutriMealItem = {
  foodId?: string;
  recipeId?: string;
  amountG: number;
  householdMeasure?: string;
  substitutionGroupId?: string;
  notes?: string;
};
```

### Restaurant Menu

```ts
export type NutriRestaurantMenu = {
  id: string;
  unitName?: string;
  dateISO: string;
  mealName: string;
  expectedMeals: number;
  recipeIds: string[];
  status: "DRAFT" | "APPROVED" | "ARCHIVED";
  approvedAt?: string;
  approvedByUserId?: string;
  createdAt: string;
  updatedAt: string;
};
```

## Colecoes MongoDB

Sugestao:

- `nutriPatients`
- `nutriAssessments`
- `nutriFoods`
- `nutriRecipes`
- `nutriMealPlans`
- `nutriRestaurantMenus`
- `nutriExports`

Indices iniciais:

- `nutriPatients.fullName`
- `nutriAssessments.patientId`
- `nutriAssessments.date`
- `nutriMealPlans.patientId`
- `nutriMealPlans.status`
- `nutriFoods.name`
- `nutriRecipes.name`
- `nutriRestaurantMenus.dateISO`
- `nutriRestaurantMenus.status`

## Calculos Do MVP

### IMC

Entrada:

- Peso em kg.
- Altura em cm.

Saida:

- IMC numerico.
- Classificacao opcional, se configurada.

### Totais De Plano Alimentar

Entrada:

- Refeicoes.
- Itens com alimento/receita e quantidade.
- Base nutricional por 100 g.

Saida:

- Total por refeicao.
- Total por dia.
- Diferenca versus meta.

### Receita

Entrada:

- Ingredientes.
- Peso liquido.
- Rendimento final.
- Porcao.

Saida:

- Nutrientes totais da receita.
- Nutrientes por 100 g.
- Nutrientes por porcao.
- Custo total.
- Custo por porcao.

## Auditoria

Acoes sugeridas:

- `nutri.patient.created`
- `nutri.patient.updated`
- `nutri.assessment.created`
- `nutri.assessment.updated`
- `nutri.food.created`
- `nutri.food.updated`
- `nutri.recipe.created`
- `nutri.recipe.updated`
- `nutri.meal_plan.created`
- `nutri.meal_plan.updated`
- `nutri.meal_plan.approved`
- `nutri.meal_plan.exported`
- `nutri.restaurant_menu.created`
- `nutri.restaurant_menu.updated`
- `nutri.restaurant_menu.approved`
- `nutri.restaurant_menu.exported`

Logs devem guardar apenas metadados operacionais, como ids e status. Nao guardar
anamnese, notas clinicas, diagnostico, exames ou plano alimentar completo no log.

## Validacoes Obrigatorias

- Quantidades nao podem ser negativas.
- Alimento precisa ter energia ou fonte manual justificada.
- Plano aprovado nao deve ser editado diretamente; criar nova versao.
- Receita aprovada usada em cardapio deve preservar snapshot ou versao.
- Exportacao deve registrar qual versao foi exportada.
- Toda alteracao de plano/cardapio aprovado deve criar rascunho novo.

## Tela Do MVP

Primeira tela `/nutri` pode ter abas:

- `Pacientes`
- `Plano alimentar`
- `Alimentos`
- `Receitas`
- `Cardapios`

Layout recomendado:

- Lista lateral ou tabela de pacientes/itens.
- Area principal com formulario e resumo de calculos.
- Painel de totais fixo no topo ou lateral.
- Alertas discretos para divergencias de meta.

## Testes Recomendados

- Testes unitarios dos calculos nutricionais.
- Testes de permissao server-side para cada rota `/api/nutri/*`.
- Teste de menu: `NUTRI` ve `Nutri`, nao ve admin/escala administrativa.
- Teste de exportacao: documento contem data, responsavel e totais calculados.
- Teste de versionamento: plano aprovado nao e sobrescrito.
