# SCADAtomic — tag simulator + proxy patch

This patch builds on the previous Tag/UDT system.

## Apply

If the latest Tag/UDT patch is already applied:

```bash
git apply PATCH_FROM_TAG_SYSTEM.diff
```

If you are starting from the original `editorv4.zip` state used in this conversation:

```bash
git apply PATCH_CUMULATIVE_FROM_ORIGINAL.diff
```

Do not apply both.

## What changed

- The existing mock runtime simulator now drives project tags in runtime preview.
- Simulator writes go only through `TagStore.set()`.
- Real simulator changes therefore emit `tag.changed` and notify subscriptions.
- A persistent mock-runtime bridge converts tag events into `runtime.signal` updates.
- Added a dynamic `tags` Proxy available in user scripts.
- Primitive tags support `tags.LineSpeed` and `tags.LineSpeed = 1200`.
- UDT tags support `tags.Pump1.speed`, assignment, and UDT methods such as `tags.Pump1.start()`.
- Existing direct UDT globals (`Pump1.start()`) remain compatible.
- `ctx.tags` exposes the same project tag namespace.
- Nested UDT fields are proxied recursively.
- Script autocomplete is generated automatically from current `ProjectData`.
- Autocomplete includes primitive tags, UDT fields, UDT methods, nested UDTs, `tags.*`, `ctx.tags.*`, and direct UDT globals.
- Added `TagStore.listPrimitivePaths()` for simulator/driver-style consumers without exposing internal mutable data.
- `tags`, `$get`, `$set`, and `$children` are reserved top-level tag names.

## Simulator behavior

The simulator remains local/mock-only and has no PLC/device dependency.

- `int` values follow a smooth changing signal around their current operating point.
- `bool` values toggle on staggered cadences.
- `string` values are intentionally left stable.
- If a script changes an integer tag, the simulator adopts the new value as its new operating point instead of immediately snapping back.
- Only the project opened under `/render/:projectId/...` is simulated in that tab.

## Script examples

```js
tags.LineSpeed

tags.LineSpeed = 1200

tags.Pump1.speed = 1450

tags.Pump1.start()

ctx.tags.Pump1.running

// Backward compatible UDT global:
Pump1.start()
```

## Validation performed

- `tsc -b` passes.
- ESLint passes for every changed/new source file.
- `git diff --check` passes.
- Runtime core test verifies primitive proxy writes, UDT proxy writes, UDT methods, no duplicate event for unchanged values, and simulator mutations through `TagStore`.
- Autocomplete data test verifies `tags.LineSpeed`, `tags.Pump1.speed`, `tags.Pump1.start()` and direct `Pump1` generation.
- Final Vite bundle cannot be executed from the supplied archive because its `node_modules` is missing the native `@rolldown/binding-linux-x64-gnu` optional dependency. TypeScript validation itself is clean.
