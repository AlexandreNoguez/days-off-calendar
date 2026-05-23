# Release v1.0.0 - Escopo Fechado

Data alvo: 2026-05-23

## Posicionamento

A v1.0.0 e a primeira versao oficial estavel da aplicacao de gestao de folgas.
O compromisso desta versao e entregar o fluxo operacional completo para montar,
validar, publicar, auditar e exportar a escala de folgas com persistencia em
MongoDB e controle de permissoes.

O modulo Nutri permanece como modulo em evolucao e nao faz parte do compromisso
estavel desta release.

## Incluido Na v1.0.0

### Base tecnica

- Next.js com App Router.
- React, TypeScript e MUI.
- Backend interno em `app/api`.
- MongoDB como fonte principal de dados.
- Configuracao por variaveis de ambiente.
- Seed/bootstrap do primeiro admin.

### Autenticacao e permissoes

- Login em `/login`.
- Sessao assinada em cookie HTTP-only.
- Logout.
- Perfis `ADMIN` e `USER`.
- Rotas protegidas.
- Bloqueio server-side para rotas administrativas.
- Usuario comum consulta a escala, mas nao altera dados operacionais.

### Administracao

- Criacao de usuarios.
- Ativacao e desativacao de usuarios.
- Reset de senha.
- Consulta de logs por usuario, acao e periodo.
- Menu administrativo visivel apenas para `ADMIN`.

### Gestao da escala

- Configuracao de mes e ano.
- Marcacao de feriados.
- Cadastro de cargos.
- Cadastro de colaboradores.
- Cadastro de regras.
- Geracao automatica de escala.
- Validacao de conflitos HARD/SOFT.
- Edicao manual da escala.
- Undo e redo.
- Alteracoes em lote.
- Reset de dados com auditoria.
- Publicacao, reabertura e fechamento da escala.
- Bloqueio de edicao quando a escala esta publicada ou fechada.
- Historico de escalas.
- Painel inicial de justica/equilibrio em `/fairness`.

### Exportacao e auditoria

- Exportacao XLSX.
- Logs de login, logout e falha de login.
- Logs de criacao, edicao e exclusao de cargos, colaboradores e regras.
- Logs de geracao, edicao manual, alteracao em lote, undo, redo, publicacao,
  reabertura, fechamento, exportacao e reset da escala.
- Logs com apenas metadados necessarios.

## Fora Do Escopo Da v1.0.0

- Tela individual do colaborador.
- Solicitacao de folga.
- Cobertura minima por cargo.
- Alertas inteligentes consolidados.
- Copiar mes anterior.
- Disponibilidade/indisponibilidade por colaborador.
- Troca de folga entre colaboradores.
- Notificacoes.
- Multiunidade/equipes.
- Auditoria em linguagem amigavel.
- Importacao de colaboradores.
- Simulacoes de escala.
- Comentarios por dia.
- Templates de escala.
- Estabilidade funcional do modulo Nutri.

## Criterios Para Considerar A Release Estavel

- `npm run lint` passa.
- `./node_modules/.bin/tsc --noEmit` passa.
- `npm test` passa.
- `npm run build` passa.
- Roteiro manual em `docs/teste-manual-fluxo-completo.md` permanece aprovado.
- Variaveis de producao estao configuradas sem valores de exemplo.
- `NUTRI_DEMO_TOOLS_ENABLED=false` em producao.
- `NUTRI_DEMO_TOOLS_ALLOW_PRODUCTION=false` em producao.

## Candidatos Para v1.1.0

1. Evoluir painel de justica/equilibrio com comparacao historica.
2. Criar tela do colaborador mostrando somente escalas publicadas/fechadas.
3. Relacionar `User` a `Employee` por `employeeId`.
4. Criar solicitacao de folga com aprovacao do admin.
5. Criar cobertura minima por cargo como regra configuravel.
6. Criar alertas inteligentes a partir dos conflitos e indicadores.
7. Criar copia do mes anterior com preview e auditoria.

## Candidatos Para v1.2.0+

- Disponibilidade e indisponibilidade.
- Troca de folga entre colaboradores.
- Calendario mensal visual.
- Relatorio individual.
- Notificacoes internas.
- Folgas compensatorias/banco de folgas.
- Auditoria amigavel.
- Importacao de colaboradores.
- Modo simulacao.
- Comentarios por dia.
- Regras por prioridade/peso.
- Templates de escala.

## Notas De Tag

Tag sugerida:

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
```

Publicacao sugerida:

```bash
git push origin main
git push origin v1.0.0
```
