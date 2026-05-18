# Plano de Migracao para Next.js + MongoDB

## Objetivo

Migrar o MVP atual de escala de folgas, hoje frontend-only em React + Vite com persistencia em `localStorage`, para uma aplicacao Next.js com backend proprio e persistencia em MongoDB Atlas Free.

O objetivo e manter todas as regras ja definidas, preservar o fluxo validado do MVP e adicionar:

- Login.
- Persistencia em banco.
- Usuario administrador inicial criado no banco.
- Area administrativa para criar novos usuarios.
- Permissoes por perfil.
- Logs de login e acoes de usuarios dentro da aplicacao.

## Estado Atual

- [x] MVP validado funcionalmente.
- [x] Aplicacao atual roda em React + Vite + TypeScript.
- [x] UI usa MUI.
- [x] Estado atual usa Zustand.
- [x] Dados sao persistidos no `localStorage`.
- [x] Existem cadastros de colaboradores, cargos e regras.
- [x] Usuario pode criar regras novas pelo front-end.
- [x] Existe geracao automatica de escala.
- [x] Existe validacao de regras HARD/SOFT.
- [x] Existe editor manual da escala com undo/redo.
- [x] Existe exportacao XLSX.
- [x] Existe backend.
- [x] Existe login.
- [x] Existe banco de dados configurado via MongoDB.
- [x] Existe controle de permissao ADMIN/USER.
- [x] Existe auditoria/logs de uso.

## Direcao Arquitetural

### Aplicacao

- [x] Migrar de Vite para Next.js.
- [x] Usar App Router do Next.js.
- [x] Manter TypeScript.
- [x] Manter MUI como biblioteca visual.
- [x] Reaproveitar a maior parte possivel das Views atuais.
- [x] Separar claramente componentes client-side e operacoes server-side.
- [x] Manter o dominio de regras independente do framework.

### Backend

- [x] Criar camada de backend dentro do Next.js.
- [x] Usar MongoDB Atlas Free como banco inicial.
- [x] Criar conexao reutilizavel com MongoDB.
- [x] Criar colecoes para usuarios, colaboradores, cargos, regras, planos, feriados, escalas e logs.
- [x] Criar APIs ou Server Actions para persistencia.
- [x] Evitar gravar regras e escala diretamente no browser como fonte principal.

### Autenticacao

- [x] Criar tela `/login`.
- [x] Proteger todas as rotas da aplicacao, exceto login.
- [x] Armazenar senha somente com hash seguro.
- [x] Criar usuario administrador inicial por script/seed.
- [x] Criar sessao segura para usuario logado.
- [x] Implementar logout.
- [x] Registrar login bem-sucedido e falhas de login nos logs.

### Permissoes

- [x] Criar perfil `ADMIN`.
- [x] Criar perfil `USER`.
- [x] Permitir que qualquer usuario autenticado use a escala, conforme regra de negocio definida.
- [x] Restringir criacao, edicao e desativacao de usuarios ao perfil `ADMIN`.
- [x] Restringir tela de logs ao perfil `ADMIN`.
- [x] Esconder menu administrativo para usuarios comuns.
- [x] Bloquear chamadas server-side administrativas para usuarios nao-admin.

## Modelo de Dados Proposto

### User

- [ ] `id`
- [ ] `username`
- [ ] `displayName`
- [ ] `passwordHash`
- [ ] `role`: `ADMIN` ou `USER`
- [ ] `active`
- [ ] `createdByUserId`
- [ ] `createdAt`
- [ ] `updatedAt`
- [ ] `lastLoginAt`

### AuditLog

- [ ] `id`
- [ ] `userId`
- [ ] `usernameSnapshot`
- [ ] `action`
- [ ] `entityType`
- [ ] `entityId`
- [ ] `metadata`
- [ ] `ip`
- [ ] `userAgent`
- [ ] `createdAt`

Exemplos de `action`:

- [ ] `auth.login.success`
- [ ] `auth.login.failed`
- [ ] `auth.logout`
- [ ] `user.created`
- [ ] `user.updated`
- [ ] `employee.created`
- [ ] `employee.updated`
- [ ] `employee.deleted`
- [ ] `role.created`
- [ ] `role.updated`
- [ ] `role.deleted`
- [ ] `rule.created`
- [ ] `rule.updated`
- [ ] `rule.deleted`
- [ ] `schedule.generated`
- [ ] `schedule.cell.updated`
- [ ] `schedule.bulk.updated`
- [ ] `schedule.exported`
- [ ] `data.reset`

### Role

- [ ] `id`
- [ ] `name`
- [ ] `createdAt`
- [ ] `updatedAt`

### Employee

- [ ] `id`
- [ ] `name`
- [ ] `roleId`
- [ ] `alwaysOffSunday`
- [ ] `holidayCreditYear`
- [ ] `holidayOffUsed`
- [ ] `notes`
- [ ] `createdAt`
- [ ] `updatedAt`

### RuleConfig

- [ ] `id`
- [ ] `key`
- [ ] `enabled`
- [ ] `severity`
- [ ] `title`
- [ ] `description`
- [ ] `params`
- [ ] `createdAt`
- [ ] `updatedAt`

### Plan

- [ ] `id`
- [ ] `year`
- [ ] `month`
- [ ] `createdAt`
- [ ] `updatedAt`

### Calendar/Holiday

- [ ] `id`
- [ ] `dateISO`
- [ ] `label`
- [ ] `createdAt`
- [ ] `updatedAt`

### Schedule

- [ ] `id`
- [ ] `year`
- [ ] `month`
- [ ] `assignments`
- [ ] `changeLog`
- [ ] `createdAt`
- [ ] `updatedAt`

## Regras que Devem Ser Preservadas

- [x] Tales folga sempre aos domingos.
- [x] Rodizio de cozinheiros: exatamente 1 cozinheiro de folga por domingo.
- [x] Cozinheiro que folga domingo nao pode folgar na semana.
- [x] Cozinheiro que trabalha domingo precisa folgar 1 dia na semana.
- [x] Cozinheiro que folgou domingo nao pode folgar na segunda seguinte.
- [x] Auxiliar que folga domingo nao pode folgar na semana.
- [x] Auxiliar que trabalha domingo precisa folgar 1 dia na semana.
- [x] Auxiliar que folgou domingo nao pode folgar na segunda seguinte.
- [x] Auxiliar deve manter folga semanal fixa.
- [x] Lavanderia tem direito a 1 folga no domingo por mes.
- [x] Paneleiro tem direito a 1 folga no domingo por mes.
- [x] Maximo de 6 dias consecutivos de trabalho.
- [x] Nao permitir 2 dias consecutivos de folga.
- [x] Clarice, Ingrid e Elaine nao podem folgar juntas.
- [x] Elaine nao pode folgar no mesmo dia da Josana.
- [x] Elaine nao pode folgar no mesmo dia do Luis.
- [x] Quando Josana ou Luis folgam, Elaine deve trabalhar.
- [x] Quando Maria folga, Lidriel deve trabalhar.
- [x] Ingrid e Fernando nao podem folgar juntos.
- [x] Validar regra de 1 folga em feriado por pessoa ao ano.
- [x] Implementar regra SOFT de evitar folga sempre no mesmo dia da semana.

## Fluxos de Usuario

### Login

- [x] Usuario acessa `/login`.
- [x] Usuario informa login e senha.
- [x] Sistema valida usuario ativo e senha.
- [x] Sistema cria sessao.
- [x] Sistema registra log de login.
- [x] Sistema redireciona para a aplicacao.

### Administrador cria usuario

- [x] Admin acessa menu `Administrador`.
- [x] Admin abre aba `Usuarios`.
- [x] Admin informa nome, login, senha inicial e perfil.
- [x] Sistema cria usuario com senha hash.
- [x] Sistema registra log `user.created`.
- [x] Admin repassa login e senha inicial para a pessoa.

### Administrador consulta logs

- [x] Admin acessa menu `Administrador`.
- [x] Admin abre aba `Logs`.
- [x] Sistema lista logins e acoes do sistema.
- [x] Admin pode filtrar por usuario.
- [x] Admin pode filtrar por acao.
- [x] Admin pode filtrar por periodo.

### Usuario comum usa a escala

- [x] Usuario comum faz login.
- [x] Usuario comum nao ve menu administrativo.
- [x] Usuario comum pode acessar fluxo de escala permitido.
- [x] Sistema registra acoes relevantes do usuario.

## Menus Propostos

- [x] `Setup`
- [x] `Cadastros`
- [x] `Escala`
- [x] `Exportar`
- [x] `Administrador` somente para `ADMIN`

Dentro de `Administrador`:

- [x] Aba `Usuarios`
- [x] Aba `Logs`

## Estrategia de Migracao

### Fase 0 - Planejamento

- [x] Entender o MVP atual.
- [x] Identificar regras existentes.
- [x] Definir alvo da migracao.
- [x] Criar este documento de planejamento.
- [ ] Revisar decisoes pendentes com o dono do produto.

### Fase 1 - Base Next.js

- [x] Criar projeto Next.js no repo.
- [x] Migrar configuracao TypeScript.
- [x] Migrar MUI e tema.
- [x] Migrar layout principal.
- [x] Migrar roteamento atual para rotas do Next.js.
- [x] Garantir build inicial sem backend.

### Fase 2 - Portar Dominio e Regras

- [x] Migrar `src/domain`.
- [x] Migrar `src/application/usecases/rules`.
- [x] Migrar `src/application/usecases/schedule`.
- [x] Migrar `src/application/usecases/export`.
- [ ] Criar testes ou fixtures basicas para validar regras.
- [x] Conferir se a sugestao automatica gera resultado equivalente ao MVP atual.

### Fase 3 - Banco MongoDB

- [x] Criar variavel `MONGODB_URI`.
- [x] Criar modulo de conexao MongoDB.
- [x] Criar camada de repositorios.
- [x] Criar seed do usuario admin.
- [ ] Criar indices necessarios.
- [x] Persistir colaboradores.
- [x] Persistir cargos.
- [x] Persistir regras.
- [x] Persistir plano/mes/ano.
- [x] Persistir feriados.
- [x] Persistir escala.

### Fase 4 - Login e Sessao

- [x] Definir biblioteca ou estrategia de auth.
- [x] Criar tela de login.
- [x] Criar validacao de credenciais.
- [x] Criar middleware/protecao de rotas.
- [x] Criar logout.
- [x] Registrar eventos de login/logout.

### Fase 5 - Area Administrativa

- [x] Criar menu `Administrador`.
- [x] Criar aba `Usuarios`.
- [x] Criar formulario de criacao de usuario.
- [x] Criar listagem de usuarios.
- [x] Criar ativar/desativar usuario.
- [ ] Criar troca/reset de senha.
- [x] Criar aba `Logs`.
- [x] Criar filtros de logs.
- [x] Bloquear acesso admin no backend para usuarios comuns.

### Fase 6 - Migrar Telas Existentes

- [x] Migrar Setup.
- [x] Migrar Cadastros de colaboradores.
- [x] Migrar Cadastros de cargos.
- [x] Migrar Cadastros de regras.
- [x] Garantir criacao de regras customizadas pelo front-end.
- [x] Migrar Editor da escala.
- [x] Migrar Exportacao XLSX.
- [x] Trocar persistencia local por chamadas ao backend.

### Fase 7 - Auditoria de Acoes

- [x] Registrar criacao/edicao/exclusao de colaborador.
- [x] Registrar criacao/edicao/exclusao de cargo.
- [x] Registrar criacao/edicao/exclusao de regra.
- [x] Registrar geracao automatica de escala.
- [x] Registrar edicao manual de celulas.
- [ ] Registrar alteracoes em lote.
- [x] Registrar exportacao XLSX.
- [ ] Registrar reset/limpeza de dados.

### Fase 8 - Qualidade e Entrega

- [x] Rodar lint.
- [x] Rodar build.
- [ ] Criar testes principais para validacao de regras.
- [ ] Criar teste manual guiado do fluxo completo.
- [ ] Validar permissao admin/user.
- [ ] Validar seed do admin em banco limpo.
- [ ] Validar persistencia no MongoDB Atlas Free.
- [x] Atualizar README.
- [x] Documentar variaveis de ambiente.
- [x] Documentar como criar o primeiro admin.

## Decisoes Pendentes

- [x] Usar Auth.js/NextAuth ou sessao customizada? Decidido: sessao customizada assinada em cookie HTTP-only.
- [x] Login sera por `username` ou `email`? Decidido: `username`.
- [ ] Usuario comum pode editar tudo ou tera permissoes mais granulares no futuro?
- [x] A escala sera unica para toda a empresa ou devera suportar multiplas unidades/equipes? Decidido agora: escala unica.
- [ ] Precisamos migrar dados antigos do `localStorage` para MongoDB ou podemos comecar com banco limpo?
- [x] Logs devem guardar somente metadados ou tambem snapshot antes/depois das alteracoes? Decidido agora: metadados.
- [ ] O admin podera editar regras globais que afetam todos os usuarios?
- [ ] A aplicacao tera deploy em Vercel ou outro ambiente?

## Proposta Inicial de Implementacao

Para reduzir risco, a migracao deve preservar primeiro o comportamento atual e so depois adicionar sofisticacoes.

Ordem recomendada:

- [x] Criar base Next.js sem mudar regra de negocio.
- [x] Portar dominio e motor de regras.
- [x] Colocar MongoDB e auth.
- [x] Migrar telas uma a uma.
- [x] Adicionar admin e logs.
- [x] Refinar regras pendentes.

## Contexto Para Continuidade

Sempre que retomarmos o projeto, checar este arquivo primeiro e marcar os itens concluidos. A fonte de verdade do planejamento da migracao e este documento.

Quando a implementacao comecar, cada etapa deve atualizar este checklist no mesmo commit ou na mesma rodada de alteracoes.
