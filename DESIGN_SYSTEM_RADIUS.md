# SCADAtomic Design System — Radius Tokens

Radius is the fourth project-local design-token family after Colors, Typography and Spacing.

## Model

A component property may store a local numeric radius:

```ts
borderRadius: 8
```

or a stable token reference:

```ts
borderRadius: {
  kind: "radius-token",
  tokenId: "..."
}
```

Token identity is UUID-based, so renaming `Radius/MD` does not break component references.

## Starter scale

- Radius/None = 0px
- Radius/XS = 2px
- Radius/SM = 4px
- Radius/MD = 8px
- Radius/LG = 12px
- Radius/XL = 16px
- Radius/2XL = 24px
- Radius/Pill = 999px

## Supported properties

The first milestone wires Radius Tokens to existing corner-radius properties on Button, Container, Modal, Text, Image and Navigation.

The renderer resolves token references immediately before the component is rendered. Components still receive plain numeric values and do not depend on the token system.

Deleting a token safely detaches every reference to the token's final numeric value.
