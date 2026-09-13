# SCADAtomic — Execution Plan visualization patch

This patch is incremental on top of `scadatomic-editor-execution-graph-source.zip`.

## What changed

The Script Editor now exposes four handler views:

- Code
- Code Graph
- Execution Plan
- Execution Graph

`Execution Plan` is an immutable snapshot created immediately after `ExecutionPlanner.plan(...)` and before `Executor.execute(...)` starts. It shows the exact operations the planner scheduled, all marked as `planned`.

`Execution Graph` remains the execution trace and shows actual runtime statuses such as `success`, `failed`, and `skipped`.

## Integration points

- `src/mock/mock-script-runtime.ts` — calls `publishExecutionPlan(execution)` after planning and before execution.
- `src/uiframework/gui/script-editor/ScriptPage.tsx` — adds the `Execution Plan` tab.
- `src/execution/debug/execution-plan.ts` — persists/subscribes to latest plan per handler.
- `src/execution/runtime/handler-execution-plan.ts` — plan snapshot model.
- `src/execution/visualization/ExecutionPlanView.tsx` — plan UI.
- `src/execution/visualization/execution-plan-adapter.ts` — plan → React Flow adapter.

## Validation

- `tsc -b --pretty false` — PASS
- ESLint on `src/execution`, `src/mock/mock-script-runtime.ts`, and `ScriptPage.tsx` — PASS
