# Component mode parity patch

This patch removes the remaining major UX/model drift between Page Designer mode and reusable Component definition mode.

## 1. Internal variants
- Private primitive nodes inside a user component now use the same `VariantsEditor` as normal Page nodes.
- `Edit variant` enters definition-scoped visual variant editing.
- `VariantPropertiesEditor` is shared between normal node variant mode and component-definition variant mode.
- Component preview applies default variants and the currently edited variant.

## 2. Selection overlay in Component mode
- Added `ComponentDefinitionControls`, reusing the same geometry/drop/selection overlay primitives as the main Designer.
- Selected private nodes show the normal bounds overlay, size labels, handles, type badge and delete action.
- Internal nodes can be dragged/reordered inside the definition.

## 3. Add components while editing a user component
- The normal Component Palette is available below Component Structure while editing a definition.
- Primitive components can be dragged into private Containers.
- Project user components can also be nested as opaque `ComponentInstance` children.
- Nested user-component public input properties are editable in the same right-side inspector.
- User components remain project-global; nesting only stores a `componentDefinitionId` reference.
- Recursive component graphs are prevented (`A -> A` and `A -> B -> A`). Invalid reusable items are hidden in the palette and insertion is guarded again in the store.

## Supporting cleanup
- `collectNodeRects` now accepts a node attribute, allowing the same geometry engine to work for Page nodes and private definition nodes.
- Drag previews now have a fallback card for reusable ComponentInstance items.
