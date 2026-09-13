# SCADAtomic Execution Graph – implementation notes

This implementation inserts a transactional execution layer between the existing JavaScript script runtime and existing runtime side-effect APIs.

## Runtime pipeline

`event -> script -> IntentCollector -> Intent[] -> ExecutionPlanner -> ExecutionGraph -> Executor -> existing runtime effects`

The public script DSL remains compatible. Assignments such as `tags.Pump1.speed = 1200` and `ctx.ui.Button1.disabled = true` no longer mutate runtime state while the script is running. They produce intents. The batch is planned and committed only after the script completes successfully.

Implemented intents include tag value writes, component property writes, component variants, custom event emission, navigation, session-state set/delete/clear and method-call trace nodes. Script-defined component/UDT methods are expanded synchronously into the same collector to preserve existing JavaScript return-value semantics; their `call-method` node is marked as expanded so the executor does not invoke the method twice.

## Read-after-write

The collector contains a shadow overlay. Reads in the same handler see pending tag/UI/session writes before the executor commits them.

## Planning and execution

The v1 planner builds a safe linear graph preserving JavaScript side-effect order. The graph model is independent from React Flow and can later grow dependency analysis, parallel branches and barriers without changing the scripting DSL.

Tag references carry both stable owning tag IDs and readable paths. Tag existence/type validation happens before executor commit. Existing runtime APIs remain the execution ports.

## Error boundary

Script failure discards all pending intents. Planning failure performs no runtime effects. Executor failure marks dependent nodes skipped and records a structured execution result.

## Debug trace

The latest handler execution is persisted as a debug trace and broadcast across tabs. The Script Editor can display the latest runtime graph for the selected handler.

## Script editor graph views

The Script Editor now exposes:

- `Code` – existing JavaScript editor
- `Code Graph` – Acorn AST converted to an internal AstGraph and rendered with React Flow
- `Execution Graph` – the latest real handler execution trace rendered with React Flow

React Flow is only an adapter/rendering layer; neither AST nor execution domain models depend on it.

## Acorn

`acorn` is now a direct application dependency. The parser supports current ECMAScript syntax used by the prototype and top-level `return`, matching `new Function` handler/method bodies.

## Validation performed

- TypeScript project type-check: PASS
- ESLint on new execution module and touched runtime/UI files: PASS
- Runtime core smoke validation (collector, shadow, planner ordering, executor success/failure/skip): PASS
- Acorn -> AST Graph validation with VariableDeclaration, BinaryExpression, MemberExpression and AssignmentExpression: PASS
- Vite production bundle: blocked by the source ZIP's existing macOS-only Rolldown native optional dependency (`@rolldown/binding-darwin-arm64`); Linux binding is not present in the provided node_modules archive.

## Small pre-existing build fixes included

Two existing TypeScript breakages in the supplied archive were corrected so `tsc -b` can validate the implementation:

- old `designerTagStore` import changed to `getDesignerTagStore()`
- mock simulation driver context now supplies the required `publish()` port

## Execution Plan visualization

A dedicated **Execution Plan** tab was added next to **Execution Graph** in the Script Editor.

The distinction is intentional:

- **Execution Plan** is captured immediately after `ExecutionPlanner.plan(...)` and before `Executor.execute(...)` starts. It is immutable and every intent node is shown as `planned`.
- **Execution Graph** remains the runtime trace and displays actual executor statuses such as `success`, `failed`, and `skipped`.

Files:

- `src/execution/runtime/handler-execution-plan.ts` — immutable plan snapshot type.
- `src/execution/debug/execution-plan.ts` — latest-plan storage + subscriptions.
- `src/execution/visualization/execution-plan-adapter.ts` — domain plan to React Flow adapter.
- `src/execution/visualization/ExecutionPlanView.tsx` — Plan UI.
- `src/mock/mock-script-runtime.ts` — publishes the plan before the executor starts.
- `src/uiframework/gui/script-editor/ScriptPage.tsx` — adds the `Execution Plan` tab.

## Semantic Code Graph update

`Code Graph` no longer renders the Acorn AST one parser node at a time. Acorn remains the parser/source of truth, but a semantic projection is built before React Flow:

```text
JavaScript -> Acorn AST -> SemanticCodeGraph -> React Flow
```

Implemented in:

- `src/execution/ast/semantic-code-graph-builder.ts`
- `src/execution/visualization/semantic-code-graph-adapter.ts`
- `src/execution/visualization/AstGraphView.tsx`

The graph intentionally collapses `Literal`, `Identifier`, `MemberExpression`, `ExpressionStatement` and similar syntax-only AST nodes into higher-level nodes such as `IF`, `Set Pump1.speed`, `Call Pump1.start()`, `Emit event`, `Navigate`, `Loop`, `Return` and `Throw error`. Branch edges are labeled with semantic roles such as `true`, `false`, `body`, `done`, `case ...` and `default`.
