# Contexto Para Proximos Chats

Use este arquivo como contexto inicial em novos chats antes de pedir novas
implementacoes neste projeto. Ele resume o estado do sistema, os padroes que
devem ser mantidos e a checklist viva do que ainda falta.

## Estado Atual do Projeto

- Aplicacao migrada para Next.js com App Router.
- UI em MUI.
- Backend dentro do Next.js em `app/api`.
- Persistencia principal em MongoDB, configurada por `.env` com `MONGODB_URI`.
- Autenticacao customizada com sessao assinada em cookie HTTP-only.
- Login em `/login`.
- Rotas da aplicacao protegidas.
- Usuario `ADMIN` tem acesso ao menu `Administrador`.
- Admin pode criar usuarios e ativar/desativar usuarios.
- Admin pode resetar senha de usuarios.
- Admin pode consultar logs por usuario, acao e periodo.
- Usuario comum nao ve menu administrativo.
- Usuario comum consulta a escala, mas nao pode alterar setup, cadastros,
  regras, exportacao administrativa ou a propria escala.
- Regras, colaboradores, cargos, plano, feriados e escala sao persistidos via backend.
- Modelos principais usam timestamps (`createdAt`/`updatedAt`) e o bootstrap do
  banco normaliza documentos antigos que ainda nao tinham esses campos.
- Escala possui status de publicacao: rascunho, publicada ou fechada.
- Escala publicada/fechada fica bloqueada para edicao ate ser reaberta.
- Dark mode restaurado e persistido no browser via `localStorage`.
- Legado frontend-only removido: nao ha mais React Router, Vite app, Zustand
  stores ou persistencia local como caminho de produto.

## Mapa de Arquitetura

- `app/`: rotas Next.js, layouts e API routes.
- `app/api/*`: backend HTTP da aplicacao.
- `src/components/*`: componentes de renderizacao client-side.
- `src/components/hooks/*`: hooks que centralizam estado, chamadas de API e regras de tela.
- `src/domain/*`: tipos, defaults e conceitos puros de dominio.
- `src/application/usecases/*`: regras, geracao de escala, validacao e exportacao.
- `src/lib/server/*`: codigo server-side, auth, MongoDB, auditoria e ambiente.
- `src/lib/types.ts`: contratos compartilhados entre frontend e backend.
- `docs/plano-migracao-nextjs-mongodb.md`: planejamento principal e checklist detalhado.
- `docs/teste-manual-fluxo-completo.md`: roteiro manual de QA para validar
  fluxo completo, permissoes, auditoria, persistencia e exportacao.
- `docs/roadmap-funcionalidades-gestao-folgas.md`: roadmap de valor do produto
  com 20 funcionalidades planejadas.

## Regra Mais Importante de Frontend

Componentes de renderizacao nao devem conter logica de negocio.

Nas telas em `src/components`, manter apenas:

- JSX.
- Composicao de componentes MUI.
- Mapeamento simples de arrays ja preparados pelo hook.
- Ligacao direta de eventos para actions do hook.
- Condicionais simples de renderizacao.

Evitar dentro de componentes de renderizacao:

- `fetch`.
- `useState` para regra de negocio.
- `useEffect` para carregar dados.
- `useMemo` para montar regra ou derivar dados de dominio.
- Validacao de regras de escala.
- Montagem de payloads complexos.
- Acesso direto a `localStorage`, exceto se for componente/hook especifico de tema.
- Regras de permissao.
- Logica de exportacao.
- Logica de auditoria.

Toda essa logica deve ir para hooks como:

- `src/components/hooks/useLoginPage.ts`
- `src/components/hooks/useMainShell.ts`
- `src/components/hooks/useAdminPage.ts`
- `src/components/hooks/useWorkspacePage.ts`
- novos hooks especificos, quando a tela crescer demais.

## Padrao de Hooks

Hooks de tela devem retornar um objeto neste formato:

```ts
return {
  state: {
    // dados prontos para renderizar
  },
  actions: {
    // funcoes chamadas pela view
  },
};
```

Boas praticas nos hooks:

- Centralizar chamadas de API.
- Centralizar `toast`.
- Preparar listas, tabelas e labels para a view.
- Manter validacoes de formulario e permissoes da tela fora do JSX.
- Expor booleans prontos como `canCreateUser`, `canExport`, `canUndo`.
- Expor linhas ja derivadas como `scheduleRows`, `changeLogRows`, `setupCells`.
- Evitar duplicar regra de negocio ja existente em `src/application`.

Se um hook ficar grande demais, dividir por responsabilidade:

- hook de dados.
- hook de formulario.
- hook de tabela.
- hook de acoes.

Mesmo assim, a view deve continuar simples.

## Regras de Dominio

O dominio deve continuar independente de React e Next.js.

Arquivos em `src/domain` e `src/application` nao devem importar:

- React.
- Next.js.
- MUI.
- `fetch`.
- MongoDB.
- APIs de browser.

Eles devem receber dados por parametro e devolver dados ou resultados puros.

Ao criar ou alterar uma regra:

- Atualizar `src/domain/types/rules.ts` se houver novo tipo/chave.
- Atualizar defaults em `src/domain/defaults/defaultRules.ts`, se for regra padrao.
- Atualizar validacao em `src/application/usecases/rules/validateSchedule.ts`.
- Atualizar geracao em `src/application/usecases/schedule/generateSuggestedSchedule.ts`, se a sugestao automatica precisar respeitar a regra.
- Atualizar UI de criacao/edicao de regra no hook da tela, nao no JSX.
- Adicionar teste ou fixture quando possivel.

## Backend e Persistencia

Padroes obrigatorios:

- Toda rota administrativa deve validar usuario admin no server.
- Toda rota autenticada deve validar sessao no server.
- Nunca confiar em permissao apenas no frontend.
- Senhas sempre com hash seguro, nunca texto puro.
- Nao expor `passwordHash` em respostas publicas.
- Logs devem ser criados para acoes relevantes.
- Alteracoes de estado da aplicacao devem passar pelo backend, nao por `localStorage`.

Arquivos importantes:

- Auth: `src/lib/server/auth.ts`
- Senhas: `src/lib/server/passwords.ts`
- MongoDB: `src/lib/server/mongodb.ts`
- Auditoria: `src/lib/server/audit.ts`
- Estado da aplicacao: `src/lib/server/appData.ts`

## Auditoria

Usar nomes de acao consistentes:

- `auth.login.success`
- `auth.login.failed`
- `auth.logout`
- `user.created`
- `user.updated`
- `employee.created`
- `employee.updated`
- `employee.deleted`
- `role.created`
- `role.updated`
- `role.deleted`
- `rule.created`
- `rule.updated`
- `rule.deleted`
- `holiday.toggled`
- `plan.updated`
- `schedule.generated`
- `schedule.cell.updated`
- `schedule.bulk.updated`
- `schedule.undo`
- `schedule.redo`
- `schedule.published`
- `schedule.reopened`
- `schedule.closed`
- `schedule.exported`
- `data.reset`

Logs devem registrar apenas metadados necessarios. Nao guardar senha, tokens ou
dados sensiveis.

## UI e MUI

- Manter MUI como base visual.
- Preservar dark mode.
- Preferir componentes MUI nativos.
- Views devem ser previsiveis, limpas e responsivas.
- Evitar criar design system paralelo sem necessidade.
- Nao remover acessos de admin/user sem validar regra de permissao.
- Ao adicionar tela nova, criar hook dedicado antes ou junto da view.

## Fluxo de Trabalho Para Novos Chats

1. Ler este arquivo.
2. Ler `docs/plano-migracao-nextjs-mongodb.md`.
3. Rodar `git status --short`.
4. Entender se existem alteracoes nao commitadas do usuario.
5. Nao reverter alteracoes que ja existam sem pedido explicito.
6. Fazer mudancas pequenas e focadas.
7. Manter logica fora dos componentes de renderizacao.
8. Atualizar checklist/documentacao quando uma pendencia for concluida.
9. Rodar validacoes.
10. Nao commitar sem pedido explicito do usuario.

## Validacoes Antes de Entregar

Rodar sempre que a mudanca tocar codigo:

```bash
npm run lint
./node_modules/.bin/tsc --noEmit
npm run build
```

Quando a mudanca envolver banco/autenticacao:

- Validar seed do admin quando aplicavel.
- Validar permissao admin/user.
- Validar chamadas API com usuario nao autorizado.
- Validar logs gerados.

Quando a mudanca envolver regra de escala:

- Validar conflitos HARD/SOFT.
- Validar geracao automatica.
- Validar edicao manual.
- Validar exportacao se a regra afetar planilha.

## Commits

Nao criar commit sem pedido explicito.

Quando o usuario pedir commit, usar commit semantico em ingles:

```text
type(scope): message
```

Exemplos:

```text
feat(admin): add password reset flow
fix(auth): enforce admin access on user routes
refactor(frontend): extract schedule logic into hooks
test(rules): add fixtures for schedule validation
docs(project): update migration checklist
```

## Checklist Resumido do Que Falta

### Regras e dominio

- [x] Validar regra de 1 folga em feriado por pessoa ao ano.
- [x] Implementar regra SOFT de evitar folga sempre no mesmo dia da semana.
- [x] Criar testes ou fixtures basicas para validar regras.
- [x] Criar testes principais para validacao de regras.

### Banco e infraestrutura

- [x] Criar indices necessarios no MongoDB.
- [x] Validar seed do admin em banco limpo.
- [x] Validar persistencia no MongoDB Atlas Free.
- [x] Fechar modelo de dados implementado.
- [x] Remover legado Vite/localStorage/Zustand.

### Admin e seguranca

- [x] Criar troca/reset de senha.
- [x] Decidir se usuario comum pode editar tudo ou se tera permissoes mais granulares.
- [x] Decidir se o admin podera editar regras globais que afetam todos os usuarios.
- [x] Validar permissao admin/user em teste manual.

### Auditoria

- [x] Registrar alteracoes em lote.
- [x] Registrar reset/limpeza de dados.

### Produto e entrega

- [x] Revisar decisoes pendentes com o dono do produto.
- [x] Criar teste manual guiado do fluxo completo.
- [x] Decidir se dados antigos do `localStorage` precisam migrar para MongoDB.
- [x] Decidir ambiente de deploy, como Vercel ou outro.

Decisoes fechadas nesta rodada:

- Usuario `USER`: pode consultar a escala, mas nao pode alterar dados. Escritas
  em `/api/app-state` exigem `ADMIN`.
- Regras globais: podem ser editadas pelo `ADMIN`; `USER` nao edita regras.
- Dados antigos de `localStorage`: nao serao migrados automaticamente. A entrega
  considera MongoDB como fonte principal e pode comecar com banco limpo.
- Deploy inicial: Vercel com MongoDB Atlas Free.

## Proximo Passo Recomendado

A migracao tecnica principal esta fechada: Next.js, MongoDB Atlas, auth,
permissoes, auditoria, modelo de dados e limpeza do legado frontend-only.
O proximo passo recomendado e continuar o bloco de maior valor para o cliente no
roadmap de produto.

A ordem recomendada de produto e:

1. Finalizar publicacao de escala com revisao visual/fluxo real.
2. Criar tela do colaborador mostrando a escala publicada.
3. Criar solicitacao de folga com aprovacao do admin.
4. Criar painel de justica/equilibrio.
5. Criar cobertura minima por cargo.
6. Criar alertas inteligentes.
7. Criar copiar mes anterior.

## Enviar mensagem de commit

Ao finalizar uma tarefa já sugerir um commit message seguindo o padrão type(scope): message in english

Não commitar os arquivos automaticamente pois quero revisar e testar antes de commitar
