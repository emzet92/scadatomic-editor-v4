# SCADAtomic Design System — Color Tokens patch

Base: `scadatomic-editor-modal-system-source.zip`

Adds the first project-local design token family: Colors.

Highlights:
- `UiDocument.designSystem.colors` with stable UUID-backed color tokens.
- Color props support either local literals or `{ kind: "color-token", tokenId }` references.
- Central renderer-side token resolution; components continue receiving normal CSS color strings.
- New editor area: `System -> Colors`.
- Figma-like Local / Token mode in every `kind: "color"` property inspector.
- Works in normal node props, variants and reusable-component color inputs/internals.
- Rename-safe references by ID.
- Deleting a token detaches all usages to the current literal value.
- Starter palette and usage counts.

Validation performed:
- TypeScript project typecheck: OK.
- ESLint for all changed source files: OK.
- Color token resolver/detach smoke test: OK.
- `git apply --check PATCH_DESIGN_SYSTEM_COLORS.diff`: OK.
