# SCADAtomic patch — component editor grid + button spacing

Base: `scadatomic-editor-grid-hardened-source.zip`

Changes:
- shared `NodePropertiesEditor` for Page + reusable component definition inspectors
- the same `ContainerLayoutEditor` (Grid/Flow, presets, adaptive/fixed) now appears inside reusable component editing
- one shared `ComponentPreviewFrame` replaces duplicated component canvas wrappers and gives grids a stable responsive width
- compact Button defaults
- Button Padding X/Y, Margin X/Y and Corner radius editor in both inspector contexts
- grid children use `width:auto + stretch` so margins do not create `100% + margin` overflow

Validation:
- TypeScript `tsc -b`: passed
- ESLint on all changed TS/TSX files: passed
