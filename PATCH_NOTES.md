# SCADAtomic — component scripts polish

This patch contains three UX/runtime fixes:

1. **Reusable component internal handlers in Script Editor**
   - enabled internal events (e.g. Button `onClick`) are shown under the reusable component definition,
   - disabled events are not listed because only actual `node.events` entries are rendered,
   - the currently opened handler is highlighted,
   - Script Editor recognizes the handler as owned by the reusable component definition,
   - internal component handlers receive `self` at runtime.

2. **Reusable component variant autocomplete/runtime**
   - variants defined on the reusable component definition root are exposed through generated APIs,
   - `ctx.ui.MyComponent1.variant.running()` now appears in autocomplete,
   - `self.variant.running()` is available in component methods/internal handlers,
   - runtime variant switching is scoped to `instanceId::definitionRootId`, so one instance does not mutate the shared component definition.

3. **Open a user component directly from Component Library**
   - clicking a reusable component card opens its definition directly,
   - dragging remains available through the grip handle on the right side of the card,
   - the same behavior works while editing another reusable component (subject to existing cycle filtering).

## Validation

All 10 changed TypeScript/TSX files passed a TypeScript `transpileModule` syntax check.
A full `npm run build` cannot complete in this sandbox because the local install is missing `vite/client` and `node` type definitions.
