# Public input mapping patch

This patch fixes exposing a parent reusable-component public input mapped to a nested reusable/user component public input.

## What changed

- `createComponentInput(...)` now resolves nested `ComponentInstance` definitions through the project document.
- Parent public inputs can target the explicitly public inputs of nested reusable components.
- The parent input inherits the nested input's real type and resolved default value.
- Nested `tag` inputs are forwarded through the child instance `props`; the child definition then maps the tag to its own primitive binding target.
- The Public Inputs editor now preselects the actual target type for nested reusable-component inputs instead of guessing only from the property name.

## Apply

Either copy the included `src/` tree over the project root or run:

```bash
git apply PATCH.diff
```

## Validation

- ESLint: changed files pass.
- `git diff --check`: passes.
- Strict TypeScript check of `src/uiframework/reusable-components.ts` and its dependency graph: passes.
- Full-project TypeScript/ESLint still reports pre-existing errors in unrelated files from the supplied archive; those were intentionally not modified by this patch.
