# Encapsulated Component Script Scope

This patch introduces an explicit script scope for reusable UI components.

## Component-owned scripts

Component definition methods and internal handlers receive three separate APIs:

```js
self       // current reusable-component instance
internal   // private tree owned by this component definition
ctx.ui     // public API of components on the current runtime page
```

Example:

```js
internal.StartButton.disabled = true;
internal.StatusText.label = "STARTING";
self.syncPermissions();
ctx.ui.Header1.setProp("label", "Pump starting");
```

`self` exposes public inputs, public variants and all methods of the current
definition, including private methods. `internal` exposes normal APIs of private
primitive nodes. Nested reusable components are represented only by their public
facade, so the parent cannot access the child's private nodes or private methods.

## External scripts

Page scripts continue to receive only `ctx.ui`. Reusable component instances
expose their public inputs, public methods and variants. `internal` is not injected
into non-component scripts.

The raw `ctx.ui.setProp(nodeId, ...)` / `ctx.ui.setColor(nodeId, ...)` escape hatch
was removed so code cannot bypass a reusable component facade by guessing a node id.

## Nested runtime scopes

Runtime node ids are now cumulative:

```text
OuterInstance::NestedInstance::InternalButton
```

This avoids collisions between multiple instances of nested reusable components.
Scoped runtime property writes are resolved before rendering, so calls such as
`internal.Button1.disabled = true` and writes to public inputs of nested components
are visible immediately without mutating the reusable definition.

## Script editor

Autocomplete now has three roots for component-owned scripts:

- `self.*`
- `internal.*`
- `ctx.ui.*`

New component methods default to `private`; visibility still controls the external
facade.

## Validation

Changed TS/TSX files pass TypeScript syntax/transpile diagnostics. A full project
build cannot be run in this container because the provided `node_modules` directory
contains no installed frontend dependencies (`vite/client`, React types, etc.).
