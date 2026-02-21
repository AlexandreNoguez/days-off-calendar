````md
# Escala de Folgas (MVP) — Documentação do Projeto

Aplicação **frontend-only** para montar uma escala de folgas com regras (HARD/SOFT), evitar desfalques e permitir exportação para **XLSX**.
Stack: **React + Vite + TypeScript + MUI + Zustand + React Router + RHF + Zod + Toastify + XLSX**.

---

## ✅ Objetivos do MVP

- Permitir cadastrar **cargos** e **funcionários** (com flags como “sempre folga domingo”).
- Configurar o **período (mês/ano)** e marcar **feriados**.
- Montar escala de folgas com validação de regras (hard/soft).
- Manter **histórico (undo/redo)** da escala.
- Exportar a escala para **.xlsx**.
- Persistir dados no **localStorage**, com opção de limpeza.

---

## ✅ Regras de negócio (levantamento inicial)

### Funcionários e cargos

- Cozinheiros: Gustavo, Milena, Dyson, Alex
- Lavanderia: Ingrid
- Paneleiro: Fernando
- Auxiliares: Clarice, Lidriel, Maria, Elaine, Josana, Luís
- Auxiliar de estoque: Tales

### Regras (MVP)

- Tales trabalha **segunda a sábado** e **folga sempre aos domingos**.
- Cozinheiros fazem rodízio: **1 cozinheiro de folga por domingo** (aprox. 1 domingo por mês cada).
- Se cozinheiro **folga no domingo**, **não pode folgar na semana**.
- Se cozinheiro **trabalha no domingo**, **precisa folgar 1 dia na semana**.
- Não pode ter folga coincidindo:
  - Clarice, Ingrid e Elaine não podem folgar no mesmo dia.
  - Elaine não pode folgar no mesmo dia de Josana e também não pode folgar no mesmo dia de Luís.
  - Ingrid e Fernando não podem folgar no mesmo dia (e vice-versa).
  - Se Maria folga, Lidriel não pode folgar.
- Substituição:
  - Quando Josana ou Luís estiverem de folga, **Elaine deve trabalhar** (substitui).
- Feriados:
  - Cada pessoa tem direito a **1 folga em feriado por ano** (além das folgas normais).
- Regra SOFT:
  - Evitar que alguém folgue sempre no mesmo dia da semana.

---

## ✅ Stack adotada

### Core

- [x] React + Vite + TypeScript

### UI

- [x] MUI (Material UI)
- [x] AppShell com layout responsivo
- [ ] (Opcional) MUI X DataGrid / Date Pickers (avaliar uso no MVP)

### Estado

- [x] Zustand
- [x] Persistência com `zustand/middleware` (localStorage)
- [x] Botão/fluxo para limpar localStorage (planejado no App Store / persistance)

### Roteamento

- [x] React Router (router central com rotas do wizard)
- [ ] ErrorBoundary customizado no router (melhor UX para erros)

### Forms/Validação

- [x] react-hook-form + zod (implementado em Employees/Rules)

### Notificações

- [ ] react-toastify (planejado para feedbacks do wizard / validações)

### Export XLSX

- [ ] SheetJS (xlsx) (planejado)
- [ ] (Alternativa) ExcelJS (avaliar se necessário)

---

## ✅ Arquitetura e padrões

### Regras gerais

- [x] **Views não contêm lógica de negócio**
      Views apenas renderizam UI e disparam callbacks.
- [x] Lógica fica em **hooks** (feature hooks) e **stores** (estado).
- [x] Tipos e contratos em `domain/types`.

### Estrutura por camadas (front)

- `src/domain/*` → tipos, regras, defaults (seed), contratos
- `src/stores/*` → zustand stores + persistência
- `src/features/*` → containers + views + hooks por feature
- `src/shared/*` → utilitários e helpers (datas, etc.)
- `src/app/*` → router, layout (AppShell), providers

---

## ✅ Persistência com Zustand (importante)

### Problema resolvido

- [x] Evitar persistir `actions` (funções) no localStorage
      → Isso causava erros como `setHasSavedData is not a function` e loops de render.

### Padrão aplicado

- [x] `partialize` para persistir **apenas campos serializáveis**
- [x] `merge` garantindo que `actions` do estado atual **nunca** seja sobrescrito por dados persistidos antigos

### Observação

- [x] Após mudanças no persist, é necessário **limpar localStorage** para remover versões antigas.

---

## ✅ Funcionalidades implementadas até agora (checkbox)

### Fundação do projeto

- [x] Projeto React + Vite + TS criado
- [x] Estrutura inicial de pastas (app/features/stores/domain/shared)
- [x] Router com wizard de planejamento (setup/schedule/export) + menu lateral de cadastros em 3 entradas
- [x] AppShell base com layout agradável
- [x] Ajustes de tipagem e exports dos containers (erros 2305 resolvidos)

### Stores

- [x] `app.store.ts` com:
  - [x] wizardStep
  - [x] hasSavedData
  - [x] persist + partialize
- [x] `employees.store.ts` com:
  - [x] CRUD de roles
  - [x] CRUD de employees
  - [x] seedDefaults
  - [x] persist + partialize (+ limpeza de localStorage quando necessário)
- [x] `rules.store.ts` com:
  - [x] setRules / toggleRule / updateRuleParams
  - [x] seedDefaults
  - [x] persist + partialize (+ limpeza de localStorage quando necessário)
- [x] `schedule.store.ts` com histórico (undo/redo) + assign (base)
- [x] `history.ts` (push/undo/redo)
- [x] Correção de imports type-only com `verbatimModuleSyntax`

### Wizard / Setup

- [x] Hook `useWizardFlow` (navegação entre passos)
- [x] Hook `useSeedDefaults` (carregar dados padrão)
- [x] Ação “Carregar dados padrão” funcionando após correções de persistência
- [x] Step 2 (Setup calendário + feriados) — concluído

---

## ⬜ Próximos passos (roadmap do MVP)

### Step 2 — Setup (mês/ano + feriados)

- [x] Criar/ajustar `plan.store.ts` (year/month/holidays) com persist
- [x] Criar `shared/utils/dates.ts` (getDaysOfMonth, weekday, etc.)
- [x] Implementar `useSetup()` (contrato pra view)
- [x] SetupPage.view: grid de calendário + toggles de feriado

### Step 3 — Employees

- [x] UI de listagem e cadastro (RHF + zod)
- [x] Seleção de cargo (Role)
- [x] Checkbox “sempre folga domingo”
- [x] UX: tabela MUI simples
- [x] Botão para restaurar defaults de Employees (seed)

### Step 4 — Rules

- [x] Listagem de regras com switch enabled/disabled
- [x] Editor de parâmetros (JSON no MVP)
- [x] Validação de regras (HARD/SOFT)
- [x] Botão para restaurar defaults de Rules (seed)


### Cadastros no menu lateral

- [x] Cadastros · Colaboradores (`/cadastros/employees`)
- [x] Cadastros · Cargos (`/cadastros/roles`)
- [x] Cadastros · Rules (`/cadastros/rules`)
- [x] Reuso das telas existentes com foco de espaço por seção

### Step 5 — Schedule

- [x] Grade de escala por dia/funcionário
- [x] Aplicação automática de regras (gerar sugestão)
- [x] Validações e conflitos (exibir mensagens)
- [x] Undo/redo UI
- [ ] Histórico de alterações (log)

### Step 6 — Export

- [x] Montar planilha XLSX final
- [x] Escolher lib final (implementação interna OOXML sem dependência externa)
- [x] Exportar com formatação mínima

### Extras (qualidade)

- [ ] ErrorBoundary customizado no router
- [ ] Toastify em ações importantes (seed, salvar, export)
- [ ] Responsividade refinada no AppShell (Drawer/hamburger)
- [x] Botão “limpar dados” global (localStorage + reset stores)
- [ ] Documentação de regras (HARD/SOFT) e exemplos

---

## 🧪 Como rodar (dev)

```bash
npm install
npm run dev
```
````

---

## 🧠 Convenções importantes

- Containers chamam hooks e repassam props para Views.
- Views não acessam stores direto (evitar lógica/efeito em UI).
- Stores persistidas devem usar:
  - `partialize` (não persistir actions)
  - `merge` (não aceitar sobrescrita de actions por dados antigos)

- Se surgir erro do tipo “X is not a function” em actions:
  - limpar localStorage e revisar persist config.

---

## 📌 Notas

- O MVP será feito **sem backend**.
- Os dados ficam no **localStorage** e podem ser exportados para XLSX.
- As regras podem evoluir para suportar mais cargos, times e calendários.

```

```
