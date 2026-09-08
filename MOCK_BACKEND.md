# Browser-only prototype runtime

This build intentionally has no real backend.

## Project storage

Projects are persisted in `localStorage` through the mock project repository.
The editor talks to the repository API, not directly to browser storage, so a
future HTTP adapter can replace it without changing the UI.

## JavaScript handler storage

Runtime handlers are stored separately from `UiDocument` in `localStorage`.
A node only keeps a handler reference, for example:

```json
{
  "events": {
    "click": {
      "handlerId": "randomColorButton.RandomColorClicked"
    }
  }
}
```

The script editor is available at:

`/project/:projectId/scripts/:scriptId`

Each handler is one JavaScript script body. Example:

```js
const color = ctx.random.color();
ctx.ui.setColor(ctx.sourceNodeId, color);
ctx.emit("ui.color.changed", { color });
```

## Prototype ctx API

Scripts receive one `ctx` object:

```js
ctx.projectId
ctx.handlerId
ctx.sourceNodeId
ctx.eventName
ctx.payload

ctx.ui.setProp(nodeId, property, value)
ctx.ui.setColor(nodeId, color)

ctx.emit(eventName, payload?)

ctx.random.color()
ctx.random.number(min, max)
ctx.log(...args)
```

`ctx.ui.*` produces the same `node.update` message consumed by the runtime
provider. `ctx.emit()` produces a runtime custom event. The current simulation
uses `pump.start` and `pump.stop` events to control the mock process.

## Runtime signals

The mock runtime emits random process values in-browser and mirrors runtime
messages between tabs using `BroadcastChannel` when available.

## Security

The script runtime deliberately uses `new Function()` and is **not sandboxed**.
It is suitable only for this trusted local prototype. Do not use this mechanism
for untrusted production scripts.
