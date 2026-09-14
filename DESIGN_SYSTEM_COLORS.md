# SCADAtomic Design System — Color Tokens

This iteration introduces the first project-local design-token family: **Colors**.

## Document model

`UiDocument.designSystem.colors` stores stable color definitions:

```ts
{
  id: "...",
  name: "Brand/Primary",
  value: "#7c3aed"
}
```

A color-capable component property can keep either a literal CSS color or a stable token reference:

```ts
"#7c3aed"
```

or:

```ts
{ kind: "color-token", tokenId: "..." }
```

Names are presentation metadata; references use token IDs, therefore renaming `Brand/Primary` does not break component references.

## Rendering

Components remain unaware of design tokens. `RenderNode` resolves token references immediately before passing props to the editor/runtime component. This keeps the document renderer-independent and avoids coupling Button/Text/Modal implementations to the token system.

Resolution also works for reusable-component internals, variants and nested prop structures.

## Designer

The editor now has three project areas:

- Design
- Data
- System

`System -> Colors` contains the project color library. Users can create colors, rename them, edit values, see usage counts and seed a starter palette.

Every inspector control with `kind: "color"` supports:

- **Local** — a literal CSS color;
- **Token** — a reference to a project color token.

This applies to normal nodes, variant props and exposed reusable-component color inputs.

## Deleting colors

Deleting a token does not leave broken references. All usages are detached to the token's current literal value before the token is removed, preserving the visual appearance of the project.

## Future token families

The `DesignSystem` root intentionally leaves room for additional token families such as typography, spacing, radii, shadows and motion. They should follow the same stable-ID reference pattern rather than storing raw CSS expressions as the project-domain model.
