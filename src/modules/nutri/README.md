# Nutri Module

Modulo planejado para concentrar tudo que pertence ao produto de nutricao:
dominio, casos de uso, componentes, hooks, handlers server-side, contratos e
testes.

Esta pasta deve ser tratada como uma fronteira de modulo dentro do monolito.
Arquivos fora dela podem chamar apenas a API publica do modulo. O modulo pode
depender de `src/shared` e de adaptadores explicitos do host, mas nao deve
importar regras do dominio de escala de folgas.

## Objetivo Da Fronteira

- Permitir desenvolver o modulo `NUTRI` dentro do projeto atual.
- Manter baixo acoplamento com escala, cadastros e regras operacionais.
- Facilitar extracao futura para um projeto Next.js proprio.
- Concentrar documentacao tecnica do modulo perto do codigo.

## Estrutura Alvo

```txt
src/modules/nutri/
  application/
  contracts/
  domain/
  infra/
  next/
  presentation/
  tests/
  module.ts
```

## Entregas Implementadas

- Pacientes e avaliacoes nutricionais com IMC.
- Base manual de alimentos com nutrientes por 100 g.
- Planos alimentares por paciente com metas, totais, impressao e duplicacao.
- Receitas/fichas tecnicas com ingredientes, rendimento, porcao, fatores
  tecnicos, nutrientes e custo.
- Cardapios para restaurantes com receitas aprovadas, custo per capita, totais
  nutricionais, lista de compras agregada e relatorio operacional imprimivel.
- Ferramenta de seed demo por aba, protegida por flag de ambiente e isolada em
  `src/modules/nutri/dev`, com limpeza automatica dos dados `[Demo]`.

## Regra De Dependencias

Permitido:

- `src/modules/nutri/*` importar outros arquivos dentro de
  `src/modules/nutri`.
- `src/modules/nutri/*` importar `src/shared/*` quando o utilitario for
  realmente generico.
- `src/modules/nutri/infra/*` importar adaptadores server-side do host, como
  MongoDB e auditoria, por meio de portas/interfaces.
- `app/(main)/nutri/*` e `app/api/nutri/*` importarem arquivos de
  `src/modules/nutri/next/*`.

Evitar:

- Importar `src/components/WorkspacePage`.
- Importar `src/application/usecases/schedule`.
- Importar `src/domain/types/schedule`.
- Misturar colecoes de escala com colecoes de nutricao.
- Colocar regras de nutricao em `src/components` ou `src/application` global.

## Como O Next.js Entra

O Next.js descobre paginas e APIs pela pasta `app/`. Por isso, a pasta `app/`
tera apenas arquivos ponte:

```ts
export { default } from "@/src/modules/nutri/next/pages/NutriPageRoute";
```

ou:

```ts
export { GET, POST } from "@/src/modules/nutri/next/api/patientsRoute";
```

Assim, ao extrair o modulo para outro projeto, basta copiar esta pasta e recriar
ou mover esses adaptadores para o novo `app/`.

## Extracao Para Projeto Proprio

Quando o modulo precisar virar um projeto Next.js independente:

1. Criar um novo projeto Next.js com a mesma stack base.
2. Copiar `src/modules/nutri` para o novo projeto.
3. Copiar os adaptadores `app/(main)/nutri` e `app/api/nutri`.
4. Implementar os adaptadores de host exigidos pelo modulo, como autenticacao,
   MongoDB, auditoria, tema e toast.
5. Trocar imports de host por implementacoes locais do novo projeto.
6. Rodar testes do modulo e build do novo app.

O objetivo e que a maior parte do codigo de produto esteja aqui, nao espalhada
pelo monolito.
