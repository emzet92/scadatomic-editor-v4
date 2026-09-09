# SCADAtomic Page + multi-select + component library patch

- Adds `Page` as the project root abstraction with Desktop / Tablet / Mobile viewport presets.
- Bumps `UiDocument` to schema version 3; mock projects use a fresh v4 localStorage namespace (no legacy migration).
- Adds multi-selection in the tree and canvas with Ctrl/Cmd-click or Shift-click.
- Adds `Create component` for multi-selection. Selected siblings are encapsulated under a private `ComponentRoot` Container.
- A single selected Container is converted directly into a reusable component definition without an extra wrapper.
- Adds a distinct tree icon for `ComponentInstance` and `Page`.
- Adds a project-scoped `ProjectComponentRepository` abstraction backed by `UiDocument.components`.
- Renames the reusable section in the palette to `Component library` and keeps an empty-state hint when no components exist.

Current prototype constraint: multi-selected nodes must share the same parent so layout semantics are not silently flattened.
