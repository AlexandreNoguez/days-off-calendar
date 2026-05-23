# Changelog

Todas as mudancas relevantes deste projeto serao documentadas aqui.

O formato segue a ideia de releases semanticos: `MAJOR.MINOR.PATCH`.

## [1.0.0] - 2026-05-23

### Added

- Aplicacao em Next.js com App Router.
- Backend interno em `app/api`.
- Persistencia principal em MongoDB.
- Login com sessao assinada em cookie HTTP-only.
- Perfis `ADMIN` e `USER`.
- Area administrativa para usuarios, reset de senha, ativacao/desativacao e logs.
- Rotas protegidas e validacao server-side para operacoes administrativas.
- Cadastro de cargos, colaboradores, regras, feriados e periodo da escala.
- Geracao automatica de escala com regras HARD/SOFT.
- Editor manual da escala com undo/redo.
- Alteracao em lote e reset da escala com auditoria.
- Fluxo de publicacao, reabertura e fechamento da escala.
- Historico de escalas.
- Exportacao XLSX.
- Dark mode persistido no browser.
- Painel inicial de justica/equilibrio em `/fairness`.

### Changed

- A fonte principal de dados passou a ser o MongoDB.
- O antigo MVP frontend-only deixou de ser o caminho de produto.
- Escritas de setup, cadastros, regras, exportacao administrativa e escala ficam restritas ao perfil `ADMIN`.

### Security

- Senhas sao armazenadas apenas com hash seguro.
- Respostas publicas nao expoem `passwordHash`.
- Logs registram metadados, sem senhas, tokens ou dados sensiveis.
- Usuario comum nao acessa menu administrativo nem rotas administrativas.

### Release Notes

- Escopo fechado em `docs/release-v1.0.0.md`.
- QA manual completo aprovado em 2026-05-20.
- O modulo Nutri existe no repositorio como modulo em evolucao, mas nao faz parte do compromisso estavel da v1.0.0 da gestao de folgas.
