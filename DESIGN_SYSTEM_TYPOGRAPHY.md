# SCADAtomic Design System — Typography

Typography is the second project-local design-token family after Colors.

## Document model

The project design system now supports multiple token families:

```ts
designSystem: {
  colors: Record<ColorTokenId, ColorToken>,
  typography?: Record<TypographyTokenId, TypographyToken>
}
```

Every token uses a stable UUID. Names such as `Heading/Large` are presentation paths and can be renamed without breaking references.

A typography token contains:

```ts
{
  id,
  name,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing
}
```

A Text node references it through one `textStyle` value:

```ts
textStyle: {
  kind: "typography-token",
  tokenId: "..."
}
```

The renderer resolves that reference immediately before rendering. Text components receive an ordinary resolved typography style and do not know about token storage.

## Local vs Design System

The Text property panel exposes:

- **Local style** — font family, size, weight, line height and letter spacing stored locally.
- **Design System** — a stable reference selected from the project Typography library.

Legacy Text nodes that still contain `fontSize`, `fontWeight` and `lineHeight` continue to work. They are converted to the new `textStyle` model only when the user opts into the Typography control.

## Delete behavior

Deleting a typography token never leaves a broken reference. Every use is detached to an equivalent local `TypographyStyle`, preserving the current visual appearance.

## Generic token foundation

Shared token primitives now live in `src/uiframework/design-system/tokens.ts`:

- `DesignTokenBase`
- `DesignTokenReference<TKind>`
- generic reference traversal/counting
- shared unique-name generation

The renderer uses `design-system/resolver.ts`, which resolves both color and typography references. Future families such as spacing, radius and shadow can plug into the same boundary.
