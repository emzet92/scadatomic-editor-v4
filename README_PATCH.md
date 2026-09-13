# Friendly Code Graph patch

Incremental patch for `scadatomic-editor-semantic-code-graph-source.zip`.

## What changed

The Code Graph no longer exposes JavaScript-looking details to the user.

- generic `Call X()` labels were replaced with user-facing actions such as `Start Pump1`, `Reset Pump1`, `Process item`
- assignments are shown as `Update ...` without the right-hand JavaScript expression
- decisions are shown as `Check ...` with `Yes / No` branches
- loops are shown as `Repeat ...`
- events, navigation, session state and logs use product-facing wording
- variable declarations are collapsed to `Prepare data`
- raw source snippets are no longer used as node details
- parser/Acorn wording was removed from the user-facing graph panel
- semantic nodes have small visual glyphs and friendlier categories
- parse errors no longer expose parser error text inside this visualization

The AST parser is still used internally. This only changes the semantic projection and visualization; runtime execution is untouched.

## Files

- `src/execution/ast/semantic-code-graph-builder.ts`
- `src/execution/visualization/semantic-code-graph-adapter.ts`
- `src/execution/visualization/CodeGraphView.tsx`
- `src/execution/visualization/GraphCanvas.tsx`

## Validation

Validated with the project TypeScript compiler and ESLint on all changed files. A semantic graph smoke test confirmed that a handler containing variable preparation, an if branch, property update, method action, emitted event, logging and navigation is rendered without source-code fragments.
