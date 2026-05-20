# Escala de Folgas

Aplicacao para montar escala de folgas com regras HARD/SOFT, controle de
permissoes, auditoria de acoes e exportacao XLSX.

Stack atual: **Next.js + React + TypeScript + MUI + MongoDB + Toastify**.

A versao original do MVP era frontend-only. A base atual usa backend interno no
Next.js e MongoDB como fonte principal de dados.

## Documentacao

- [Plano de migracao para Next.js + MongoDB](docs/plano-migracao-nextjs-mongodb.md)
- [Teste manual guiado do fluxo completo](docs/teste-manual-fluxo-completo.md)
- [Roadmap de funcionalidades](docs/roadmap-funcionalidades-gestao-folgas.md)

## Configuracao Local

Crie/edite o arquivo `.env` na raiz do projeto:

```bash
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=escala_folga
SESSION_SECRET=troque-este-valor-por-uma-string-grande
ADMIN_USERNAME=admin
ADMIN_PASSWORD=uma-senha-inicial-segura
ADMIN_DISPLAY_NAME=Administrador
```

O primeiro admin e criado automaticamente no primeiro login caso ainda nao exista
usuario com `ADMIN_USERNAME`. Em producao, `ADMIN_PASSWORD` deve estar definido;
o fallback local `admin123` nao e aceito para criacao automatica em producao.
Tambem e possivel criar manualmente:

```bash
npm run seed:admin
```

## Como Rodar

```bash
npm install
npm run dev
```

Depois acesse `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run lint
./node_modules/.bin/tsc --noEmit
npm test
npm run build
npm run seed:admin
```

## Arquitetura

- `app/`: rotas, layouts e API routes do Next.js.
- `app/api/*`: backend HTTP da aplicacao.
- `src/components/*`: telas e componentes client-side.
- `src/components/hooks/*`: hooks de tela com estado, chamadas de API e regras de UI.
- `src/domain/*`: tipos, defaults e conceitos puros de dominio.
- `src/application/usecases/*`: validacao, geracao, edicao de escala e exportacao.
- `src/lib/server/*`: auth, MongoDB, auditoria, ambiente e persistencia server-side.
- `src/lib/types.ts`: contratos compartilhados entre frontend e backend.
- `src/shared/*`: utilitarios e componentes compartilhados.

## Funcionalidades

- Login com sessao assinada em cookie HTTP-only.
- Perfis `ADMIN` e `USER`.
- Rotas protegidas e chamadas administrativas validadas no server.
- Cadastro de usuarios pelo admin.
- Reset de senha e ativacao/desativacao de usuarios.
- Cadastro de cargos, colaboradores e regras.
- Configuracao de mes/ano e feriados.
- Geracao automatica da escala.
- Edicao manual com undo/redo.
- Alteracao em lote e reset da escala com auditoria.
- Publicacao, reabertura e fechamento da escala.
- Consulta de historico de escalas.
- Exportacao XLSX.
- Logs de login e acoes de uso.

## Regras de Negocio

- Tales folga sempre aos domingos.
- Rodizio de cozinheiros: exatamente 1 cozinheiro de folga por domingo.
- Cozinheiro que folga domingo nao pode folgar na semana.
- Cozinheiro que trabalha domingo precisa folgar 1 dia na semana.
- Cozinheiro que folgou domingo nao pode folgar na segunda seguinte.
- Auxiliar que folga domingo nao pode folgar na semana.
- Auxiliar que trabalha domingo precisa folgar 1 dia na semana.
- Auxiliar que folgou domingo nao pode folgar na segunda seguinte.
- Auxiliar deve manter folga semanal fixa.
- Lavanderia tem direito a 1 folga no domingo por mes.
- Paneleiro tem direito a 1 folga no domingo por mes.
- Maximo de 6 dias consecutivos de trabalho.
- Nao permitir 2 dias consecutivos de folga.
- Clarice, Ingrid e Elaine nao podem folgar juntas.
- Elaine nao pode folgar no mesmo dia da Josana.
- Elaine nao pode folgar no mesmo dia do Luis.
- Quando Josana ou Luis folgam, Elaine deve trabalhar.
- Quando Maria folga, Lidriel deve trabalhar.
- Ingrid e Fernando nao podem folgar juntos.
- Cada pessoa pode usar no maximo 1 folga em feriado por ano.
- Regra SOFT: evitar folgar sempre no mesmo dia da semana.

## Padroes Importantes

- Componentes de renderizacao nao devem conter logica de negocio.
- Hooks de tela centralizam API, toast, permissoes e dados derivados.
- `src/domain` e `src/application` devem continuar independentes de React,
  Next.js, MUI, MongoDB e APIs de browser.
- Alteracoes de estado da aplicacao passam pelo backend, nao pelo browser como
  fonte de verdade.
- Logs devem registrar apenas metadados necessarios, nunca senhas, tokens ou
  dados sensiveis.
