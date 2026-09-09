# Shared component properties inspector

This patch removes the duplicated/limited property editor used inside reusable component definition mode.

## What changed

- Adds `ComponentProperties`, a shared inspector surface driven by the component registry.
- Normal Page/primitive nodes and private nodes inside reusable component definitions now use the same property renderer.
- The shared surface renders:
  - serializable visual properties (`inspector`)
  - tag bindings (`bindings`)
  - runtime events (`events`)
- Reusable component instances also reuse the same property surface for their public inputs.
- Internal definition-node bindings/events are persisted directly into `UiComponentDefinition.nodes`.
- Internal event handler ids are scoped with the component definition id to avoid collisions with normal page handlers.
- Event rows now show the familiar React-style alias (`onClick`, `onDoubleClick`) next to the SCADAtomic event label.

## Button behavior

A normal Button and a Button selected while editing a reusable component definition now expose the same registered API:

- label
- disabled
- backgroundColor
- Click / onClick
- Double click / onDoubleClick

`onClick` is intentionally an event in the document model (`events.click`), not a serializable visual prop.
