# SCADAtomic — Design System Typography patch

Base: `scadatomic-editor-design-system-colors-picker-source.zip`

Adds the second Design System token family: **Typography**.

Highlights:
- generic `DesignTokenBase` / `DesignTokenReference<TKind>` foundation,
- project Typography library with stable UUID references,
- starter typography scale,
- `Text.textStyle` local style or `typography-token` reference,
- Property Panel `Local style / Design System` selector,
- renderer-level token resolution,
- safe token deletion by detaching usages to an equivalent local style,
- legacy Text props remain compatible until the user opts into the new typography control.

Validation performed:
- TypeScript 6 project typecheck: passed,
- ESLint for all changed TypeScript/TSX files: passed,
- `git apply --check PATCH_DESIGN_SYSTEM_TYPOGRAPHY.diff`: passed.
