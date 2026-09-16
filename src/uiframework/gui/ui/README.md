# SCADAtomic editor UI system

The editor UI follows a strict dependency direction:

`tokens -> atoms -> molecules -> organisms -> templates -> feature screens`

Feature code should import from `src/uiframework/gui/ui` rather than from an internal layer. This keeps the folder structure refactorable while exposing one stable public API.

## Layers

- `tokens/` contains semantic foundations: color variables, spacing, radii, borders, typography scales, shadows and z-index values. Tokens do not render DOM.
- `atoms/` contains the smallest rendering primitives: layout (`Box`, `Stack`, `Inline`, `Grid`, `Center`), typography (`Text`, `Heading`), interaction (`Pressable`, `Button`), `Icon`, `Surface`, `Overlay`, `Divider`, badges and form controls.
- `molecules/` combines atoms into reusable controls and feedback: `Callout`, `ChoiceCard`, `ColorPickerInput`, `EmptyState`, `IconTile`, navigation tabs, section headers, segmented controls and steppers.
- `organisms/` owns larger product patterns: dialogs, data grids, panels, sidebars, entity headers, metric cards and toolbars.
- `templates/` defines screen composition and slots: `PageContainer`, `PageHeader`, `EditorPage` and `WorkspaceShell`.

## Rules

1. Feature screens do not create raw `<button>` elements. Use `Button`, `IconButton` or the low-level `Pressable` atom.
2. Lucide icons are rendered through the `Icon` atom so size, tone and accessibility stay consistent.
3. Layout-only `<div>` elements use `Box`, `Stack`, `Inline`, `Grid` or `Center`.
4. Full-cover visual layers use `Overlay`; bordered/background containers use `Surface` or an organism built on it.
5. Prefer variants and component props over repeating visual class strings in feature code.
6. New components may depend only on layers below them. Templates may compose organisms; atoms must never import molecules or organisms.
7. Storybook mirrors these layers under Foundations, Atoms, Molecules, Organisms and Templates.
