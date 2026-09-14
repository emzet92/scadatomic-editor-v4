# SCADAtomic Modal System

## Model

Modals are project-global document entities, separate from Pages and reusable Components:

```text
UiDocument
├── pages
├── modals
├── nodes
└── components
```

A modal owns a root `Modal` node and a normal UI subtree stored in the global node table. This keeps node IDs stable and lets the existing DesignerSurface, tree editor, property panel, bindings and component palette edit modal content without a second editor implementation.

## Designer

Use **Pages → Modals → +** to create a modal. Selecting it switches the normal designer to a centered modal preview over a dimmed backdrop. The same component palette, component tree, variants, bindings and event editor are reused.

Modal root properties:

- width
- minimum height
- background
- padding / gap / columns / display
- corner radius
- close on backdrop
- close on Escape

Modal root events:

- `open` / **On open**
- `close` / **On close**

## Script API

Every project modal is generated under `ctx.modals`:

```js
ctx.modals.ConfirmDelete.open({ deviceId: "edge-01" });
ctx.modals.ConfirmDelete.close({ accepted: true });
```

Autocomplete exposes the actual modal names from the project.

`open()` and `close()` do not manipulate the DOM directly. They collect typed execution intents:

```text
modal-open
modal-close
```

The Executor routes those effects to the client modal runtime. This contract is language-independent and can be generated from the future Python proxy API without changing the execution model.

## Lifecycle payload

`On open` receives the object passed to `open()` as `ctx.payload`.

```js
ctx.log(ctx.payload.deviceId);
```

`On close` receives the result passed to `close()`:

```js
ctx.modals.ConfirmDelete.close({ accepted: true });
```

Backdrop and Escape closures also go through the same close transition:

```js
ctx.payload.reason === "backdrop"
ctx.payload.reason === "escape"
```

This means cleanup, custom events, state updates and other handler logic belong in the normal modal `On close` handler.

## Runtime

```text
handler
  ↓
ctx.modals.X.open()
  ↓
ModalOpenIntent
  ↓
Execution Planner
  ↓
Execution Graph
  ↓
Executor
  ↓
UI client modal runtime
  ↓
overlay + modal tree
  ↓
On open handler
```

Closing follows the same path and emits the `On close` lifecycle handler.

The runtime maintains a modal stack. Multiple modals may be open; the latest entry is the top modal and receives Escape/backdrop dismissal.
