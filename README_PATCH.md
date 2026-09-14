# SCADAtomic Design System — Spacing Tokens patch

Base: `scadatomic-editor-design-system-typography-source.zip`

## Adds

- Design System → Spacing workspace
- stable `SpacingToken` IDs and `{ kind: "spacing-token", tokenId }` references
- starter scale: 2 / 4 / 8 / 16 / 24 / 32 / 48 px
- generic design-token resolver support
- safe detach to the current numeric px value when a token is deleted
- reusable spacing property control with Local / Design System selection
- Page: `padding`, `gap`
- Container: `padding`, `gap`
- Modal: `padding`, `gap`
- Navigation: `padding`, `gap`
- Button: `paddingX`, `paddingY`, `marginX`, `marginY`

`borderRadius` is intentionally excluded; it belongs to the future Radius token family.

## Apply

```bash
git apply PATCH_DESIGN_SYSTEM_SPACING.diff
```

## Validation

- TypeScript 6 project typecheck: PASS
- ESLint changed files: PASS
- spacing resolve/count/detach smoke test: PASS
- generic DesignSystem resolver smoke test: PASS
- `git apply --check`: PASS
