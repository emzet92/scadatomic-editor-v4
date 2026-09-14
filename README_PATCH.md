# SCADAtomic — Design System Radius Tokens patch

Base: `scadatomic-editor-design-system-spacing-source.zip`

Adds the fourth Design System token family: Radius.

Highlights:
- stable UUID-backed `radius-token` references,
- starter scale: None / XS / SM / MD / LG / XL / 2XL / Pill,
- Design System → Radius library workspace,
- shared Local value / Design System selector in property controls,
- radius token resolution before component render,
- safe detach to the current numeric value on token deletion,
- support for Button, Container, Modal, Text, Image and Navigation,
- Container border radius is now a real editable property instead of a hardcoded 8px,
- Radius/Pill keeps the full 999px value instead of being clamped to the old 64px editor limit.

Validation performed:
- TypeScript 6.0.3 project typecheck: pass
- ESLint on changed TypeScript/TSX files: pass
- radius resolver / validation / usage count / detach smoke test: pass
- `git apply --check PATCH_DESIGN_SYSTEM_RADIUS.diff`: pass
