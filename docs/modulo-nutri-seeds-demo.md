# Modulo Nutri - Plano Para Seeds De Demo

Este documento define como adicionar dados demonstrativos ao modulo `Nutri`
sem misturar esses dados com regra de produto e sem deixar botoes perigosos em
producao.

## Decisao Recomendada

Implementar seeds como **ferramenta de demo/desenvolvimento**, nao como fluxo de
produto.

O desenho recomendado e:

- Geradores server-side isolados em `src/modules/nutri/dev`.
- Rotas finas em `app/api/nutri/dev/seed/*`.
- Botoes por aba renderizados apenas quando uma flag de ambiente estiver ativa.
- Protecao server-side exigindo perfil `NUTRI`.
- Bloqueio por padrao em producao.

Essa abordagem atende ao pedido de ter um botao por aba e, ao mesmo tempo,
mantem a remocao simples: desligar a flag, ou apagar a pasta `dev` e os
adaptadores `app/api/nutri/dev`.

## Flags De Ambiente

Adicionar futuramente ao `.env.example`:

```env
NUTRI_DEMO_TOOLS_ENABLED=false
```

Comportamento:

- `false`: nenhum botao de seed aparece e as rotas de seed retornam bloqueio.
- `true`: botoes aparecem para usuarios `NUTRI` em ambiente local/demo.
- Em `NODE_ENV=production`, a recomendacao e manter bloqueado mesmo que alguem
  esqueca a flag ligada.

Se um dia for necessario rodar demo em ambiente publicado, criar uma segunda
flag explicita:

```env
NUTRI_DEMO_TOOLS_ALLOW_PRODUCTION=false
```

Essa segunda flag deve existir apenas se houver uma necessidade real de demo
publica.

## Estrutura Implementada

```txt
app/api/nutri/dev/seed/patients/route.ts
app/api/nutri/dev/seed/foods/route.ts
app/api/nutri/dev/seed/meal-plans/route.ts
app/api/nutri/dev/seed/recipes/route.ts
app/api/nutri/dev/seed/restaurant-menus/route.ts
app/api/nutri/dev/seed/status/route.ts

src/modules/nutri/dev/demoSeedData.ts
src/modules/nutri/dev/demoSeedGuards.ts
src/modules/nutri/dev/demoSeeds.ts
src/modules/nutri/next/api/devSeedRoutes.ts
src/modules/nutri/presentation/NutriPage.tsx
```

As rotas em `app/` continuam sendo apenas adaptadores do Next.js. A regra de
seed fica dentro do modulo.

## Comportamento Por Aba

Cada aba tera um botao discreto de seed, exibido apenas em modo demo:

- Aba `Pacientes`: cria 5 pacientes demo.
- Aba `Alimentos`: cria 5 alimentos demo.
- Aba `Planos`: cria 5 planos alimentares demo.
- Aba `Receitas`: cria 5 receitas/fichas tecnicas demo.
- Aba `Cardapios`: cria 5 cardapios de restaurante demo.

Texto sugerido dos botoes:

- `Seed 5 pacientes`
- `Seed 5 alimentos`
- `Seed 5 planos`
- `Seed 5 receitas`
- `Seed 5 cardapios`

## Dependencias Entre Seeds

Algumas abas dependem de dados anteriores. Para o botao ser util sem obrigar o
usuario a clicar em ordem, cada seed deve garantir suas dependencias minimas.

### Pacientes

Cria 5 pacientes com:

- nome ficticio marcado como demo;
- nascimento;
- sexo;
- contato ficticio;
- notas simples.

Opcionalmente pode criar uma avaliacao inicial para cada paciente, mas o botao
deve reportar isso separadamente.

### Alimentos

Cria 5 alimentos manuais com nutrientes por 100 g:

- arroz cozido;
- feijao cozido;
- frango grelhado;
- banana;
- azeite.

Os nomes devem carregar um marcador claro, como `[Demo]`, para facilitar busca e
limpeza manual.

### Planos Alimentares

Para criar 5 planos, o seed deve:

1. Usar pacientes ativos existentes, se houver.
2. Criar pacientes demo de apoio se nao houver pacientes suficientes.
3. Usar alimentos ativos existentes, se houver.
4. Criar alimentos demo de apoio se nao houver alimentos suficientes.
5. Criar 5 planos em `DRAFT`, cada um com refeicoes e totais calculados.

### Receitas

Para criar 5 receitas, o seed deve:

1. Usar alimentos existentes ou criar alimentos demo de apoio.
2. Criar receitas com ingredientes, rendimento, porcao, custo e preparo.
3. Deixar as receitas em `APPROVED` por padrao, para que a aba de cardapios
   possa ser testada imediatamente.

Receitas sugeridas:

- arroz e feijao;
- frango com legumes;
- salada completa;
- vitamina de banana;
- bowl proteico.

### Cardapios

Para criar 5 cardapios, o seed deve:

1. Usar receitas aprovadas existentes.
2. Criar receitas demo aprovadas se nao houver receitas suficientes.
3. Criar cardapios com data, refeicoes previstas, receitas, custo, nutrientes e
   lista de compras.
4. Deixar alguns cardapios em `DRAFT` e outros em `APPROVED`, para testar a UI.

## Formato De Resposta Da API

Todas as rotas de seed devem retornar um resumo previsivel:

```ts
type NutriDemoSeedResponse = {
  created: number;
  reused: number;
  dependenciesCreated: number;
  entityType:
    | "patients"
    | "foods"
    | "mealPlans"
    | "recipes"
    | "restaurantMenus";
};
```

O frontend usa esse retorno para exibir uma mensagem do tipo:

`5 receitas demo criadas.`

## Auditoria

Cada seed deve registrar auditoria sem dados sensiveis:

- `nutri.demo_seed.patients`
- `nutri.demo_seed.foods`
- `nutri.demo_seed.meal_plans`
- `nutri.demo_seed.recipes`
- `nutri.demo_seed.restaurant_menus`

Metadata permitida:

- tipo da entidade;
- quantidade criada;
- quantidade reutilizada;
- ids criados, se necessario para diagnostico.

Nao registrar anamnese, notas clinicas extensas ou dados sensiveis.

## Idempotencia E Limpeza

O botao deve criar 5 novos itens a cada clique, mas todos devem ser facilmente
identificaveis:

- prefixo no nome/titulo: `[Demo]`;
- timestamps ou sufixos curtos para evitar conflito;
- auditoria com acao de demo seed.

Uma limpeza automatica pode ser uma etapa futura:

```txt
DELETE /api/nutri/dev/seed/demo-data
```

Por enquanto, a limpeza manual por busca `[Demo]` e suficiente para o MVP.

## Como Remover Antes De Producao

O caminho recomendado e **desligar por flag**:

```env
NUTRI_DEMO_TOOLS_ENABLED=false
```

Se quiser remover fisicamente:

1. Apagar `src/modules/nutri/dev`.
2. Apagar `app/api/nutri/dev`.
3. Remover `NutriSeedButton` da UI.
4. Remover tipos/contratos de seed, se existirem.
5. Rodar `npm run lint`, `npm test` e `npm run build`.

## Alternativa Sem Botoes

A alternativa mais limpa para producao seria um script CLI:

```txt
npm run seed:nutri-demo
```

Vantagens:

- zero UI temporaria;
- menor risco de usuario clicar sem querer;
- mais simples para staging/demo.

Desvantagem:

- menos pratico para testar a tela enquanto se navega pelo modulo.

Para este projeto, a recomendacao e o hibrido:

- manter geradores reutilizaveis server-side;
- expor por botoes apenas quando `NUTRI_DEMO_TOOLS_ENABLED=true`;
- no futuro, se desejado, reaproveitar os mesmos geradores em um script CLI.

## Criterios De Aceite Da Implementacao

- Com a flag desligada, nenhum botao aparece.
- Com a flag desligada, chamadas diretas para rotas de seed sao bloqueadas.
- Usuario sem perfil `NUTRI` nao consegue executar seed.
- Cada aba possui botao de seed para criar 5 itens do proprio contexto.
- Seeds de planos, receitas e cardapios criam dependencias minimas quando
  necessario.
- Cardapios gerados usam apenas receitas aprovadas.
- Dados demo ficam identificaveis por `[Demo]`.
- `tsc`, lint, testes e build passam.
