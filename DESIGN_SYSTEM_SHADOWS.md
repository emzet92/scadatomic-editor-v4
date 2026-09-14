# Design System — Shadows / Elevation

SCADAtomic now supports project-local shadow/elevation design tokens.

## Token model

A shadow token stores structured renderer-independent data:

```ts
{
  id: "...",
  name: "Elevation/2",
  x: 0,
  y: 4,
  blur: 10,
  spread: -2,
  color: "rgba(15, 23, 42, 0.12)"
}
```

Components reference the token by stable ID:

```ts
{
  kind: "shadow-token",
  tokenId: "..."
}
```

The design-system resolver converts the structured token to the final renderer value immediately before rendering. Components therefore receive an ordinary CSS `box-shadow` string and do not know about design tokens.

## Editor

`System → Shadows / Elevation` provides:

- token creation / rename / delete,
- X and Y offsets,
- blur and spread,
- color picker + CSS color value,
- live elevation preview,
- usage count,
- starter `Elevation/None` through `Elevation/4` scale.

Shadow-capable properties offer:

- `None`,
- `Local shadow`,
- any project shadow/elevation token.

Local shadows keep the same structured `{x,y,blur,spread,color}` shape.

## Supported components

The first milestone exposes shadow/elevation on:

- Button,
- Container,
- Modal,
- Image,
- Navigation,
- Text.

Button and Container use the same `ShadowValueControl` even though they have specialized property editors.

## Safe token deletion

Deleting a shadow token does not leave broken references. Every reference is detached to a local structured shadow using the token's current values, preserving the rendered appearance.

## Modal behavior

The previous hard-coded runtime `shadow-2xl` wrapper was removed. New modals receive an equivalent local structured default shadow, so their elevation can now be fully controlled by the Design System, including `None`.
