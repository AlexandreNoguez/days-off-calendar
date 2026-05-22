# Modulo Nutri - Backlog E Fases

Este backlog organiza a construcao do modulo `Nutri` em entregas pequenas. A
ordem prioriza seguranca de acesso, base de dominio, calculos confiaveis e so
depois telas mais ricas.

## Fase 0 - Decisoes Antes De Codar

1. Confirmar se `ADMIN` pode ou nao acessar dados clinicos.
2. Confirmar se o modulo sera para uma unica nutricionista ou multiplas
   nutricionistas.
3. Confirmar se o primeiro uso sera pacientes, restaurantes ou ambos.
4. Definir fonte inicial de alimentos: cadastro manual, TACO, IBGE ou importacao
   posterior.
5. Definir formato de exportacao inicial: HTML imprimivel, PDF ou XLSX.

Recomendacao: iniciar com pacientes + cadastro manual de alimentos e receitas
simples. Restaurantes entram logo depois usando a mesma base de alimentos.

## Fase 1 - Permissao E Esqueleto

**Objetivo:** criar o modulo protegido sem regra nutricional ainda.

Tarefas:

- Criar fronteira `src/modules/nutri`.
- Colocar README interno do modulo com regra de dependencias e extracao.
- Adicionar `NUTRI` em `UserRole`.
- Ajustar criacao/edicao de usuarios para aceitar perfil `NUTRI`.
- Criar helper server-side para exigir perfil `NUTRI`.
- Criar rota `/nutri`.
- Fazer `app/(main)/nutri/page.tsx` reexportar a pagina em
  `src/modules/nutri/next`.
- Criar item de menu `Nutri` visivel apenas para `NUTRI`.
- Criar `NutriPage` e `useNutriPage` vazios dentro de
  `src/modules/nutri/presentation`.
- Criar documentacao curta de permissoes no contexto do projeto.

Criterios de aceite:

- Usuario `NUTRI` consegue entrar em `/nutri`.
- Usuario `USER` nao consegue abrir `/nutri`.
- Usuario `NUTRI` nao ve menus administrativos de escala.
- Rotas futuras do modulo ja tem padrao de autorizacao definido.
- Regras, componentes e casos de uso do modulo ficam dentro de
  `src/modules/nutri`.
- A remocao do modulo exige apagar `src/modules/nutri` e os adaptadores finos em
  `app/(main)/nutri`, `app/api/nutri` e menu.

## Fase 2 - Pacientes E Avaliacoes

**Status:** em andamento. CRUD inicial de pacientes e registro de avaliacoes
com IMC implementados.

**Objetivo:** registrar dados essenciais para consulta nutricional.

Tarefas:

- [Implementado] Criar colecao `nutriPatients`.
- [Implementado] Criar colecao `nutriAssessments`.
- [Implementado] Criar CRUD de pacientes.
- [Implementado] Criar formulario de avaliacao com medidas, objetivo, rotina e
  restricoes.
- [Implementado] Criar calculo puro de IMC.
- [Implementado] Criar historico de avaliacoes por paciente.
- [Implementado para pacientes e avaliacoes] Registrar auditoria sem dados
  sensiveis no log.

Criterios de aceite:

- `NUTRI` cria, edita e consulta pacientes.
- Cada avaliacao pertence a um paciente.
- IMC aparece como calculo derivado quando peso e altura existem.
- Logs mostram acao e ids, sem anamnese ou observacoes clinicas.

## Fase 3 - Alimentos E Calculos Basicos

**Status:** implementado.

**Objetivo:** criar base de alimentos e calculos nutricionais reutilizaveis.

Tarefas:

- [Implementado] Criar entidade `NutriFood`.
- [Implementado] Criar CRUD de alimentos.
- [Implementado] Permitir fonte `MANUAL`, `LABEL`, `TACO` ou `IBGE`.
- [Implementado] Criar calculadora de nutrientes por quantidade.
- [Implementado] Criar testes unitarios para regra de proporcao por 100 g.
- [Implementado] Criar tela de busca/filtro de alimentos.

Criterios de aceite:

- `NUTRI` cadastra alimento com nutrientes por 100 g.
- Sistema calcula nutrientes para qualquer quantidade em gramas.
- Cada alimento mostra fonte e data de atualizacao.
- Testes cobrem energia, macros e arredondamento.

## Fase 4 - Plano Alimentar MVP

**Status:** implementado para MVP.

**Objetivo:** montar plano alimentar individual com totais por refeicao e por dia.

Tarefas:

- [Implementado] Criar entidade `NutriMealPlan`.
- [Implementado] Criar editor por refeicoes.
- [Implementado] Adicionar alimentos a refeicoes por gramas e medida caseira.
- [Implementado] Calcular totais por refeicao e total diario.
- [Implementado] Comparar totais com metas definidas pela nutricionista.
- [Implementado] Criar status `DRAFT`, `APPROVED` e `ARCHIVED`.
- [Implementado] Bloquear edicao direta de plano aprovado via fluxo de nova
  versao: duplicar plano salvo como `DRAFT`.
- [Implementado] Exportar versao para paciente em HTML imprimivel.

Criterios de aceite:

- Plano rascunho pode ser editado.
- Plano aprovado gera versao preservada.
- Sistema mostra diferenca entre meta e planejado.
- Exportacao contem data, paciente, responsavel, refeicoes e totais.

## Fase 5 - Receitas E Fichas Tecnicas

**Status:** implementado para MVP inicial.

**Objetivo:** permitir preparacoes para paciente e restaurante.

Tarefas:

- [Implementado] Criar entidade `NutriRecipe`.
- [Implementado no MVP] Cadastrar ingredientes com peso liquido, peso bruto e
  custo.
- [Pendente] Calcular e persistir fator de correcao/cozimento a partir de pesos.
- [Implementado] Informar rendimento final e porcao.
- [Implementado] Calcular nutrientes por receita, por 100 g e por porcao.
- [Implementado] Calcular custo total e custo por porcao.
- [Implementado] Marcar alergicos e observacoes.
- [Implementado] Exportar ficha tecnica em HTML imprimivel.
- [Implementado] Criar fluxo de aprovacao/versionamento para uso em cardapios.

Criterios de aceite:

- Receita calcula nutrientes a partir dos ingredientes.
- Receita calcula custo por porcao.
- Ficha mostra rendimento, porcao, ingredientes, preparo e alergicos.
- Receita aprovada preserva versao usada em cardapios.

## Fase 6 - Cardapios Para Restaurantes

**Objetivo:** planejar cardapios por data/refeicao e gerar apoio operacional.

Tarefas:

- Criar entidade `NutriRestaurantMenu`.
- Montar cardapio com receitas aprovadas.
- Informar numero previsto de refeicoes.
- Calcular custo total, custo per capita e nutrientes por cardapio.
- Gerar lista de compras agregada.
- Gerar mapa de producao por preparacao.
- Exportar relatorio para cozinha/compras.

Criterios de aceite:

- Cardapio aprovado preserva snapshot das receitas.
- Lista de compras soma ingredientes por quantidade prevista.
- Relatorio separa preparo, compras, custo e informacao nutricional.

## Fase 7 - Melhorias Profissionais

Ideias para depois do MVP:

- Grupos de substituicao alimentar.
- Templates de plano alimentar.
- Metas por kg de peso para macros.
- Evolucao grafica de peso, medidas e aderencia.
- Biblioteca de orientacoes por objetivo.
- Importacao estruturada de alimentos TACO/IBGE.
- Exportacao PDF com layout profissional.
- Controle de assinatura/carimbo profissional.
- Comparacao entre planos.
- Agenda de retornos.
- Multi-nutricionista com pacientes por responsavel.

## Perguntas Para O Dono Do Produto

- O foco comercial inicial e clinica individual, restaurante ou ambos?
- A nutricionista trabalha sozinha ou ha equipe?
- Precisa armazenar exames laboratoriais ou apenas valores digitados?
- Vai ter assinatura/carimbo no documento exportado?
- O paciente tera acesso ao sistema ou recebera apenas PDF/impresso?
- O restaurante precisa de ficha tecnica, rotulagem, compras ou todos?
- Existe base de alimentos preferida pela nutricionista?
- Quais formulas/calculos ela usa hoje?

## Primeira Entrega Recomendada

Implementar a Fase 1 e metade da Fase 2:

- Perfil `NUTRI`.
- Rota `/nutri`.
- CRUD de pacientes.
- Avaliacao simples com IMC.

Essa entrega valida o acesso exclusivo e cria a fundacao de dados sem entrar
ainda em prescricoes complexas.
