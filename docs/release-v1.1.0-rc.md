# Release v1.1.0-rc - Planejamento Do Modulo Nutri

Data alvo: a definir

## Posicionamento

A `v1.1.0-rc` e a primeira release candidate do modulo `Nutri` dentro da
aplicacao atual. O objetivo nao e declarar o modulo como produto clinico final,
mas estabilizar um MVP profissional para uso controlado por perfil `NUTRI`, com
pacientes, avaliacoes, alimentos, planos alimentares, receitas, fichas tecnicas,
cardapios, calculos, auditoria e exportacoes HTML imprimiveis.

A aplicacao de gestao de folgas permanece estavel como v1.0.0. Esta RC concentra
o risco e a validacao no modulo de nutricao.

## Estado Atual Encontrado

- Perfil `NUTRI` ja existe no contrato global de usuarios.
- Menu `Nutri` fica visivel apenas para `NUTRI`.
- `/nutri` usa pagina do modulo em `src/modules/nutri/next/pages`.
- Rotas `app/api/nutri/*` sao adaptadores finos para handlers do modulo.
- Rotas e pagina do modulo exigem `requireNutriUser`.
- `ADMIN` gerencia usuarios, mas nao acessa dados clinicos por padrao.
- Pacientes e avaliacoes com IMC estao implementados.
- Alimentos manuais com nutrientes por 100 g estao implementados.
- Planos alimentares com metas, totais, aprovacao, duplicacao e impressao estao
  implementados.
- Receitas/fichas tecnicas com rendimento, porcao, fatores tecnicos, nutrientes,
  custo, aprovacao, duplicacao e impressao estao implementadas.
- Cardapios de restaurante com receitas aprovadas, custo, nutrientes, compras,
  producao e impressao estao implementados.
- Seeds demo por aba existem e sao protegidos por flags de ambiente.
- Testes unitarios cobrem calculos principais do modulo.

## Decisoes Fechadas Para A RC

- Acesso a dados Nutri: somente perfil `NUTRI`.
- `ADMIN` pode criar/editar usuarios `NUTRI`, mas nao abre prontuarios, planos
  ou dados clinicos.
- Fonte inicial de alimentos: cadastro manual, com campo de origem
  `MANUAL`, `LABEL`, `TACO` ou `IBGE`; importacao estruturada fica fora da RC.
- Exportacao inicial: HTML imprimivel, nao PDF nativo.
- Uso recomendado da RC: validacao profissional controlada, com dados reais
  apenas apos revisao de privacidade, ambiente e backup.
- Seeds demo permanecem ferramenta de demo/desenvolvimento e devem ficar
  desabilitados por padrao em producao.

## Incluido Na v1.1.0-rc

### Seguranca E Permissoes

- Perfil `NUTRI`.
- Acesso exclusivo a `/nutri`.
- Bloqueio server-side de todas as rotas `/api/nutri/*`.
- Bloqueio de usuario `NUTRI` nas areas de escala, admin e app-state global.
- Auditoria de criacao, alteracao, aprovacao, duplicacao, exportacao e seeds.
- Logs sem anamnese, notas clinicas, planos completos ou dados sensiveis.

### Pacientes E Avaliacoes

- Cadastro, edicao, arquivamento e busca de pacientes.
- Registro de avaliacoes por paciente.
- Calculo de IMC como campo derivado.
- Historico de avaliacoes do paciente selecionado.

### Alimentos E Calculos

- Cadastro, edicao, arquivamento e busca de alimentos.
- Nutrientes por 100 g.
- Fonte e versao da fonte.
- Alergenicos.
- Calculo proporcional por quantidade.

### Planos Alimentares

- Criacao de plano alimentar por paciente.
- Refeicoes com alimentos, gramas e medida caseira.
- Metas nutricionais definidas pela nutricionista.
- Totais por plano e comparacao com metas.
- Status `DRAFT`, `APPROVED` e `ARCHIVED`.
- Duplicacao de plano para nova versao em rascunho.
- Exportacao HTML imprimivel para paciente.

### Receitas E Fichas Tecnicas

- Criacao de receitas com ingredientes.
- Peso liquido, peso bruto e custo.
- Rendimento, porcao, numero de porcoes.
- Fator de correcao e fator de coccao.
- Nutrientes totais, por 100 g e por porcao.
- Custo total e custo por porcao.
- Status `DRAFT`, `APPROVED` e `ARCHIVED`.
- Duplicacao de receita para nova versao em rascunho.
- Exportacao HTML imprimivel de ficha tecnica.

### Cardapios De Restaurante

- Criacao de cardapio por data.
- Uso apenas de receitas aprovadas.
- Numero previsto de refeicoes.
- Custo total e custo per capita.
- Totais nutricionais do cardapio.
- Lista de compras agregada.
- Mapa de producao por preparacao.
- Status `DRAFT`, `APPROVED` e `ARCHIVED`.
- Exportacao HTML imprimivel operacional.

### Seeds Demo

- Botoes por aba apenas quando `NUTRI_DEMO_TOOLS_ENABLED=true`.
- Bloqueio em producao salvo se `NUTRI_DEMO_TOOLS_ALLOW_PRODUCTION=true`.
- Limpeza automatica de dados `[Demo]`.
- Auditoria especifica de seeds.

## Fora Do Escopo Da v1.1.0-rc

- Diagnostico medico automatizado.
- Prescricao automatica sem revisao profissional.
- Prontuario medico completo.
- Agenda, financeiro, teleconsulta ou notificacoes.
- Portal do paciente.
- Multi-nutricionista com propriedade de pacientes.
- Acesso administrativo a dados clinicos.
- Importacao estruturada TACO/IBGE.
- Base oficial versionada embutida no produto.
- PDF nativo com layout final.
- Assinatura digital, carimbo profissional ou CRN configuravel.
- Rotulagem legal completa para impressao final.
- Calculos de gasto energetico, formulas de VET ou prescricao automatica de
  macros.
- Anexos de exames laboratoriais.

## Plano De Etapas Para Fechar A RC

### Etapa 1 - Planejamento Da Release

Objetivo: transformar o que ja existe em um escopo fechado e revisavel.

Tarefas:

- Criar este documento de release candidate.
- Atualizar backlog Nutri para apontar a RC como proxima entrega.
- Registrar decisoes fechadas de acesso, exportacao e fonte de alimentos.

Criterios de aceite:

- Escopo incluido e fora de escopo estao claros.
- Proximas etapas tem ordem e criterios de aceite claros.

### Etapa 2 - Endurecimento De Permissao E Privacidade

Status: cobertura automatizada inicial implementada.

Objetivo: garantir que dados sensiveis do modulo fiquem isolados.

Tarefas:

- Revisar todas as rotas `/api/nutri/*` para confirmar `requireNutriUser`.
- Adicionar testes de permissao server-side para rotas principais.
- Revisar metadados de auditoria para impedir vazamento de notas clinicas,
  anamnese, plano completo ou ingredientes detalhados quando desnecessario.
- Validar que `ADMIN` nao acessa `/nutri` nem APIs clinicas.
- Validar que `NUTRI` nao acessa admin, escala e escrita em `/api/app-state`.

Criterios de aceite:

- Rotas Nutri retornam 403 para `ADMIN`, `USER` e anonimo.
- Logs Nutri guardam ids, status, contagens e formato, sem conteudo clinico.
- Menu e redirecionamentos batem com as permissoes.

Cobertura adicionada:

- `src/modules/nutri/tests/nutriAccessControls.test.ts`
- `src/modules/nutri/tests/demoSeedGuards.test.ts`

### Etapa 3 - Qualidade Dos Calculos E Versionamento

Status: cobertura automatizada inicial implementada.

Objetivo: reduzir risco tecnico nos calculos e preservar snapshots.

Tarefas:

- Expandir testes de borda para nutrientes ausentes, zero, arredondamento e
  quantidades invalidas.
- Testar que cardapios preservam snapshot de receitas aprovadas.
- Testar que duplicar plano/receita cria novo rascunho sem sobrescrever origem.
- Confirmar que receita aprovada usada em cardapio nao depende de edicao futura
  da receita original.

Criterios de aceite:

- Testes unitarios cobrem calculos principais e casos de borda.
- Versionamento/snapshot fica documentado e testado.

Cobertura adicionada:

- Bordas de nutrientes ausentes, arredondamento, zero e quantidades invalidas.
- Cardapio calculado a partir de snapshots de receitas aprovadas.
- Duplicacao de plano alimentar e receita retornando novo rascunho com auditoria.

### Etapa 4 - UX De Fluxo Profissional

Status: melhoria inicial de fluxo e layout implementada.

Objetivo: deixar a jornada da nutricionista mais clara para uma RC.

Tarefas:

- Revisar estados vazios por aba.
- Mostrar avisos quando faltar dependencia: paciente, alimento ou receita
  aprovada.
- Deixar explicito quando um documento e rascunho, aprovado ou arquivado.
- Melhorar mensagens de aprovacao, arquivamento, duplicacao e exportacao.
- Avaliar separar a tela grande em subviews do modulo se a manutencao estiver
  ficando pesada.

Criterios de aceite:

- Uma nutricionista consegue seguir o fluxo sem precisar saber a ordem tecnica.
- A tela comunica por que uma acao esta indisponivel.
- Fluxos de paciente, alimento, plano, receita e cardapio tem estados vazios
  amigaveis.

Implementado nesta etapa:

- Header, metricas, secoes e carregamentos componentizados com MUI em
  `src/modules/nutri/presentation/components`.
- Avisos por aba quando faltam dependencias de fluxo: paciente ativo, alimento
  ativo ou receita aprovada.
- Comparacao de metas de planos preparada no hook, deixando a pagina apenas
  renderizar linhas e chips ja derivados.
- Status de planos exibidos com rotulos profissionais de rascunho, aprovado e
  arquivado.
- Primeira padronizacao visual das secoes principais de paciente, avaliacao,
  plano alimentar e receita/ficha tecnica.

### Etapa 5 - Documentos Imprimiveis Da RC

Status: renderizacao imprimivel validada com cobertura automatizada inicial.

Objetivo: tornar os HTMLs imprimiveis minimamente profissionais e auditaveis.

Tarefas:

- Garantir data de exportacao em todos os documentos.
- Garantir status e versao quando aplicavel.
- Incluir aviso de revisao profissional.
- Incluir responsavel pelo documento quando disponivel.
- Criar teste simples de renderizacao HTML para plano, receita e cardapio.

Criterios de aceite:

- Exportacoes contem data, status, totais e aviso de revisao.
- Exportacoes escapam texto livre.
- Auditoria registra cada exportacao com ids e formato.

Implementado nesta etapa:

- Helper compartilhado para escaping, datas, status humanizado, responsavel
  tecnico e aviso de revisao profissional.
- Plano alimentar, ficha tecnica e cardapio imprimiveis exibem responsavel
  tecnico quando disponivel.
- Auditoria de exportacao de plano e receita registra status e, quando aplicavel,
  versao.
- Teste automatizado cobre HTML de plano, receita e cardapio com metadados,
  escaping de texto livre e aviso profissional.

### Etapa 6 - Seeds Demo E Ambiente

Status: safeguards automatizados e flags documentadas.

Objetivo: garantir que demo ajude sem criar risco em producao.

Tarefas:

- Validar botoes ocultos com `NUTRI_DEMO_TOOLS_ENABLED=false`.
- Validar rotas bloqueadas quando flag estiver desligada.
- Validar bloqueio em `NODE_ENV=production` sem allow explicito.
- Documentar flags no README da RC ou em `.env.example`, se esse arquivo for
  criado no projeto.
- Testar limpeza de dados `[Demo]`.

Criterios de aceite:

- Seeds nao aparecem nem executam por padrao.
- Rotas demo so funcionam para `NUTRI` e com flag correta.
- Limpeza remove apenas dados demo identificados.

Implementado nesta etapa:

- Rotas de seed bloqueadas quando `NUTRI_DEMO_TOOLS_ENABLED` esta desligada.
- Status da ferramenta demo validado para manter botoes ocultos por padrao.
- Limpeza automatica validada para remover apenas registros com prefixo
  `[Demo]`.
- Flags `NUTRI_DEMO_TOOLS_ENABLED` e
  `NUTRI_DEMO_TOOLS_ALLOW_PRODUCTION` documentadas em `.env.example` e no plano
  de seeds.

### Etapa 7 - QA Manual Da RC

Objetivo: criar e executar roteiro real de validacao da release candidate.

Tarefas:

- Criar roteiro `docs/teste-manual-nutri-v1.1.0-rc.md`.
- Cobrir login NUTRI, bloqueios de perfil, pacientes, avaliacoes, alimentos,
  planos, receitas, cardapios, exportacoes e seeds.
- Registrar ambiente, responsavel, data e resultado.
- Rodar checks automatizados da release.

Criterios de aceite:

- `npm run lint` passa.
- `./node_modules/.bin/tsc --noEmit` passa.
- `npm test` passa.
- `npm run build` passa.
- Roteiro manual da RC aprovado ou aprovado com ressalvas registradas.

### Etapa 8 - Fechamento Da Tag RC

Objetivo: preparar a tag `v1.1.0-rc`.

Tarefas:

- Atualizar `CHANGELOG.md` com entrada `1.1.0-rc`.
- Atualizar `README.md` para informar que Nutri esta em RC.
- Revisar `docs/modulo-nutri-backlog.md` e marcar o que a RC estabiliza.
- Confirmar flags de producao:
  - `NUTRI_DEMO_TOOLS_ENABLED=false`
  - `NUTRI_DEMO_TOOLS_ALLOW_PRODUCTION=false`
- Criar tag anotada somente apos revisao final.

Criterios de aceite:

- Changelog descreve Nutri como RC, nao como produto clinico final.
- Docs indicam claramente riscos, fora de escopo e validacoes.
- Working tree esta limpo antes da tag, exceto se houver decisao explicita.

Tag sugerida:

```bash
git tag -a v1.1.0-rc -m "Release v1.1.0-rc"
```

## Melhorias Que Agregam Valor Ao Nutri

Estas sugestoes nao precisam bloquear a RC, mas devem entrar como candidatas
fortes para `v1.1.0` final ou `v1.2.0`:

1. Perfil profissional da nutricionista: nome, registro, rodape padrao e aviso
   nos documentos.
2. Biblioteca de orientacoes: orientacoes reutilizaveis por objetivo, alergia,
   rotina ou tipo de refeicao.
3. Grupos de substituicao: alimentos equivalentes por refeicao.
4. Templates de planos: estrutura inicial por objetivo, editavel pela
   nutricionista.
5. Evolucao do paciente: grafico simples de peso, IMC, cintura e observacoes por
   data.
6. Importacao assistida de alimentos: CSV controlado antes de TACO/IBGE completo.
7. Checklist de ficha tecnica: alergicos, rendimento, custo, preparo, validade e
   revisao.
8. Dashboard operacional de restaurante: custo por dia, preparacoes aprovadas e
   compras previstas.

## Perguntas Para Fechar Antes Da v1.1.0 Final

- A RC sera validada com dados reais ou apenas dados ficticios/demo?
- Quem sera a nutricionista responsavel pela validacao funcional?
- O documento impresso precisa mostrar nome profissional, CRN ou assinatura?
- O foco comercial da primeira versao final sera clinica, restaurante ou ambos?
- Quais formulas energeticas a profissional usa hoje e devem entrar depois da
  RC?
- Havera mais de uma nutricionista usando o mesmo banco no futuro?
- Qual politica de backup, retencao e exclusao de dados clinicos sera adotada?
