# Roadmap de Funcionalidades Para Gestao de Folgas

Este documento mapeia ideias de produto para aumentar o valor percebido do
aplicativo de escala de folgas. A ideia e manter as pendencias tecnicas ja
mapeadas em outro backlog e, aqui, organizar funcionalidades que resolvem dores
do cliente: reduzir retrabalho, diminuir conversas manuais, dar transparencia e
melhorar a distribuicao das folgas.

## Escopo Fechado Da v1.0.0

A v1.0.0 esta fechada como a primeira versao oficial estavel da gestao de
folgas. O escopo inclui autenticacao, permissoes, administracao de usuarios,
persistencia MongoDB, cadastros operacionais, regras, geracao e edicao de
escala, publicacao/fechamento, auditoria, historico, exportacao XLSX e a
primeira versao do painel de justica/equilibrio.

Ficam fora da v1.0.0 as funcionalidades de colaborador, pedidos de folga,
cobertura minima, alertas inteligentes, copiar mes anterior e demais evolucoes
deste roadmap. Esses itens comecam a compor o planejamento da v1.1.0 em diante.

O escopo formal e as notas de release estao em
`docs/release-v1.0.0.md`.

## Proxima Tarefa Priorizada

1. Evoluir painel de justica/equilibrio com comparacao historica.

Esta e a proxima tarefa apos a v1.0.0. O objetivo e dar ao gestor uma visao
historica de distribuicao de folgas, domingos, feriados e possiveis
desequilibrios entre colaboradores.

## Prioridade Recomendada

1. Evoluir painel de justica/equilibrio com comparacao historica.
2. Tela do colaborador.
3. Solicitacao de folga.
4. Cobertura minima por cargo.
5. Alertas inteligentes.
6. Copiar mes anterior.

Essas funcionalidades formam o proximo bloco de evolucao porque criam uma ponte
clara entre planejamento interno, comunicacao com colaboradores e controle
operacional.

## 1. Publicar Escala

**Status:** implementado.

**Valor para o cliente:** separa rascunho de escala oficial. O gestor pode montar
e ajustar a escala sem confundir o que ja foi comunicado.

**Como implementar:**

- Adicionar status na escala do periodo: `DRAFT`, `PUBLISHED` e `CLOSED`.
- Guardar metadados de publicacao: data, usuario que publicou, data de fechamento
  e usuario que fechou.
- Exibir o status no cabecalho da escala e na exportacao.
- Bloquear edicoes diretas quando a escala estiver publicada ou fechada.
- Permitir reabrir a escala, voltando para rascunho.
- Registrar auditoria: `schedule.published`, `schedule.reopened`,
  `schedule.closed`.

**Dados/API:**

- Expandir `ScheduleDocument` e `AppStateDto.schedule`.
- Aceitar patch de metadados da escala em `/api/app-state`.
- Manter compatibilidade com escalas antigas tratando status ausente como
  `DRAFT`.

**UI:**

- Chips de status no topo.
- Botoes: `Publicar`, `Reabrir` e `Fechar`.
- Alertas quando a escala estiver bloqueada para edicao.

## 2. Tela do Colaborador

**Valor para o cliente:** reduz perguntas individuais e aumenta transparencia.
Cada pessoa ve suas folgas, domingos, feriados e historico.

**Como implementar:**

- Criar rota `/minha-escala`.
- Relacionar usuario a colaborador, adicionando `employeeId` opcional no usuario.
- Mostrar apenas dados do colaborador logado.
- Exibir escala publicada do mes atual e historico de meses anteriores.
- Se nao houver escala publicada, mostrar mensagem de aguardando publicacao.

**Dados/API:**

- Criar endpoint autenticado para retornar a escala do usuario logado.
- Filtrar por `employeeId`.
- Responder somente escalas `PUBLISHED` ou `CLOSED`, salvo perfil admin.

**UI:**

- Calendario pessoal.
- Lista de proximas folgas.
- Destaque para domingos e feriados.
- Historico simples de alteracoes que afetaram o colaborador.

## 3. Solicitacao de Folga

**Valor para o cliente:** formaliza pedidos de folga e reduz controle paralelo
por WhatsApp, papel ou conversa solta.

**Como implementar:**

- Criar entidade `TimeOffRequest`.
- Permitir colaborador solicitar uma data ou intervalo.
- Admin aprova ou nega.
- Ao aprovar, simular impacto na escala antes de aplicar.
- Registrar justificativa e auditoria.

**Dados/API:**

- Colecao `timeOffRequests`.
- Status: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.
- Campos: colaborador, datas, motivo, aprovador, decisoes, timestamps.

**UI:**

- Tela do colaborador com formulario de pedido.
- Aba admin com fila de solicitacoes.
- Sinalizacao de conflitos antes da aprovacao.

## 4. Painel de Justica e Equilibrio

**Status:** primeira versao implementada.

**Valor para o cliente:** mostra se a escala esta distribuindo folgas de forma
equilibrada. Ajuda a evitar percepcao de favoritismo.

**Como implementar:**

- Calcular indicadores por colaborador.
- Comparar domingos de folga, feriados de folga, total de folgas, sequencias de
  trabalho e padrao de dias da semana.
- Criar ranking de desequilibrio.
- [Pendente] Integrar com o historico de escalas.

**Dados/API:**

- Pode iniciar como calculo derivado do estado atual.
- Depois evoluir para endpoint dedicado com intervalo de datas.

**UI:**

- Cards de resumo.
- Tabela por colaborador.
- Alertas de distribuicao fora do esperado.

## 5. Cobertura Minima Por Cargo

**Valor para o cliente:** garante que a escala nao deixe a operacao descoberta.
A regra deixa de olhar apenas folgas e passa a olhar quantidade minima de pessoas
trabalhando por funcao.

**Como implementar:**

- Criar regra configuravel por cargo, dia da semana e/ou data especifica.
- Validar quantidade minima de pessoas trabalhando.
- Fazer a geracao automatica respeitar a cobertura.

**Dados/API:**

- Reaproveitar `RuleConfig` com novo template.
- Parametros sugeridos: `roleId`, `minWorkingCount`, `weekdays`, `dateISOs`.

**UI:**

- Formulario guiado dentro de regras.
- Tabela de cobertura por cargo.
- Conflitos mostrando cargo, data e quantidade faltante.

## 6. Alertas Inteligentes

**Valor para o cliente:** o gestor nao precisa procurar problemas na escala; o
sistema chama atencao para riscos.

**Como implementar:**

- Consolidar conflitos, avisos e oportunidades em um painel.
- Criar severidades: `CRITICAL`, `WARNING`, `INFO`.
- Gerar alertas a partir das regras existentes e de indicadores operacionais.

**Dados/API:**

- Comecar como calculo client-side usando validacao existente.
- Evoluir para endpoint `/api/alerts` quando houver tela do colaborador,
  notificacoes e multiplos perfis.

**UI:**

- Painel lateral ou bloco no topo da escala.
- Filtros por colaborador, cargo e severidade.
- Acoes rapidas para ir ate a celula afetada.

## 7. Copiar Mes Anterior

**Valor para o cliente:** acelera a criacao de uma escala nova. O gestor parte de
um padrao conhecido e ajusta somente o necessario.

**Como implementar:**

- Buscar escala do mes anterior.
- Copiar atribuicoes compatibilizando datas pelo dia da semana ou pelo numero do
  dia, conforme decisao de produto.
- Revalidar conflitos no mes novo.
- Salvar como rascunho.

**Dados/API:**

- Endpoint ou acao em `/api/app-state` para copiar periodo.
- Registrar auditoria `schedule.copied_from_previous_month`.

**UI:**

- Botao em Setup ou Escala.
- Preview informando origem e quantidade de celulas copiadas.
- Confirmacao antes de substituir escala atual.

## 8. Disponibilidade e Indisponibilidade

**Valor para o cliente:** captura restricoes reais antes da escala ser gerada.

**Como implementar:**

- Permitir marcar dias preferenciais, indisponiveis ou obrigatorios.
- Fazer a geracao automatica considerar essas preferencias.
- Diferenciar restricao obrigatoria de preferencia.

**Dados/API:**

- Colecao ou campo `availability` por colaborador.
- Periodicidade mensal ou padrao semanal.

**UI:**

- Calendario por colaborador.
- Marcadores: disponivel, indisponivel, preferencia de folga.

## 9. Troca de Folga Entre Colaboradores

**Valor para o cliente:** formaliza trocas e evita que a escala oficial fique
desatualizada.

**Como implementar:**

- Criar solicitacao de troca entre duas pessoas e duas datas.
- Validar impacto antes de aplicar.
- Exigir aceite do outro colaborador e aprovacao do admin, se necessario.

**Dados/API:**

- Entidade `ShiftSwapRequest`.
- Status semelhante a solicitacao de folga.

**UI:**

- Fluxo de pedido no painel do colaborador.
- Fila admin com preview dos conflitos.

## 10. Calendario Mensal Visual

**Valor para o cliente:** facilita leitura operacional do dia: quem folga hoje,
quem trabalha, onde ha risco.

**Como implementar:**

- Criar uma visao calendario alem da grade por colaborador.
- Cada dia mostra folgas por cargo e alertas.
- Permitir clicar no dia e abrir detalhes.

**Dados/API:**

- Derivado da escala atual.
- Pode usar os mesmos dados de `AppStateDto`.

**UI:**

- Alternancia `Grade` / `Calendario`.
- Badges por cargo e por conflito.

## 11. Folgas Compensatorias / Banco de Folgas

**Valor para o cliente:** controla creditos gerados por trabalho em domingo ou
feriado e o uso desses creditos.

**Como implementar:**

- Registrar credito, uso e saldo.
- Associar creditos a uma origem: domingo, feriado, ajuste manual.
- Validar saldo antes de usar.

**Dados/API:**

- Entidade `TimeOffCredit`.
- Campos: colaborador, origem, data, quantidade, status.

**UI:**

- Saldo por colaborador.
- Extrato de creditos.
- Acao para usar credito em uma folga.

## 12. Relatorio Individual

**Valor para o cliente:** facilita conferencia, comunicacao e comprovacao de
escala por pessoa.

**Como implementar:**

- Gerar resumo por colaborador.
- Incluir dias de trabalho, folgas, domingos, feriados e conflitos.
- Exportar PDF ou XLSX individual.

**Dados/API:**

- Derivado da escala e historico.
- Endpoint futuro para gerar arquivo server-side se necessario.

**UI:**

- Botao no colaborador ou tela de exportacao.
- Filtro por periodo.

## 13. Notificacoes

**Valor para o cliente:** reduz comunicacao manual e garante que alteracoes sejam
vistas.

**Como implementar:**

- Comecar com notificacoes internas.
- Depois integrar email ou WhatsApp.
- Disparar notificacao quando escala for publicada ou alterada.

**Dados/API:**

- Entidade `Notification`.
- Preferencias por usuario.

**UI:**

- Sino/notificacoes dentro do app.
- Status de leitura.

## 14. Multiunidade / Equipes

**Valor para o cliente:** permite que o produto atenda mais de uma loja, setor ou
time.

**Como implementar:**

- Criar entidade `Team` ou `Unit`.
- Associar colaboradores, regras e escalas a uma unidade.
- Filtrar todas as telas pela unidade selecionada.

**Dados/API:**

- Adicionar `unitId` nas entidades principais.
- Migrar dados existentes para unidade padrao.

**UI:**

- Seletor de unidade no topo.
- Permissoes por unidade em uma fase futura.

## 15. Auditoria Amigavel

**Valor para o cliente:** transforma logs tecnicos em narrativa compreensivel.

**Como implementar:**

- Criar mensagens de auditoria formatadas por tipo de acao.
- Mostrar antes/depois quando fizer sentido.
- Permitir filtrar por colaborador e periodo.

**Dados/API:**

- Aproveitar `auditLogs`.
- Padronizar metadados por acao.

**UI:**

- Linha do tempo: "Maria mudou de Trabalho para Folga em 18/05".
- Filtros claros.

## 16. Importacao de Colaboradores

**Valor para o cliente:** acelera implantacao inicial.

**Como implementar:**

- Importar CSV ou XLSX.
- Validar nomes, cargos e duplicidades.
- Permitir preview antes de salvar.

**Dados/API:**

- Endpoint de upload ou parser client-side.
- Relatorio de erros por linha.

**UI:**

- Upload com modelo de planilha.
- Tela de revisao antes de confirmar.

## 17. Modo Simulacao

**Valor para o cliente:** permite comparar cenarios sem afetar a escala oficial.

**Como implementar:**

- Criar rascunhos alternativos por periodo.
- Comparar conflitos e indicadores entre simulacoes.
- Promover uma simulacao para rascunho principal.

**Dados/API:**

- `ScheduleDocument` com campo `variantId` ou colecao de simulacoes.

**UI:**

- Abas de cenarios.
- Comparacao lado a lado.

## 18. Comentarios Por Dia

**Valor para o cliente:** registra contexto operacional que influencia a escala.

**Como implementar:**

- Permitir anotacao por data.
- Exibir comentario no calendario e grade.
- Usar comentario como contexto para decisao manual.

**Dados/API:**

- Campo `dayNotes` por periodo ou colecao `calendarNotes`.

**UI:**

- Popover ou drawer do dia.
- Indicador visual quando houver nota.

## 19. Regras Por Prioridade/Peso

**Valor para o cliente:** deixa a geracao automatica mais flexivel. Nem tudo que
e preferencia deve bloquear a escala.

**Como implementar:**

- Adicionar peso numerico ou prioridade nas regras.
- Usar peso no algoritmo de sugestao.
- Mostrar pontuacao da escala.

**Dados/API:**

- Expandir `RuleConfig` com `weight` ou `priority`.

**UI:**

- Campo de prioridade no cadastro de regra.
- Indicador de pontuacao da escala.

## 20. Templates de Escala

**Valor para o cliente:** abre caminho para atender outros tipos de operacao sem
reescrever regras manualmente.

**Como implementar:**

- Criar templates como `6x1`, `12x36`, rodizio semanal e rodizio por cargo.
- Aplicar template para gerar regras e parametros iniciais.
- Permitir editar depois da aplicacao.

**Dados/API:**

- Catalogo de templates no dominio.
- Geracao de `RuleConfig` a partir do template.

**UI:**

- Assistente inicial de configuracao.
- Preview das regras que serao criadas.

## Pendencias Tecnicas Mantidas Fora Deste Roadmap

Estas pendencias tecnicas foram resolvidas na migracao principal e ficam aqui
apenas como registro historico:

- [x] Testes automatizados e fixtures basicas.
- [x] Indices MongoDB e validacao de seed em banco limpo.
- [x] Reset/troca de senha pelo Admin.
- [x] Politica definitiva de permissao entre `USER` e `ADMIN`.
- [x] Auditoria de alteracoes em lote/reset.
- [x] Checklist manual de QA, validacao em MongoDB Atlas e deploy.
