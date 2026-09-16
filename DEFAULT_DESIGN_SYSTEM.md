# SCADAtomic Default Design System

## Storage

The design system is project-local and lives inside `UiDocument.designSystem`.
The current development projects API persists the entire `UiDocument` as the
`tree` field of a mock project. The mock adapter stores that snapshot in
`localStorage` under `scadatomic.mock.v5.project.<projectId>` and falls back to
memory when browser storage is unavailable. A future HTTP backend can persist
the same `tree` contract without changing token ownership in the designer.

## Default preset

Every new document receives the built-in `scadatomic-default` preset. Legacy
projects without the preset are upgraded once by merging missing built-in
assets by stable ids while preserving user-created tokens.

The preset contains:

- Light and Dark themes.
- Foundation color palette (Neutral, Brand, Green, Amber, Red).
- Semantic colors such as `Surface/Default`, `Text/Primary`,
  `Action/Primary`, `Border/Default`, and status colors.
- Typography scale from `Display/Large` through `Caption/Small`.
- Spacing, radius, elevation, and border/stroke scales.

Semantic color tokens map each theme to a foundation color token. Component
properties store semantic references, so changing the active theme resolves a
different final color without rewriting component nodes.

## Default component references

New Page, Modal, Container, Text, Button, Image, Navigation, and Chart nodes
are created with design-token references rather than copied style literals.
Examples:

- Page background -> `Surface/Default`
- Text color -> `Text/Primary`
- Text typography -> `Body/Medium`
- Button background -> `Action/Primary`
- Button radius -> `Radius/MD`
- Container border -> `Stroke/Subtle`
- Modal shadow -> `Elevation/4`

Literal component defaults remain in renderer components as standalone
fallbacks. Project node defaults are the tokenized layer.

## Theme editor

`Design System -> Themes & Semantic` switches the active project theme and
edits the semantic-to-foundation color mapping for that theme. Color property
pickers show Semantic tokens before Foundation colors.
