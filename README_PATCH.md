# SCADAtomic Modal System patch

Base: `scadatomic-editor-storybook-ui-source.zip`

Adds project-global modals as first-class document entities with a reused visual designer surface, modal lifecycle events, a script API and runtime overlay/stack.

## Script API

```js
ctx.modals.ConfirmDelete.open({ deviceId: "edge-01" });
ctx.modals.ConfirmDelete.close({ accepted: true });
```

Modal root events:
- `On open`
- `On close`

`On close` receives payloads passed by `close()`. Escape/backdrop closure emits `{ reason: "escape" }` / `{ reason: "backdrop" }`.

## Execution model

`open()` and `close()` collect typed `modal-open` / `modal-close` intents. The Executor routes them to the client modal runtime. This keeps the contract reusable for the future Python script frontend.

## Validation

- TypeScript `tsc -b`: pass
- ESLint on changed source files: pass
- `git apply --check PATCH_MODAL_SYSTEM.diff`: pass
