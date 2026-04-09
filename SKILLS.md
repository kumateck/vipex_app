---
name: Frontend Refactoring Skill
version: 1.0
description: Break large React/Next.js pages into small modular components with feature-based architecture. Use when refactoring frontend code or improving maintainability.
---

# Frontend Refactoring Skill

## When to Use

- Large React files (>150 lines)
- Pages containing dialogs, tables, logic mixed together
- Difficult-to-debug UI

---

## Steps

1. Identify large files (especially pages)
2. Extract feature into:

   `src/features/.../components/<feature-name>/`

3. Break into:
   - `components/`
   - `dialogs/`
   - `hooks/`
   - `services/`
   - `types/`
   - `utils/`
4. Move logic into hooks
5. Isolate dialogs into separate files
6. Create `index.ts` for exports
7. Reduce page file to a thin wrapper
8. Update page export:

   `export { PageName } from '../components/<feature-name>';`

---

## Constraints

- DO NOT change functionality
- DO NOT introduce regressions
- DO NOT exceed file size limits
- DO NOT mix responsibilities

---

## Output Expectations

- Modular folder structure
- Small readable files
- Clean separation of concerns
- Production-grade performance

---

## Anti-Patterns (STRICTLY FORBIDDEN)

- 500+ line files
- Multiple dialogs in one file
- Business logic inside UI components
- Direct API calls inside components
- Prop drilling across many layers

---

## Success Criteria

- Files are small and readable
- Debugging becomes easier
- Feature is fully isolated
- Page becomes declarative

---

# FINAL INSTRUCTION

Apply these rules across the entire frontend codebase.

Ensure consistency everywhere, not just one feature.
