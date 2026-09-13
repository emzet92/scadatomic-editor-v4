# SCADAtomic – grid children / tree delete / repeat guards

Incremental patch on top of `scadatomic-editor-grid-layout-ux-source.zip`.

## What changed

- Grid children now use the grid cell width consistently across Text, Button, Image, Chart, Container, Navigation, PageSlot and reusable ComponentInstance roots.
- Grid drag/drop placement is calculated from the real rendered DOM rows/columns, so Adaptive mode and mixed-height items no longer use stale configured-column math.
- Drop indicators follow actual multi-column geometry.
- Added Delete action to the left Component tree.
- Added Delete action to reusable Component structure tree.
- Selection falls back to the parent after delete.
- Repeat-managed containers reject manual child insertion and moves at both UI and core command/store levels.
- Duplicate into a repeat-managed container is blocked because it also creates a new child.
- Quick-add is disabled for repeat containers and the overlay shows `Loop-managed · add disabled`.
- Repeat properties explain that manual add/move/duplicate is disabled until switched back to Static.

## Validation

- `tsc -b` passes.
- ESLint passes for all modified TS/TSX files.
- `git diff --check` passes.

## Patch

Apply `PATCH_GRID_CHILDREN_TREE_LOOP_GUARDS.diff` against the previous grid-layout source snapshot.
