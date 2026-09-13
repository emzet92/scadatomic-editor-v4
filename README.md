# SCADAtomic — Duplicate component patch

Patch prepared against the supplied `editorv4.zip`.

## Behavior

- Adds a Duplicate icon to every duplicable node in the component tree.
- Adds a Duplicate icon to the toolbar above the currently selected node on the designer canvas.
- Both UI entry points use the same store/core duplication logic.
- The duplicate is inserted immediately after the source in the same parent's `children` array.
- Duplicating a Container recursively copies its complete subtree.
- Every copied node receives a fresh `crypto.randomUUID()` technical `id`.
- Every copied node also receives a fresh page/component-scoped `name`, so script-facing names do not collide (`Button1 -> Button3`, etc., depending on names already in the scope).
- Existing props, bindings, variants, event handler references, method script references, content behavior and component-definition references are copied.
- Page/component roots cannot be duplicated.
- After duplicating a page node, the new root copy becomes selected.
- Duplicating inside a reusable-component definition is supported by the designer overlay as well.

## Files

The ZIP contains the complete replacement versions of modified files and `PATCH.diff`.

Apply with either:

```bash
git apply PATCH.diff
```

or copy the included `src/...` files over the corresponding project files.

## Verification performed

- `git diff --check` passes.
- `src/uiframework/core/duplicate-node.ts` passes an isolated TypeScript type-check.
- Runtime smoke tests passed for:
  - nested node duplication at the same parent/index + 1,
  - recursive Container duplication,
  - fresh UUIDs for all descendants,
  - fresh script-facing names for all descendants,
  - source object immutability,
  - root duplication rejection.

The supplied project currently has unrelated pre-existing TypeScript errors in mock/tag code when running the full project type-check. The supplied `node_modules` also lacks the Linux Rolldown native binding required by Vite, so a full Vite build cannot be completed from this archive without reinstalling dependencies.
