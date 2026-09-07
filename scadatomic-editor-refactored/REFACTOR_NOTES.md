# SCADAtomic editor refactor

## Main changes

- One canonical in-memory `UiDocument` (`schemaVersion`, `rootId`, normalized `nodes`).
- Backward-compatible loader for the old `Record<NodeId, UiNode>` tree shape.
- Existing HTTP wire format is preserved (`tree: document.nodes`) so the current backend does not need to change immediately.
- Pure document command layer (`insert`, `delete`, `move`, `replace`, `setProp`, `setBinding`, `setEvent`).
- Zustand editor store now owns editor state and delegates document mutations to the command layer.
- Renderer is environment-agnostic and no longer imports the editor store.
- Runtime page has its own document state; it no longer reuses editor state.
- First-class `bindings` and `events` on UI nodes; legacy `tag`, `onClickEvent`, and `onDoubleClickEvent` are migrated on load.
- Component definitions are centralized: defaults, editor/runtime implementation, inspector schema, bindings, events, and palette metadata.
- Property panel is generated from the component inspector schema.
- Runtime signal store uses per-tag subscriptions via `useSyncExternalStore`; charts read shared signal history instead of copying a global values object.
- WebSocket send queue + reconnect; messages can be scoped with `projectId`.
- Autosaves are serialized to avoid out-of-order writes; optional backend revisions are supported through `If-Match` when available.
- Node drag starts only after a pointer movement threshold.
- Canvas geometry uses a derived parent/depth index, canvas-scoped DOM queries, and rAF-throttled scroll/resize collection.
- Drag/drop distinguishes flex vs grid/stack direction and renders horizontal/vertical insertion indicators accordingly.
- Large `EditorControls` was split into interaction geometry and overlay components.
- Script routes are project-scoped, while the old route remains for compatibility.
- Removed obsolete POC/template files and duplicate event/runtime helpers.
- TypeScript hardened with `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`.

## Validation

The refactored source passes:

```bash
node node_modules/typescript/lib/tsc.js -p tsconfig.app.json --noEmit
node node_modules/eslint/bin/eslint.js src
```

The original archive contained platform-specific `node_modules`, so Vite's native Rolldown binding could not run in the Linux review environment. The final archive intentionally excludes `node_modules`; install dependencies fresh on the target machine:

```bash
npm ci
npm run build
```
