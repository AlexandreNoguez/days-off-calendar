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
- Admin pode consultar logs por usuario, acao e periodo.
- Usuario comum nao ve menu administrativo.
- Regras, colaboradores, cargos, plano, feriados e escala sao persistidos via backend.
- Dark mode restaurado e persistido no browser via `localStorage`.

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
- `schedule.undo`
- `schedule.redo`
- `schedule.exported`

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
- [ ] Criar testes ou fixtures basicas para validar regras.
- [ ] Criar testes principais para validacao de regras.

### Banco e infraestrutura

- [ ] Criar indices necessarios no MongoDB.
- [ ] Validar seed do admin em banco limpo.
- [ ] Validar persistencia no MongoDB Atlas Free.

### Admin e seguranca

- [ ] Criar troca/reset de senha.
- [ ] Decidir se usuario comum pode editar tudo ou se tera permissoes mais granulares.
- [ ] Decidir se o admin podera editar regras globais que afetam todos os usuarios.
- [ ] Validar permissao admin/user em teste manual.

### Auditoria

- [ ] Registrar alteracoes em lote.
- [ ] Registrar reset/limpeza de dados.

### Produto e entrega

- [ ] Revisar decisoes pendentes com o dono do produto.
- [ ] Criar teste manual guiado do fluxo completo.
- [ ] Decidir se dados antigos do `localStorage` precisam migrar para MongoDB.
- [ ] Decidir ambiente de deploy, como Vercel ou outro.

## Proximo Passo Recomendado

O melhor proximo passo tecnico e criar testes/fixtures para o motor de regras.
Isso reduz risco antes de adicionar mais permissoes ou fluxos administrativos.

Depois disso, a ordem recomendada e:

1. Indices MongoDB.
2. Reset/troca de senha pelo admin.
3. Validacao manual completa admin/user.
4. Deploy.

## Enviar mensagem de commit

Ao finalizar uma tarefa já sugerir um commit message seguindo o padrão type(scope): message in english

Não commitar os arquivos automaticamente pois quero revisar e testar antes de commitar
