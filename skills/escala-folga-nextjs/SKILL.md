---
name: escala-folga-nextjs
description: Use whenever Codex works in the escala-folga repository or any Next.js App Router task for this project, including feature work, bug fixes, refactors, API routes, authentication, MongoDB persistence, MUI UI, schedule rules, audit logs, documentation updates, or validation. Load this skill before making code changes so project context, architecture boundaries, and validation rules from docs/contexto-para-proximos-chats.md are consistently followed.
---

# Escala Folga Next.js

## Core Workflow

Before implementing or reviewing changes in this repo:

1. Read `docs/contexto-para-proximos-chats.md`.
2. Read `docs/plano-migracao-nextjs-mongodb.md` when the task touches architecture, persistence, auth, permissions, or migration checklist items.
3. Read `docs/roadmap-funcionalidades-gestao-folgas.md` when the task touches product scope or planned features.
4. Run `git status --short` and preserve any existing user changes.
5. Keep changes small, focused, and aligned with the existing Next.js + MUI + MongoDB structure.

Treat those docs as the source of truth. Do not duplicate their full content in the skill; re-read them because they are living project context.

## Architecture Rules

Preserve these boundaries:

- Use App Router routes under `app/`.
- Keep backend HTTP behavior in `app/api/*`.
- Keep render-only client components in `src/components/*`.
- Put screen state, API calls, toast behavior, permissions, derived rows, labels, and actions in `src/components/hooks/*`.
- Keep pure domain concepts in `src/domain/*`.
- Keep framework-independent use cases in `src/application/usecases/*`.
- Keep server-only auth, MongoDB, audit, and environment code in `src/lib/server/*`.

Do not put business logic in rendering components. JSX files should mostly compose MUI components, render prepared data, and call actions exposed by hooks.

Use this hook shape for screen hooks:

```ts
return {
  state: {
    // ready-to-render data
  },
  actions: {
    // functions called by the view
  },
};
```

## Domain And Backend

Keep `src/domain` and `src/application` independent from React, Next.js, MUI, browser APIs, `fetch`, and MongoDB.

When changing schedule or rule behavior, check whether to update:

- `src/domain/types/rules.ts`
- `src/domain/defaults/defaultRules.ts`
- `src/application/usecases/rules/validateSchedule.ts`
- `src/application/usecases/schedule/generateSuggestedSchedule.ts`
- the relevant screen hook, not JSX, for UI creation/editing behavior
- focused tests or fixtures when practical

For backend work:

- Validate authenticated sessions on protected routes server-side.
- Validate admin permissions server-side on administrative routes.
- Never trust frontend-only permission checks.
- Never expose `passwordHash` in public responses.
- Create audit logs for relevant state-changing actions.
- Avoid using `localStorage` as the authoritative application state.

## UI Rules

Use MUI as the visual base and preserve dark mode behavior. Prefer native MUI components and avoid introducing a parallel design system unless the task genuinely requires it.

When adding a new screen, create or update a dedicated hook before or alongside the view. Keep views predictable, responsive, and light on logic.

## Delivery Checklist

Before finishing a code-changing task, run the validations that match the change. For normal code changes, prefer:

```bash
npm run lint
./node_modules/.bin/tsc --noEmit
npm run build
```

When the change touches database, auth, permissions, or audit, also reason through or manually validate:

- admin seed behavior, when relevant
- admin/user permission differences
- unauthorized API calls
- expected audit log creation

Update project docs or checklists when a documented pending item is completed. Do not commit unless the user explicitly asks.

Always include a suggested commit message at the end of the final response for completed tasks. Use English and the Conventional Commit format:

```text
type(scope): message
```

Choose the scope from the main area changed, such as `skill`, `auth`, `admin`, `schedule`, `rules`, `api`, `ui`, `docs`, or `build`.
