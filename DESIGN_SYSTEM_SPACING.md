# SCADAtomic Design System — Spacing Tokens

Spacing is the third project-local design-token family after Colors and Typography.

## Model

```ts
{
  designSystem: {
    spacing: {
      "<uuid>": {
        id: "<uuid>",
        name: "Spacing/MD",
        value: 16
      }
    }
  }
}
```

A spacing-capable property stores either a literal number or a stable token reference:

```ts
padding: 16
```

or:

```ts
padding: {
  kind: "spacing-token",
  tokenId: "<uuid>"
}
```

The renderer resolves references immediately before rendering, so primitive React components continue to receive ordinary numeric pixel values.

## Initial supported properties

- Page: `padding`, `gap`
- Container: `padding`, `gap`
- Modal: `padding`, `gap`
- Navigation: `padding`, `gap`
- Button: `paddingX`, `paddingY`, `marginX`, `marginY`

`borderRadius` is deliberately not a spacing token. It will belong to a separate Radius token family.

## Editor UX

Design System → Spacing contains a project-local token library and a starter scale:

- Spacing/2XS = 2px
- Spacing/XS = 4px
- Spacing/SM = 8px
- Spacing/MD = 16px
- Spacing/LG = 24px
- Spacing/XL = 32px
- Spacing/2XL = 48px

Spacing-capable properties show a source selector. The property can remain a local numeric value or reference one token from the Design System list.

## Rename and delete semantics

References use token IDs, not names. Renaming a token is safe.

Deleting a spacing token detaches all references to the token's current numeric value. This preserves the current layout and prevents broken references.

## Rendering

The generic `resolveDesignTokenReferences()` resolver handles color, typography and spacing references. Components do not import design-system token types and remain renderer-agnostic.
