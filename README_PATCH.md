# Grid hug sizing + rounded property inputs

Incremental patch on top of `scadatomic-editor-component-grid-button-spacing-source.zip`.

## Grid vertical behavior

Grid containers now default to:

- `gridRowMode: "content"` — rows hug their content instead of reserving/filling vertical space.
- `gridItemAlignment: "start"` — children keep their natural height at the top of the row instead of stretching downward.

The Layout property editor exposes:

- Row sizing: `Hug content` / `Minimum row`
- Item alignment: `Top` / `Center` / `Bottom` / `Fill`
- `Minimum row` height only when that row mode is enabled

The designer grid overlay uses the same row mode and derives row heights from the actual rendered child heights, so the overlay no longer paints fake full-height rows down the container.

## Property panel inputs

The existing generic `TextInput` from `src/uiframework/gui/ui/FormControls.tsx` remains the single text/number input primitive and now uses the same 12px rounding language as the grid settings.

Reused by:

- ordinary string/number props
- component name
- button spacing values
- grid gap/padding compact values
- chart series text inputs

Selects and compound property controls were visually aligned to the same radius.

## Validation

- TypeScript `tsc -b`: pass
- ESLint on all touched TS/TSX files: pass
