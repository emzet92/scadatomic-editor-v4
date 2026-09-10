# Local tag + UDT system

This patch adds the first project-local data runtime for SCADAtomic Designer.

## Architecture

- `uiframework/data/types`: central `DataType` union and `TypeRegistry`.
- `uiframework/data/udt`: UDT schema, instance initialization and schema synchronization.
- `uiframework/data/tags`: persisted tags, `TagStore`, `tag.changed` and subscriptions.
- `uiframework/data/runtime`: UDT instance proxy and method execution (`self`).
- `uiframework/gui/data`: Designer UI for `Data -> Tags / UDTs`.
- `mock/mock-tag-runtime.ts`: project-local mock runtime TagStore used by script execution.

`UiDocument.data` persists UDT definitions, method source, primitive values and UDT instance values with the existing project save/reload flow. Old v4 documents remain valid because `data` is additive/optional and is initialized when a new document is created.

## Mutation invariant

Runtime value changes do not directly mutate tag objects. `TagStore.set(path, value)` resolves the path, validates through `TypeRegistry`, compares the previous value, writes an immutable tag snapshot, emits `tag.changed`, and notifies path subscribers. UDT `self.field = value` uses a Proxy whose setter calls the same API.

## Runtime

UDT instance names are exposed as script globals in the existing mock JavaScript runtime. For a tag `Pump1 : Pump`, handlers can call `Pump1.start()` and read/write public UDT fields. Each UDT method executes with `self` bound to that one instance.

Tag changes from mock runtime are bridged to the existing `runtimeSignals` path store, so current component bindings can react without polling.

## Designer

The editor now has a `Design / Data` area switch. Data contains separate `Tags` and `UDTs` trees and reuses the editor's existing UI primitives and CodeMirror wrapper. Binding inputs also suggest known primitive tag paths.

## Validation performed

- full TypeScript project check: `tsc -b`
- full `src` ESLint
- `git diff --check`
- core acceptance script covering independent UDT instances, validation, event suppression for unchanged values, wildcard/path subscriptions, `children()`, UDT method mutation through `self`, and UDT field add/rename/delete synchronization
- mock script integration proving a normal handler containing `Pump1.start();` resolves the UDT global and changes values through TagStore
