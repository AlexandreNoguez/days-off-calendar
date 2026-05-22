# Modulo Nutri - Visao Geral E Requisitos

Este documento planeja um novo modulo do projeto para uso exclusivo do perfil
`NUTRI`. O modulo deve apoiar uma nutricionista profissional na montagem de
dietas, planos alimentares, cardapios e preparacoes, tanto para pacientes quanto
para restaurantes/servicos de alimentacao.

O sistema deve ser tratado como ferramenta de apoio tecnico. Ele pode calcular,
organizar dados, alertar inconsistencias e gerar documentos, mas a decisao final
e a assinatura profissional continuam sendo da nutricionista.

## Objetivos Do Modulo

- Permitir acesso somente para usuarios com perfil `NUTRI` e administradores
  autorizados.
- Organizar cadastro de pacientes, atendimentos, avaliacoes nutricionais e
  prescricoes dieteticas.
- Calcular estimativas de energia, macronutrientes, micronutrientes relevantes e
  distribuicao por refeicao.
- Montar planos alimentares individualizados com opcoes de substituicao.
- Criar receitas, fichas tecnicas e cardapios para restaurantes ou UAN.
- Calcular composicao nutricional, custo, rendimento, porcao, alergicos e
  ingredientes de preparacoes.
- Gerar relatorios exportaveis para paciente, cozinha, compras e gestao.
- Registrar fonte dos calculos, data, responsavel e versao do plano/cardapio.

## Fora Do Escopo Inicial

- Diagnostico medico automatizado.
- Prescricao automatica sem revisao e aprovacao da nutricionista.
- Teleconsulta, agenda financeira ou prontuario medico completo.
- Integracao com laboratorio, balancas, apps externos ou convenio.
- Rotulagem legal completa pronta para impressao sem validacao profissional.

## Principios De Produto

- **Seguranca primeiro:** dados de saude sao sensiveis. O modulo deve restringir
  acesso, auditar alteracoes e evitar exposicao desnecessaria.
- **Calculo explicavel:** todo resultado precisa mostrar parametros usados,
  formula escolhida, tabela de composicao e data da base.
- **Autonomia profissional:** o sistema sugere e calcula, mas a nutricionista
  ajusta e aprova.
- **Contexto alimentar real:** preferencias, cultura, rotina, poder aquisitivo,
  aversoes, religiao e disponibilidade de alimentos importam tanto quanto os
  numeros.
- **Separacao de dominios:** regras de nutricao e calculos devem ficar em
  `src/modules/nutri/domain` e `src/modules/nutri/application`,
  independentes de React, Next.js e MongoDB.
- **Modulo extraivel:** a maior parte do codigo deve viver em
  `src/modules/nutri`, com `app/` servindo apenas como adaptador de rota do
  Next.js.

## Perfil NUTRI

O perfil `NUTRI` deve ser uma nova opcao de `UserRole`.

Permissoes sugeridas:

- Acessar menu `Nutri`.
- Criar e editar pacientes, atendimentos, planos alimentares, receitas e
  cardapios.
- Visualizar apenas dados do proprio modulo de nutricao.
- Exportar documentos nutricionais.
- Nao acessar telas administrativas gerais, a menos que tambem seja `ADMIN`.
- Nao editar escala de folgas, regras de escala ou cadastros operacionais.

O `ADMIN` pode gerenciar usuarios `NUTRI`, mas nao deve acessar prontuarios e
dados sensiveis de saude por padrao. Se for necessario acesso administrativo a
dados clinicos, isso deve ser uma permissao explicita e auditada.

## Necessidades De Uma Nutricionista

### Atendimento Individual

Uma nutricionista normalmente precisa registrar:

- Dados cadastrais e contato do paciente.
- Objetivo do atendimento: emagrecimento, ganho de massa, saude metabolica,
  gestacao, esporte, rotina alimentar, reeducacao, entre outros.
- Historico de saude informado, comorbidades, medicamentos, suplementos,
  alergias e intolerancias.
- Rotina: horarios, trabalho, sono, atividade fisica, refeicoes fora de casa,
  acesso a cozinha, orcamento e preferencia alimentar.
- Avaliacao antropometrica: peso, altura, IMC, circunferencias, dobras ou
  composicao corporal quando aplicavel.
- Recordatorio alimentar, frequencia alimentar e habitos.
- Exames laboratoriais informados ou solicitados quando couber.
- Diagnostico de nutricao, conduta, metas e evolucao.
- Prescricao dietetica com data, VET, consistencia quando aplicavel,
  macronutrientes, micronutrientes relevantes, fracionamento e identificacao da
  nutricionista responsavel.

### Plano Alimentar Para Pacientes

O plano deve ajudar a nutricionista a:

- Definir meta energetica diaria e distribuicao de macros.
- Distribuir refeicoes por horario ou periodo.
- Montar refeicoes com alimentos, medidas caseiras, gramas/ml e equivalentes.
- Criar grupos de substituicao por perfil nutricional.
- Comparar meta planejada versus valores calculados.
- Alertar excesso/deficit de energia, proteina, carboidrato, gordura, fibra,
  sodio, acucar adicionado e gordura saturada, conforme regra configurada.
- Adaptar o plano a alergias, intolerancias, aversoes, cultura alimentar,
  restricoes religiosas, preferencia vegetariana/vegana e orcamento.
- Gerar versao para paciente em linguagem clara.

### Restaurantes E Servicos De Alimentacao

Para restaurantes, cozinhas ou UAN, a nutricionista precisa:

- Cadastrar ingredientes, fornecedores e unidades de medida.
- Criar fichas tecnicas de preparacao.
- Informar peso bruto, fator de correcao, fator de coccao, rendimento, porcao e
  modo de preparo.
- Calcular custo por receita, porcao e cardapio.
- Calcular composicao nutricional por 100 g, por porcao e por cardapio.
- Identificar ingredientes que podem causar alergia ou intolerancia.
- Planejar cardapios por dia, refeicao, publico, unidade e periodo.
- Gerar lista de compras e previsao de producao por numero de refeicoes.
- Emitir relatorios para cozinha, compras, gestao e informacao nutricional.

## Fluxos Principais

### Fluxo 1 - Paciente

1. `NUTRI` cria paciente.
2. Registra anamnese, objetivo, restricoes e avaliacao.
3. Calcula necessidades nutricionais usando parametros revisaveis.
4. Monta plano alimentar por refeicoes.
5. O sistema compara metas versus totais planejados.
6. `NUTRI` revisa, aprova e gera documento para paciente.
7. Em retorno, registra evolucao e cria nova versao do plano.

### Fluxo 2 - Receita/Ficha Tecnica

1. `NUTRI` cadastra ingredientes ou importa da base de alimentos.
2. Monta receita com quantidades brutas e/ou liquidas.
3. Define rendimento, porcao e modo de preparo.
4. O sistema calcula custo e composicao nutricional.
5. `NUTRI` revisa alergicos, observacoes e validade da ficha.
6. Receita fica disponivel para cardapios.

### Fluxo 3 - Cardapio De Restaurante

1. `NUTRI` cria cardapio por unidade, data, refeicao e publico.
2. Seleciona preparacoes e numero previsto de refeicoes.
3. Sistema calcula custo total, custo per capita e nutrientes.
4. Sistema gera lista de compras e mapa de producao.
5. `NUTRI` aprova e exporta relatorios.

## Requisitos Funcionais

- Criar rota `/nutri`.
- Criar menu `Nutri` visivel para `NUTRI` e, se decidido, `ADMIN`.
- Criar helper server-side `requireNutriUser` ou `requireNutriOrAdminUser`.
- Expandir `UserRole` para incluir `NUTRI`.
- Criar entidades de dominio para paciente, atendimento, avaliacao, plano,
  alimento, ingrediente, receita, ficha tecnica, cardapio e documento exportado.
- Criar calculadoras puras para:
  - IMC.
  - Estimativa energetica.
  - Distribuicao de macronutrientes.
  - Totais por refeicao e por dia.
  - Receita por rendimento e porcao.
  - Custo por preparacao e cardapio.
- Criar auditoria para criacao, alteracao, aprovacao e exportacao.
- Criar exportacao PDF ou HTML imprimivel para planos e fichas.
- Registrar fonte nutricional de cada alimento: base, versao, data e observacao.

## Requisitos Nao Funcionais

- Dados clinicos devem ficar separados dos dados de escala.
- Evitar guardar informacoes de saude em logs.
- Toda rota do modulo deve validar permissao no server.
- Os calculos devem ter testes unitarios.
- Exportacoes devem conter data, responsavel e aviso de revisao profissional.
- Alteracoes relevantes devem manter historico ou versao.
- O modulo deve funcionar bem em desktop primeiro; mobile pode ser leitura e
  ajustes simples no MVP.

## Riscos E Cuidados

- **Risco clinico:** calculos incorretos podem causar dano. Mitigar com testes,
  formulas versionadas, exibicao de parametros e aprovacao manual.
- **Risco legal:** informacao nutricional e prescricao exigem responsabilidade
  tecnica. Mitigar com documentos revisaveis, assinatura profissional e fontes.
- **LGPD:** dados de saude sao sensiveis. Mitigar com acesso minimo, auditoria,
  privacidade por padrao e exportacoes controladas.
- **Base de alimentos:** tabelas diferentes podem divergir. Mitigar registrando
  fonte por item e permitindo ajuste manual com justificativa.
- **Restaurantes:** rendimento real muda por tecnica, equipamento e fornecedor.
  Mitigar permitindo fator de correcao/coccao editavel e revisao da ficha.

## Fontes Consultadas

- CFN - Resolucao CFN 600/2018, atribuicoes por area de atuacao:
  https://www.cfn.org.br/wp-content/uploads/resolucoes/Res_600_2018.htm
- CFN - Resolucao CFN 594/2017, registro em prontuario:
  https://www.cfn.org.br/wp-content/uploads/resolucoes/Res_594_2017.htm
- CFN - Resolucao CFN 599/2018, Codigo de Etica e Conduta:
  https://www.cfn.org.br/wp-content/uploads/resolucoes/Res_599_2018.html
- Ministerio da Saude - Guia Alimentar para Populacao Brasileira:
  https://www.gov.br/saude/pt-br/composicao/saps/ecv/publicacoes/guia-alimentar-para-populacao-brasileira/view
- Anvisa - Rotulagem nutricional, RDC 429/2020 e IN 75/2020:
  https://www.gov.br/anvisa/pt-br/assuntos/alimentos/rotulagem/rotulagem-nutricional/
- IBGE - Tabelas de Composicao Nutricional dos Alimentos Consumidos no Brasil:
  https://www.ibge.gov.br/estatisticas/economicas/precos-e-custos/9050-pesquisa-de-orcamentos-familiares.html?edicao=9063
