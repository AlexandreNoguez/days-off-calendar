# Teste Manual Nutri v1.1.0-rc

Use este roteiro antes de fechar a tag `v1.1.0-rc`. O objetivo e validar o
fluxo real do modulo `Nutri` com perfil `NUTRI`, cobrindo permissoes, dados
clinicos, calculos, documentos imprimiveis, seeds demo e auditoria.

## Registro Da Execucao

- Ambiente:
- URL:
- Branch/commit:
- Banco de dados:
- Navegador:
- Responsavel pelo teste:
- Data:
- Resultado final:
  - [ ] Aprovado
  - [ ] Aprovado com ressalvas
  - [ ] Reprovado

Observacoes gerais:

```text

```

## Convencoes

- Marque cada bloco com `N/A`, `OK` ou `Falha`.
- Ao encontrar falha, registre rota, usuario, horario aproximado e um resumo
  curto do comportamento observado.
- Use dados ficticios ou demo durante a RC, salvo decisao explicita de validar
  com dados reais.
- Para validar producao/staging, confirme antes que:
  - `NUTRI_DEMO_TOOLS_ENABLED=false`
  - `NUTRI_DEMO_TOOLS_ALLOW_PRODUCTION=false`

## Checks Automatizados

- [ ] N/A
- [ ] OK
- [ ] Falha

Executar:

```bash
npm run lint
./node_modules/.bin/tsc --noEmit
npm test
npm run build
npm run test:e2e:install -- chromium
npm run test:e2e
```

Observacoes para E2E:

- A suite Playwright usa `MONGODB_DB_NAME=escala_folga_e2e` por padrao quando
  ela mesma sobe o servidor.
- Se ja existir um servidor Next rodando neste workspace, use uma URL explicita
  para reutilizar o servidor desejado. Para o fluxo completo, o servidor deve
  estar apontando para `MONGODB_DB_NAME=escala_folga_e2e`:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 npm run test:e2e
```

- Para validar os botoes demo de forma isolada:

```bash
npm run test:e2e:demo
```

Resultados:

```text

```

## Preparacao

- [ ] N/A
- [ ] OK
- [ ] Falha

1. Conferir `.env` com MongoDB, `SESSION_SECRET` e usuario admin inicial.
2. Confirmar flags demo desligadas para o fluxo principal.
3. Subir a aplicacao com `npm run dev`.
4. Acessar `/login` em janela limpa ou anonima.
5. Criar ou confirmar a existencia de um usuario `NUTRI`.

Resultado esperado:

- Aplicacao sobe sem erro.
- Usuario anonimo nao acessa areas internas.
- Ferramentas demo nao aparecem com flags desligadas.

Observacoes:

```text

```

## Login E Permissoes

- [ ] N/A
- [ ] OK
- [ ] Falha

1. Tentar acessar `/nutri` sem login.
2. Entrar como `ADMIN` e tentar acessar `/nutri`.
3. Entrar como `USER` e tentar acessar `/nutri`.
4. Entrar como `NUTRI` e confirmar redirecionamento para `/nutri`.
5. Com `NUTRI`, tentar acessar `/admin`, `/schedule`, `/cadastros`,
   `/fairness`, `/export` e `/api/app-state`.
6. Com `NUTRI`, chamar uma rota `/api/nutri/*` simples, como listagem de
   pacientes.

Resultado esperado:

- Apenas `NUTRI` acessa tela e APIs Nutri.
- `ADMIN` pode gerenciar usuario `NUTRI`, mas nao acessa dados clinicos.
- `NUTRI` nao acessa admin, escala nem escrita de estado global.

Observacoes:

```text

```

## Pacientes E Avaliacoes

- [ ] N/A
- [ ] OK
- [ ] Falha

1. Acessar aba `Pacientes`.
2. Cadastrar paciente ficticio com contato e observacoes simples.
3. Buscar o paciente criado.
4. Editar dados do paciente.
5. Arquivar e reativar o paciente.
6. Selecionar o paciente para avaliacao nutricional.
7. Registrar peso, altura, objetivo, rotina, alergias e restricoes ficticias.
8. Conferir IMC calculado e historico de avaliacoes.

Resultado esperado:

- Cadastro, edicao, arquivamento e reativacao persistem apos reload.
- Avaliacao fica ligada ao paciente correto.
- IMC aparece como dado derivado, sem edicao manual.

Observacoes:

```text

```

## Alimentos

- [ ] N/A
- [ ] OK
- [ ] Falha

1. Acessar aba `Alimentos`.
2. Cadastrar alimento manual com fonte, nutrientes por 100 g e alergenicos.
3. Buscar alimento cadastrado.
4. Editar nutrientes e observacao de medida caseira.
5. Arquivar e reativar alimento.

Resultado esperado:

- Alimento ativo fica disponivel para planos e receitas.
- Alimento arquivado nao deve ser oferecido como nova dependencia ativa.
- Busca e contadores refletem ativos, arquivados e total.

Observacoes:

```text

```

## Planos Alimentares

- [ ] N/A
- [ ] OK
- [ ] Falha

1. Acessar aba `Planos`.
2. Confirmar aviso quando faltar paciente ou alimento ativo.
3. Selecionar paciente ativo.
4. Definir titulo e metas nutricionais.
5. Adicionar alimentos em refeicoes com quantidade e medida caseira.
6. Conferir previa, totais e diferenca contra metas.
7. Salvar plano como rascunho.
8. Duplicar plano.
9. Aprovar plano e depois arquivar uma copia.
10. Abrir impressao do plano.

Resultado esperado:

- Plano salvo aparece com status claro.
- Duplicacao cria novo rascunho sem sobrescrever origem.
- Documento imprimivel mostra paciente, status, exportacao, responsavel,
  totais e aviso de revisao profissional.

Observacoes:

```text

```

## Receitas E Fichas Tecnicas

- [ ] N/A
- [ ] OK
- [ ] Falha

1. Acessar aba `Receitas`.
2. Confirmar aviso quando faltar alimento ativo.
3. Criar receita com rendimento, porcao, preparo e ingredientes.
4. Conferir ficha tecnica previa: nutrientes, custo, FC e FCc quando aplicavel.
5. Salvar receita como rascunho.
6. Aprovar receita.
7. Duplicar receita aprovada para nova versao em rascunho.
8. Arquivar uma receita.
9. Abrir impressao da ficha tecnica.

Resultado esperado:

- Receita aprovada fica disponivel para cardapios.
- Duplicacao preserva origem e incrementa fluxo de versao sem mutar a receita
  aprovada.
- Documento imprimivel mostra status, versao, responsavel, custos, nutrientes e
  aviso profissional.

Observacoes:

```text

```

## Cardapios De Restaurante

- [ ] N/A
- [ ] OK
- [ ] Falha

1. Acessar aba `Cardapios`.
2. Confirmar aviso quando faltar receita aprovada.
3. Criar cardapio com data e numero previsto de refeicoes.
4. Adicionar receitas aprovadas com porcoes.
5. Conferir totais nutricionais, custo total, custo per capita e lista de
   compras.
6. Salvar cardapio como rascunho.
7. Aprovar e arquivar cardapio.
8. Abrir impressao operacional.

Resultado esperado:

- Cardapio usa apenas receitas aprovadas.
- Lista de compras e mapa de producao batem com as receitas adicionadas.
- Documento imprimivel mostra data, status, responsavel, compras, producao e
  aviso profissional.

Observacoes:

```text

```

## Exportacoes E Auditoria

- [ ] N/A
- [ ] OK
- [ ] Falha

1. Exportar/imprimir um plano, uma receita e um cardapio.
2. Entrar como `ADMIN`.
3. Acessar logs administrativos.
4. Filtrar por acoes `nutri.*.exported`.
5. Conferir metadados de ids, status, versao quando aplicavel e formato HTML.
6. Confirmar que logs nao exibem anamnese, notas clinicas, plano completo,
   ingredientes detalhados ou texto livre sensivel.

Resultado esperado:

- Exportacoes geram HTML imprimivel.
- Auditoria registra o evento com metadados suficientes e seguros.

Observacoes:

```text

```

## Seeds Demo

- [ ] N/A
- [ ] OK
- [ ] Falha

1. Com flags desligadas, confirmar que botoes `Seed` e `Limpar demos` nao
   aparecem.
2. Com flags desligadas, chamar uma rota `/api/nutri/dev/seed/*` diretamente.
3. Em ambiente local ou demo, ligar `NUTRI_DEMO_TOOLS_ENABLED=true` e reiniciar
   a aplicacao.
4. Confirmar que botoes de seed aparecem apenas para `NUTRI`.
5. Criar seeds por aba: pacientes, alimentos, planos, receitas e cardapios.
6. Confirmar que dados criados possuem prefixo `[Demo]`.
7. Usar `Limpar demos`.
8. Confirmar que dados `[Demo]` foram removidos e dados manuais permaneceram.
9. Desligar `NUTRI_DEMO_TOOLS_ENABLED` novamente.

Resultado esperado:

- Seeds ficam desligados por padrao.
- Rotas demo bloqueiam chamadas sem flag ativa.
- Limpeza remove apenas dados demo.

Observacoes:

```text

```

## Estados Vazios E Dependencias

- [ ] N/A
- [ ] OK
- [ ] Falha

1. Testar modulo em banco sem dados Nutri.
2. Conferir avisos nas abas que dependem de paciente, alimento ou receita
   aprovada.
3. Confirmar que botoes indisponiveis deixam claro o proximo passo do fluxo.
4. Confirmar que tabelas vazias exibem mensagem amigavel.

Resultado esperado:

- Uma nutricionista consegue entender a ordem do fluxo sem conhecer a
  implementacao tecnica.

Observacoes:

```text

```

## Resultado Final

Resumo da validacao:

```text

```

Ressalvas aceitas para a RC:

```text

```

Pendencias bloqueantes:

```text

```

## Avaliacao Humana Complementar

Para julgamento visual, clinico/funcional e aprovacao final com ressalvas, use
tambem `docs/roteiro-avaliacao-humana-nutri-v1.1.0-rc.md`.
