# SCADAtomic — Design System Borders / Stroke Styles patch

Base: `scadatomic-editor-design-system-shadows-source.zip`

Adds a new Borders / Strokes design-token family:

- structured `BorderStyle { width, style, color }`,
- stable `border-token` references,
- Design System → Borders / Strokes workspace with live previews,
- starter stroke set,
- unified `None / Local border / Design System` property control,
- support on Button, Container, Modal, Image, Navigation and Text,
- backward-compatible rendering for legacy `borderSize` / `borderColor`,
- safe detach to local structured border when a token is deleted,
- central DesignSystem resolver support.

Validation performed in this environment:

- pure design-system TypeScript typecheck: OK,
- border resolver / count / detach / validation smoke-test: OK,
- syntax transpile check for all changed TS/TSX files: OK,
- `git diff --check`: OK,
- `git apply --check`: OK.

A full project `tsc -b` could not be completed because the source snapshot does not include `node_modules` and dependency installation timed out in the execution environment.
