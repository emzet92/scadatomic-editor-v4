# Designer Surface refactor

The visual editor now has a single interaction engine.

## Architecture

- `DesignerSurface` owns pointer events, drag/drop, hit testing, selection overlays,
  drop indicators and geometry refresh.
- `DesignerAdapter` is the persistence boundary used by the surface.
- `PageDesignerSurface` adapts the engine to the active Page tree.
- `ComponentDesignerSurface` adapts the same engine to a reusable component
  definition tree.

The old `EditorControls.tsx` and `ComponentDefinitionControls.tsx` no longer
contain separate interaction implementations; they are compatibility shims only.

Adding future designer behavior (resize, snapping, keyboard movement, marquee
selection, guides, etc.) should happen in `DesignerSurface` once and be shared by
both Page and reusable-component editing.
