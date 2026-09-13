# Grid Layout UX refactor

## What changed

The Container layout editor now exposes a dedicated Material-3-inspired layout surface instead of relying only on raw property inputs.

### Designer overlay

When a Grid Container is selected, the designer shows:

- the resolved grid tracks and cell guides,
- a compact layout badge,
- `- / +` column controls for fixed grids,
- a contextual `+` in the next safe slot,
- a quick-add menu for Text, Button, Container, Chart and Image.

The quick-add action uses the existing DesignerAdapter/insertNode path, so IDs, selection and tree ordering keep using the normal editor store logic.

### Property panel

`ContainerLayoutEditor` adds:

- Grid / Flow segmented mode,
- Stack, Split, Cards, Dense and Adaptive presets,
- fixed column count controls,
- adaptive minimum column width controls,
- minimum row height,
- spacing presets plus explicit gap/padding values.

### Layout stability

Container Grid now supports:

- `gridMode: "fixed" | "adaptive"`,
- `minColumnWidth`,
- `minRowHeight`,
- fixed tracks using `minmax(0, 1fr)`,
- adaptive tracks using `auto-fit`,
- direct-child `min-width: 0; max-width: 100%` clamping.

This prevents a child with its own preferred width from expanding a grid track and breaking the surrounding layout.

## Main files

- `src/uiframework/gui/property-panel/ContainerLayoutEditor.tsx`
- `src/uiframework/editor/overlay/ContainerGridOverlay.tsx`
- `src/uiframework/components/Container.tsx`
- `src/uiframework/designer/DesignerSurface.tsx`
- `src/uiframework/designer/designer-adapter.ts`
- `src/uiframework/component-props.ts`
- `src/index.css`

## Validation

- TypeScript: passed (`tsc -b`)
- ESLint on all touched TypeScript/TSX files: passed
