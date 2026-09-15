# Design System — Borders / Stroke Styles

SCADAtomic stores borders as structured design-system values instead of raw CSS strings.

## Token model

```ts
type BorderStyle = {
  width: number;
  style: "solid" | "dashed" | "dotted" | "double";
  color: string;
};

type BorderTokenRef = {
  kind: "border-token";
  tokenId: string;
};
```

A component property can keep a local `BorderStyle` or a stable `BorderTokenRef`. The renderer resolves either representation immediately before component rendering and hands the React component the final CSS border string.

## Design System workspace

`Design System → Borders / Strokes` supports:

- create / rename / edit / delete token,
- width, line style and color editing,
- live border preview,
- usage count,
- starter styles (`Stroke/Subtle`, `Stroke/Default`, `Stroke/Strong`, `Stroke/Focus`, `Stroke/Dashed`).

## Property editor

Border-enabled components expose one unified control:

- `None`,
- `Local border / stroke`,
- any project border token.

Local mode edits `width + style + color`. The old split `borderSize` / `borderColor` representation remains render-compatible, but opting into the new control writes the unified `border` property.

## Safe deletion

Deleting a token does not create a broken reference. Every `border-token` reference is replaced with a local copy of the token's current structured value, preserving the rendered appearance.

## Rendering

```text
{ kind: "border-token", tokenId }
              ↓
       DesignSystemResolver
              ↓
      1px solid #d4d4d8
              ↓
    Button / Container / Modal / ...
```

`width: 0` resolves to `none`, which also allows the new system to explicitly override legacy component borders.
