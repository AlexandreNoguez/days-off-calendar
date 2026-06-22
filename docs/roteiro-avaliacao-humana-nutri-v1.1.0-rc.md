# Avaliacao Humana Nutri v1.1.0-rc

Este roteiro cobre os pontos que Playwright/Vitest ajudam a preparar, mas nao
devem decidir sozinhos. Use depois dos testes automatizados e antes da tag
`v1.1.0-rc`.

## Registro

- Ambiente:
- URL:
- Branch/commit:
- Responsavel:
- Data:
- Resultado:
  - [ ] Aprovado
  - [ ] Aprovado com ressalvas
  - [ ] Reprovado

## Layout Premium E Usabilidade

- [ ] N/A
- [ ] OK
- [ ] Falha

Avaliar:

1. A primeira dobra da tela `/nutri` comunica claramente o modulo e as metricas.
2. Abas, cards, formularios e tabelas usam MUI de forma consistente.
3. O fluxo visual nao parece improvisado ou tecnico demais para uma nutricionista.
4. Estados vazios e avisos orientam o proximo passo sem excesso de texto.
5. Textos cabem em desktop e mobile sem sobreposicao, corte ou rolagem estranha.
6. Acoes principais e perigosas estao visualmente distinguiveis.

Como avaliar:

- Abrir em desktop.
- Abrir em viewport mobile pelo DevTools.
- Percorrer todas as abas com banco vazio e com dados criados.
- Registrar screenshots apenas se houver ressalvas visuais.

Observacoes:

```text

```

## Revisao Profissional/Nutricional

- [ ] N/A
- [ ] OK
- [ ] Falha

Avaliar:

1. Campos de paciente e avaliacao sao suficientes para uma RC controlada.
2. Alimentos manuais deixam claro fonte, versao e nutrientes por 100 g.
3. Planos alimentares nao sugerem diagnostico ou prescricao automatica.
4. Receitas/fichas tecnicas exibem rendimento, porcao, custo e fatores de forma
   compreensivel.
5. Cardapios de restaurante comunicam compras, producao, custo e nutrientes de
   modo operacionalmente util.
6. Avisos de revisao profissional nos documentos sao adequados.

Como avaliar:

- Uma nutricionista ou responsavel funcional deve revisar os fluxos com dados
  ficticios.
- Marcar qualquer campo indispensavel que falte para a RC.
- Separar bloqueios da RC de melhorias para v1.1.0 final/v1.2.0.

Observacoes:

```text

```

## Documentos Imprimiveis

- [ ] N/A
- [ ] OK
- [ ] Falha

Avaliar:

1. Plano alimentar impresso tem leitura adequada para paciente.
2. Ficha tecnica impressa tem leitura adequada para cozinha/operacao.
3. Cardapio impresso tem leitura adequada para compras e producao.
4. Data de exportacao, status, versao quando aplicavel e responsavel tecnico
   estao claros.
5. O documento impresso em papel/PDF do navegador nao corta tabelas importantes.

Como avaliar:

- Abrir cada documento.
- Usar preview de impressao do navegador.
- Testar pelo menos uma pagina em PDF do navegador, sem exigir PDF nativo.

Observacoes:

```text

```

## Ambiente, Dados Reais E Privacidade

- [ ] N/A
- [ ] OK
- [ ] Falha

Avaliar:

1. Ambiente da RC usa banco apropriado para teste/controlado.
2. Backups e politica de acesso foram combinados antes de usar dados reais.
3. `NUTRI_DEMO_TOOLS_ENABLED=false` em producao/staging sensivel.
4. `NUTRI_DEMO_TOOLS_ALLOW_PRODUCTION=false` salvo decisao explicita de demo.
5. Logs nao expõem notas clinicas, anamnese, plano completo ou texto livre
   sensivel.

Como avaliar:

- Conferir variaveis de ambiente do deploy.
- Conferir usuarios ativos e perfis.
- Revisar alguns logs apos exportacoes e alteracoes.

Observacoes:

```text

```

## Decisao Da RC

Pendencias bloqueantes:

```text

```

Ressalvas aceitas:

```text

```

Melhorias candidatas para depois da RC:

```text

```
