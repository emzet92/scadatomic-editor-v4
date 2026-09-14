# SCADAtomic modularization refactor

This refactor is intentionally behavior-preserving. It reorganizes editing/runtime code so upcoming reactive bindings and new components can be added without duplicating Page vs ComponentDefinition logic.

## 1. Unified node-tree editing

New module:

- `src/uiframework/editing/node-tree-editor.ts`

It owns shared structural operations:

- insert
- delete
- duplicate
- move
- move-by
- update
- validation of child acceptance
- repeat/loop manual-child guard
- reusable-component cycle guard
- unique node name creation

`editor-store.ts` keeps its existing public API so callers do not need migration, but both Page and reusable-component definition actions delegate to the same tree editor.

## 2. Shared tree renderer

New:

- `src/uiframework/gui/tree-view/NodeTree.tsx`

Both:

- normal page `TreeView`
- reusable-component `ComponentStructureTree`

now use the same recursive renderer. Their differences are capabilities/callbacks, not duplicated tree rendering code.

## 3. Property control registry

`PropInput.tsx` is now a thin dispatcher instead of a ~440-line chain of `control.kind` branches.

New:

- `src/uiframework/gui/property-panel/property-control-registry.tsx`

The registry maps inspector kinds to dedicated renderers. Adding new controls such as slider/tag binding/table-specific configuration no longer requires growing `PropInput`.

## 4. Script runtime split

`src/mock/mock-script-runtime.ts` now contains only handler orchestration:

`script -> collect intents -> planner -> graph -> executor`

The previous responsibilities were split into:

- `script-runtime/types.ts`
- `script-runtime/context-factory.ts`
- `script-runtime/component-api.ts`
- `script-runtime/navigation-api.ts`
- `script-runtime/tag-api.ts`
- `script-runtime/javascript-executor.ts`
- `script-runtime/runtime-effects-adapter.ts`
- `script-runtime/object-utils.ts`

The execution semantics are unchanged: JavaScript is evaluated to make decisions and collect intents; actual side effects still flow through `Executor -> RuntimeEffects`.

## 5. Component definition registry split

The central registry remains the lookup point, but definitions now live next to a per-component module:

- `registry/components/button.ts`
- `registry/components/chart.ts`
- `registry/components/container.ts`
- `registry/components/image.ts`
- `registry/components/navigation.ts`
- `registry/components/page.ts`
- `registry/components/page-slot.ts`
- `registry/components/text.ts`

Shared types moved to `registry/component-definition-types.ts`.

This makes future `TextInput`, `NumberInput`, `Switch`, `Table`, etc. additive instead of editing a growing monolith.

## Compatibility

No project document migration is required.

Existing public store methods are preserved, including:

- `insertNode`
- `deleteNode`
- `duplicateNode`
- `moveNode`
- `insertComponentDefinitionNode`
- `deleteComponentDefinitionNode`
- `duplicateComponentDefinitionNode`
- `moveComponentDefinitionNode`

Existing script API is also preserved.

## Validation

- Full TypeScript project typecheck: PASS (`tsc -b`)
- ESLint for every changed/new module: PASS
- Full-project ESLint still reports the pre-existing `react-refresh/only-export-components` issue in `src/uiframework/navigation/navigation-context.tsx`; this refactor does not touch that file.
- Vite bundling cannot run in the Linux validation environment because the uploaded `node_modules` contains no Linux Rolldown native binding (`@rolldown/binding-linux-x64-gnu`).
