# Semantic Code Graph

The `Code Graph` view is now a semantic, Node-RED-like projection of JavaScript rather than a 1:1 AST dump.

Pipeline:

```text
JavaScript
  -> Acorn AST
  -> SemanticCodeGraph
  -> React Flow
```

## What is intentionally hidden

Parser-only nodes such as `Literal`, `Identifier`, `MemberExpression`, `ExpressionStatement`, `BlockStatement` and similar syntax details are not rendered as separate React Flow nodes.

## What is rendered

Examples of visible nodes:

- `Start` / `End`
- `Prepare speed`
- `IF` with a readable condition
- `Set Pump1.speed`
- `Call Pump1.start()`
- `Emit pump.updated`
- `Navigate Overview`
- `For each`
- `Return`
- `Throw error`

Branches are labeled with semantic roles such as `true`, `false`, `body`, `done`, `case ...` and `default`.

## Main implementation files

- `src/execution/ast/semantic-code-graph-builder.ts`
  - Converts the full Acorn AST into a compact semantic graph.
  - Collapses literals/member expressions/etc. into readable labels and details.
  - Builds control-flow branches for `if`, `switch`, loops, try/catch, returns and throws.

- `src/execution/visualization/semantic-code-graph-adapter.ts`
  - Converts the domain-level `SemanticCodeGraph` into React Flow nodes/edges.
  - Adds semantic edge labels and Node-RED-like compact styling.

- `src/execution/visualization/CodeGraphView.tsx`
  - Parses the current handler source with Acorn and renders the semantic graph.

- `src/execution/visualization/GraphCanvas.tsx`
  - Supports a small semantic category/eyebrow above node titles.

- `src/uiframework/gui/script-editor/ScriptPage.tsx`
  - The existing `Code Graph` tab now renders `CodeGraphView`.

## Important architecture rule

Acorn remains the parser/source of truth. React Flow is still only a visualization layer. The semantic graph is a separate intermediate model and is not used as the runtime Execution Graph.
