# SCADAtomic editor refactor

## Current architecture

- One canonical `UiDocument` v1 (`schemaVersion`, `rootId`, normalized `nodes`).
- `UiDocument` v1 is the only accepted document shape; invalid input is rejected by `parseUiDocument()`.
- Pure document command layer (`insert`, `delete`, `move`, `replace`, `setProp`, `setBinding`, `setEvent`).
- Zustand owns editor state and delegates document mutations to the command layer.
- Renderer is environment-agnostic and does not import editor state.
- Editor and runtime use the same tree renderer with separate component registries.
- Runtime owns its own document state.
- `bindings` and `events` are first-class fields on UI nodes.
- Component definitions centralize defaults, editor/runtime implementation, inspector schema, bindings, events, and palette metadata.
- Property panel is generated from the component inspector schema.
- Text formatting uses independent B / I / U controls.
- Runtime signals use per-tag subscriptions via `useSyncExternalStore`.
- Node drag starts only after a pointer movement threshold.
- Canvas geometry uses a derived parent/depth index and rAF-throttled measurement.
- Drag/drop handles stack/flex and grid insertion direction separately.
- Editor interaction overlays are split out of the renderer.
- Script routes are project-scoped: `/project/:projectId/scripts/:scriptId`.
- TypeScript uses `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`.

## Backendless development

- Mock project API persists canonical `UiDocument` v1 projects in `localStorage`.
- Mock runtime transport uses `EventTarget` + `BroadcastChannel`; it opens no network WebSocket.
- Random process signals drive tank level and pump flow.
- Runtime `start` / `stop` handlers influence the mocked pump state.
- The demo `RANDOM COLOR` handler returns a `node.update` with a random button color.
- `/project/demo` and `/render/demo` work without a backend.
- The transport-facing API remains isolated so production HTTP/WebSocket adapters can be added later.

## Validation

TypeScript and ESLint pass on the source tree. The provided dependency archive does not contain the Linux native Rolldown binding required by Vite, so the final ZIP intentionally excludes `node_modules`. Install dependencies on the target machine before building:

```bash
npm ci
npm run build
```

## JavaScript prototype handlers

- Python/Brython experimentation was removed from the current prototype path.
- Runtime scripts are persisted separately in localStorage.
- Each UI event references a `handlerId`; the mock runtime resolves and executes
  that JavaScript body with a small SCADAtomic `ctx` API.
- Script UI updates flow back through `node.update`, so handlers exercise the
  same runtime rendering path as external updates.
- Execution uses `new Function()` intentionally and is prototype-only.
