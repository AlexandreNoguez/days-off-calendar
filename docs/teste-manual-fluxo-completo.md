# Teste Manual Guiado do Fluxo Completo

Use este roteiro antes de considerar a migracao pronta para uma nova rodada de
produto. O objetivo e validar o fluxo real da aplicacao com perfis `ADMIN` e
`USER`, cobrindo autenticacao, permissoes, persistencia, auditoria, escala e
exportacao.

## Convencoes

- Ambiente sugerido: local, com `npm run dev`.
- Banco sugerido: MongoDB de teste ou banco local dedicado para QA.
- Marque cada item com:
  - `[ ] N/A` quando o cenario nao se aplicar ao ambiente testado.
  - `[ ] OK` quando o resultado esperado for confirmado.
  - `[ ] Falha` quando houver divergencia.
- Ao encontrar falha, registre usuario, navegador, horario aproximado, rota e
  uma descricao curta do comportamento observado.

## Preparacao

- [ ] N/A
- [ ] OK
- [ ] Falha

1. Conferir `.env` com `MONGODB_URI`, `MONGODB_DB_NAME`, `SESSION_SECRET`,
   `ADMIN_USERNAME`, `ADMIN_PASSWORD` e `ADMIN_DISPLAY_NAME`.
2. Instalar dependencias com `npm install`, se necessario.
3. Subir a aplicacao com `npm run dev`.
4. Acessar `http://localhost:3000`.
5. Confirmar que uma sessao anonima redireciona para `/login`.

Observacoes:

```text

```

## Login e Logout

- [ ] N/A
- [ ] OK
- [ ] Falha

1. Entrar com credenciais invalidas.
2. Confirmar mensagem de erro e permanencia em `/login`.
3. Entrar com `ADMIN_USERNAME` e `ADMIN_PASSWORD`.
4. Confirmar redirecionamento para a aplicacao.
5. Fazer logout.
6. Confirmar retorno para `/login`.
7. Entrar novamente como admin.

Resultados esperados:

- Login invalido nao cria sessao.
- Login valido cria sessao HTTP-only.
- Logout encerra a sessao.
- Logs `auth.login.failed`, `auth.login.success` e `auth.logout` aparecem na
  area administrativa.

Observacoes:

```text

```

## Permissoes de Admin

- [ ] N/A
- [ ] OK
- [ ] Falha

1. Com admin logado, acessar o menu `Administrador`.
2. Criar um usuario `USER` de teste com senha inicial.
3. Confirmar que o usuario aparece na listagem.
4. Desativar o usuario.
5. Confirmar que usuario desativado nao consegue fazer login.
6. Reativar o usuario.
7. Confirmar que usuario reativado consegue fazer login.

Resultados esperados:

- Admin ve o menu `Administrador`.
- Admin consegue criar, ativar e desativar usuarios.
- Respostas publicas nunca exibem `passwordHash`.
- Logs `user.created` e `user.updated` sao criados.

Observacoes:

```text

```

## Permissoes de Usuario Comum

- [ ] N/A
- [ ] OK
- [ ] Falha

1. Fazer login com o usuario `USER` de teste.
2. Confirmar que o menu `Administrador` nao aparece.
3. Tentar acessar manualmente `/admin`.
4. Tentar chamar rotas administrativas pelo navegador ou ferramenta HTTP:
   `/api/admin/users`, `/api/admin/schedule-history`.
5. Confirmar que o usuario comum ainda acessa os fluxos permitidos da escala.

Resultados esperados:

- Usuario comum nao ve telas administrativas.
- Backend bloqueia rotas administrativas para usuario comum.
- Usuario comum nao consegue consultar usuarios, logs ou historico administrativo.

Observacoes:

```text

```

## Setup e Cadastros

- [ ] N/A
- [ ] OK
- [ ] Falha

1. Acessar `Setup`.
2. Alterar mes/ano do plano.
3. Marcar e desmarcar feriados.
4. Acessar `Cadastros`.
5. Criar, editar e remover um cargo de teste.
6. Criar, editar e remover um colaborador de teste.
7. Criar ou editar uma regra de teste, preferindo template guiado quando
   disponivel.
8. Recarregar a pagina e confirmar persistencia dos dados.

Resultados esperados:

- Alteracoes persistem no MongoDB.
- UI reflete os dados apos reload.
- Logs de cargo, colaborador, regra, feriado e plano sao registrados quando
  aplicavel.

Observacoes:

```text

```

## Escala

- [ ] N/A
- [ ] OK
- [ ] Falha

1. Acessar `Escala`.
2. Gerar sugestao automatica.
3. Confirmar que a grade foi preenchida.
4. Revisar conflitos HARD e SOFT exibidos.
5. Editar manualmente algumas celulas.
6. Testar undo e redo.
7. Recarregar a pagina e confirmar persistencia da escala.
8. Confirmar que as regras principais continuam coerentes:
   - Tales folga aos domingos.
   - Apenas 1 cozinheiro folga por domingo.
   - Nao ha duas folgas consecutivas para o mesmo colaborador.
   - Feriado respeita limite anual quando configurado.

Resultados esperados:

- Geracao cria uma escala editavel em rascunho.
- Edicoes manuais atualizam validacao e historico.
- Undo/redo altera a grade sem quebrar persistencia.
- Logs `schedule.generated`, `schedule.cell.updated`, `schedule.undo` e
  `schedule.redo` aparecem quando aplicavel.

Observacoes:

```text

```

## Publicacao da Escala

- [ ] N/A
- [ ] OK
- [ ] Falha

1. Com escala em rascunho, acionar `Publicar`.
2. Confirmar que o status muda para publicada.
3. Tentar editar celulas publicadas.
4. Acionar `Reabrir`.
5. Confirmar que a escala volta para rascunho e permite edicao.
6. Acionar `Fechar`.
7. Confirmar que a escala fechada fica bloqueada para edicao.

Resultados esperados:

- Status da escala aparece claramente na UI.
- Escala publicada ou fechada bloqueia edicao direta.
- Reabertura volta para rascunho.
- Logs `schedule.published`, `schedule.reopened` e `schedule.closed` sao criados.

Observacoes:

```text

```

## Exportacao

- [ ] N/A
- [ ] OK
- [ ] Falha

1. Acessar `Exportar`.
2. Gerar arquivo XLSX.
3. Abrir o arquivo em planilha.
4. Conferir mes/ano, colaboradores, dias, folgas, feriados, conflitos e status
   da escala quando exibido.

Resultados esperados:

- Download gera arquivo valido.
- Conteudo exportado bate com a escala visivel.
- Log `schedule.exported` e criado.

Observacoes:

```text

```

## Logs e Filtros

- [ ] N/A
- [ ] OK
- [ ] Falha

1. Entrar como admin.
2. Acessar `Administrador` > `Logs`.
3. Filtrar por usuario.
4. Filtrar por acao.
5. Filtrar por periodo.
6. Confirmar que eventos das etapas anteriores aparecem com metadados seguros.

Resultados esperados:

- Filtros retornam dados consistentes.
- Logs nao expõem senhas, tokens ou dados sensiveis.
- Acoes relevantes possuem `userId`, `usernameSnapshot`, `action` e
  `createdAt`.

Observacoes:

```text

```

## Persistencia e Reentrada

- [ ] N/A
- [ ] OK
- [ ] Falha

1. Encerrar o servidor local.
2. Subir novamente com `npm run dev`.
3. Fazer login.
4. Conferir que cadastros, plano, feriados, regras, escala, status de
   publicacao e logs continuam disponiveis.

Resultados esperados:

- Banco continua sendo a fonte principal.
- Reentrada nao depende de `localStorage` como fonte de verdade.
- Dados existentes nao sao sobrescritos pelo seed.

Observacoes:

```text

```

## Resultado Final

- Responsavel:
- Data:
- Ambiente:
- Browser:
- Commit/branch:
- Resultado geral: `[ ] Aprovado` `[ ] Aprovado com ressalvas` `[ ] Reprovado`

Resumo:

```text

```
