# Create component click regression fix

Fixes a regression introduced by Designer Surface Architecture.

`DesignerSurface` used a document-level capture-phase click listener and treated every click outside a rendered node as canvas deselection. Clicking controls in the right inspector (including `Create component`) therefore cleared the current selection before React handled the button click.

The selection event handling is now scoped to the adapter's canvas:

- clicks outside the active designer canvas are ignored,
- `[data-editor-ignore]` regions are ignored,
- clicking an empty area inside the canvas still clears selection,
- clicking a node inside the canvas still selects/multiselects it.

Only `src/uiframework/designer/DesignerSurface.tsx` changes.
