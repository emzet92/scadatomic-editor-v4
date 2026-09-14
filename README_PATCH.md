# Reactive Binding Fixes

Base: `scadatomic-editor-reactive-runtime-source.zip`

This patch fixes three issues found in the first Reactive Runtime implementation.

## 1. Relative Component TagRef is now a first-class reactive source

Previously a reusable-component source such as `Pump.running` was persisted as legacy `kind: "tagRef"` and therefore the new transform UI was hidden.

Now it is persisted as `kind: "reactive"` with a `component-tag` dependency using stable UDT field IDs. When a component instance is materialized, the relative dependency is resolved to an absolute tag reference.

This means relative TagRef bindings support the same transforms as project-tag bindings, including Variant conditional mappings.

## 2. Variant binding UX

When the target property is `Variant`, choosing a source defaults to `Condition` instead of `Direct`.

The property panel immediately shows:

- `When true` -> existing component variant dropdown
- `When false` -> existing component variant dropdown

The choices are derived from the node's actual `variants` map.

## 3. Reactive bindings are visible in the Designer during simulation

The Editor now starts/configures the same `BindingRuntime` used by runtime rendering.

`RendererRoot` subscribes to reactive UI state and applies runtime property/variant overrides while preserving the persisted document state.

So a simulated tag change such as:

`Pump1.running: true -> false`

updates a bound Button/Pump component directly on the designer canvas.

Reusable-component internals are addressed using the same runtime scoped IDs as the runtime renderer.

## About the old warning

`Legacy/relative binding. It remains compatible and will be resolved at runtime.`

meant that a reusable component `TagRef` binding was still stored in the old pre-Reactive-Runtime format. It could resolve to a concrete tag when an instance was rendered, but it did not support the new expression/transform editor.

New relative bindings no longer use that compatibility path. Existing old relative bindings are editable and are upgraded to the new reactive form when their transform/source is edited.

## Validation

- TypeScript build: PASS
- ESLint on touched files: PASS
- `git apply --check`: PASS
